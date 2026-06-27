import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { s3Client, uploadToR2 } from '@/lib/r2Client';
import { GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import R2_CONFIG from '@/lib/cloudflareR2Config';

export const dynamic = 'force-dynamic';

// Fetch collection helper
async function getCollectionData(collectionName: string) {
  const snapshot = await adminDb.collection(collectionName).get();
  const data: any[] = [];
  snapshot.forEach((doc: any) => {
    data.push({ _id: doc.id, ...doc.data() });
  });
  return data;
}

export async function GET() {
  try {
    // List backups in R2 folder backups/
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: 'backups/'
    }));

    const files = response.Contents
      ?.map(c => ({
        key: c.Key || '',
        name: (c.Key || '').replace('backups/', ''),
        size: c.Size,
        lastModified: c.LastModified
      }))
      .filter(f => f.name.endsWith('.json')) || [];

    return NextResponse.json({ success: true, backups: files });
  } catch (error) {
    console.error('Error listing backups:', error);
    // Return empty list if bucket prefix doesn't exist yet
    return NextResponse.json({ success: true, backups: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { action, fileName } = await request.json();

    if (action === 'backup') {
      // Export tables
      const meteorites = await getCollectionData('meteorites');
      const articles = await getCollectionData('articles');
      const forumPosts = await getCollectionData('forum_posts');
      const forumComments = await getCollectionData('forum_comments');
      const settings = await getCollectionData('settings');

      const backupPackage = {
        timestamp: new Date().toISOString(),
        meteorites,
        articles,
        forumPosts,
        forumComments,
        settings
      };

      const name = `backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      const key = `backups/${name}`;

      await uploadToR2(key, JSON.stringify(backupPackage, null, 2), 'application/json');

      return NextResponse.json({ success: true, message: `Backup created: ${name}`, file: name });
    }

    if (action === 'restore') {
      if (!fileName) {
        return NextResponse.json({ success: false, error: 'File name is required' }, { status: 400 });
      }

      // Download backup from R2
      const res = await s3Client.send(new GetObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: `backups/${fileName}`
      }));

      if (!res.Body) throw new Error('Backup file body is empty');
      const dataStr = await res.Body.transformToString();
      const backupData = JSON.parse(dataStr);

      // Restore helper
      const restoreCollection = async (colName: string, items: any[]) => {
        if (!items || !Array.isArray(items)) return;
        const colRef = adminDb.collection(colName);
        
        // Delete current documents
        const snapshot = await colRef.get();
        const deletePromises: any[] = [];
        snapshot.forEach((doc: any) => {
          deletePromises.push(doc.ref.delete());
        });
        await Promise.all(deletePromises);

        // Batch write new documents
        const batch = adminDb.batch();
        items.forEach(item => {
          const { _id, ...docData } = item;
          const docRef = _id ? colRef.doc(_id) : colRef.doc();
          batch.set(docRef, docData);
        });
        await batch.commit();
      };

      await restoreCollection('meteorites', backupData.meteorites);
      await restoreCollection('articles', backupData.articles);
      await restoreCollection('forum_posts', backupData.forumPosts);
      await restoreCollection('forum_comments', backupData.forumComments);
      await restoreCollection('settings', backupData.settings);

      return NextResponse.json({ success: true, message: `Database successfully restored from ${fileName}` });
    }

    if (action === 'delete') {
      if (!fileName) {
        return NextResponse.json({ success: false, error: 'File name is required' }, { status: 400 });
      }

      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: `backups/${fileName}`
      }));

      return NextResponse.json({ success: true, message: `Backup file ${fileName} deleted successfully` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Backup/Restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Backup operation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
