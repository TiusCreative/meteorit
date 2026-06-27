import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [usersSnap, articlesSnap, meteoritesSnap, postsSnap, donationsSnap] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('articles').get(),
      adminDb.collection('meteorites').get(),
      adminDb.collection('forum_posts').get(),
      adminDb.collection('donations').get(),
    ]);

    let totalDonations = 0;
    donationsSnap.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'Completed' && typeof data.amount === 'number') {
        totalDonations += data.amount;
      }
    });

    const totalUsers = usersSnap.size;
    const totalArticles = articlesSnap.size;
    const totalMeteorites = meteoritesSnap.size;
    const totalForumPosts = postsSnap.size;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalArticles,
        totalMeteorites,
        totalForumPosts,
        totalDonations,
        activeUsers: totalUsers, // akan ditingkatkan dengan Google Analytics nanti
      }
    });
  } catch (error) {
    console.error('Error fetching analytics report:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to build analytics report',
      details: error instanceof Error ? error.message : String(error),
      stats: {
        totalUsers: 0,
        totalArticles: 0,
        totalMeteorites: 0,
        totalForumPosts: 0,
        totalDonations: 0,
        activeUsers: 0,
      }
    }, { status: 500 });
  }
}