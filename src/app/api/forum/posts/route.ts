import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

// GET: Fetch latest posts
export async function GET() {
  try {
    // 1. Try fetching from Cloudflare D1
    try {
      const dbRes = await queryD1(`SELECT * FROM forum_posts ORDER BY createdAt DESC LIMIT 50`);
      if (dbRes.success && dbRes.results) {
        const posts = dbRes.results.map((r: any) => {
          let votedUsers = [];
          try {
            votedUsers = typeof r.votedUsers === 'string' ? JSON.parse(r.votedUsers) : r.votedUsers || [];
          } catch {
            votedUsers = [];
          }
          return {
            ...r,
            votedUsers,
            votes: Number(r.votes) || 0,
          };
        });

        // If D1 is populated, return D1 data
        if (posts.length > 0) {
          return NextResponse.json({ success: true, source: 'd1', posts });
        }
      }
    } catch (d1Err) {
      console.warn('[API Forum Posts] D1 query failed, trying Firestore fallback:', d1Err);
    }

    // 2. Fallback to Firebase Firestore
    const { adminDb } = await import('@/lib/firebaseAdmin');
    const snapshot = await adminDb.collection('forum_posts').orderBy('createdAt', 'desc').limit(50).get();
    const posts: any[] = [];
    
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      posts.push({
        id: docSnap.id,
        title: data.title || '',
        content: data.content || '',
        category: data.category || 'Diskusi',
        imageUrl: data.imageUrl || null,
        votes: Number(data.votes) || 0,
        votedUsers: data.votedUsers || [],
        authorId: data.authorId || '',
        authorName: data.authorName || 'Anonim',
        authorPhoto: data.authorPhoto || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true, source: 'firestore_fallback', posts });
  } catch (err: any) {
    console.error('[API Forum Posts GET] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err), posts: [] }, { status: 500 });
  }
}

// POST: Create a new post
export async function POST(req: NextRequest) {
  try {
    const { title, content, category, imageUrl, authorId, authorName, authorPhoto } = await req.json();

    if (!title || !content || !authorId || !authorName) {
      return NextResponse.json({ success: false, error: 'Judul, konten, dan data penulis wajib diisi.' }, { status: 400 });
    }

    const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    // 1. Save to D1 database
    try {
      await queryD1(
        `INSERT INTO forum_posts (id, title, content, category, imageUrl, votes, votedUsers, authorId, authorName, authorPhoto, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [postId, title, content, category || 'Diskusi', imageUrl || null, 0, '[]', authorId, authorName, authorPhoto || null, createdAt]
      );
    } catch (d1Err) {
      console.error('[API Forum Posts POST] Gagal menyimpan ke D1:', d1Err);
      // Continue to Firestore anyway to keep system online
    }

    // 2. Synchronize to Firestore
    try {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      await adminDb.collection('forum_posts').doc(postId).set({
        title,
        content,
        category: category || 'Diskusi',
        imageUrl: imageUrl || null,
        votes: 0,
        votedUsers: [],
        authorId,
        authorName,
        authorPhoto: authorPhoto || '',
        createdAt: new Date(), // Firestore native timestamp
      });
    } catch (fsErr) {
      console.error('[API Forum Posts POST] Gagal melakukan sinkronisasi Firestore:', fsErr);
    }

    return NextResponse.json({ success: true, postId });
  } catch (err: any) {
    console.error('[API Forum Posts POST] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}

// PUT: Upvote / Like a post
export async function PUT(req: NextRequest) {
  try {
    const { postId, userId } = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ success: false, error: 'Post ID dan User ID wajib diisi.' }, { status: 400 });
    }

    let hasVoted = false;
    let newVotes = 0;
    let newVotedUsers: string[] = [];

    // 1. Load from D1 to compute the vote state
    try {
      const dbRes = await queryD1(`SELECT * FROM forum_posts WHERE id = ?`, [postId]);
      if (dbRes.success && dbRes.results && dbRes.results.length > 0) {
        const post = dbRes.results[0];
        let votedUsers: string[] = [];
        try {
          votedUsers = typeof post.votedUsers === 'string' ? JSON.parse(post.votedUsers) : post.votedUsers || [];
        } catch {
          votedUsers = [];
        }
        
        hasVoted = votedUsers.includes(userId);
        newVotes = Number(post.votes) || 0;
        
        if (hasVoted) {
          newVotes = Math.max(0, newVotes - 1);
          newVotedUsers = votedUsers.filter(uid => uid !== userId);
        } else {
          newVotes += 1;
          newVotedUsers = [...votedUsers, userId];
        }

        // Update D1
        await queryD1(
          `UPDATE forum_posts SET votes = ?, votedUsers = ? WHERE id = ?`,
          [newVotes, JSON.stringify(newVotedUsers), postId]
        );
      }
    } catch (d1Err) {
      console.warn('[API Forum Posts PUT] Gagal mengubah D1, mencoba mode fallback Firestore:', d1Err);
      // Fallback: load directly from Firestore if D1 fails
      const { adminDb } = await import('@/lib/firebaseAdmin');
      const docSnap = await adminDb.collection('forum_posts').doc(postId).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        const votedUsers = data?.votedUsers || [];
        hasVoted = votedUsers.includes(userId);
        newVotes = Number(data?.votes) || 0;
        if (hasVoted) {
          newVotes = Math.max(0, newVotes - 1);
          newVotedUsers = votedUsers.filter((uid: string) => uid !== userId);
        } else {
          newVotes += 1;
          newVotedUsers = [...votedUsers, userId];
        }
      }
    }

    // 2. Synchronize to Firestore
    try {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      await adminDb.collection('forum_posts').doc(postId).update({
        votes: newVotes,
        votedUsers: newVotedUsers,
      });
    } catch (fsErr) {
      console.error('[API Forum Posts PUT] Gagal melakukan sinkronisasi upvote ke Firestore:', fsErr);
    }

    return NextResponse.json({ success: true, votes: newVotes, votedUsers: newVotedUsers });
  } catch (err: any) {
    console.error('[API Forum Posts PUT] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
