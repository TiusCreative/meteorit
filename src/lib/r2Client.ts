import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import R2_CONFIG from './cloudflareR2Config';

// Initialize S3 Client for Cloudflare R2
export const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.s3Endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey
  }
});

/**
 * Uploads a file buffer or string to Cloudflare R2
 */
export async function uploadToR2(key: string, body: Buffer | string, contentType: string): Promise<string> {
  const uploadParams = {
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: body,
    ContentType: contentType
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    return `${R2_CONFIG.publicUrl}/${key}`;
  } catch (error: any) {
    if (error?.name === 'Unauthorized' || error?.message?.includes('Unauthorized') || error?.$metadata?.httpStatusCode === 401) {
      console.error(`[R2 Auth Error] Cloudflare R2 S3 Token (401 Unauthorized). AccessKeyId: ${R2_CONFIG.accessKeyId}`);
      throw new Error(`Kredensial Cloudflare R2 tidak valid atau telah kedaluwarsa (401 Unauthorized). Mohon buat R2 API Token baru di Cloudflare Dashboard dan perbarui R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY.`);
    }
    throw error;
  }
}

/**
 * Reads a JSON file from Cloudflare R2
 */
export async function fetchJsonFromR2<T>(key: string): Promise<T | null> {
  // 1. Primary: Direct high-speed Edge HTTP fetch via CDN (0ms CPU, prevents Cloudflare Error 1102)
  try {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.meteorit.my.id';
    const publicBase = R2_CONFIG.publicUrl || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
    
    // Coba via CDN custom domain dulu, fallback ke public r2.dev
    let res = await fetch(`${cdnBase}/${key}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      res = await fetch(`${publicBase}/${key}`, { signal: AbortSignal.timeout(3000) });
    }

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (fetchErr) {
    // Lanjutkan ke S3 fallback jika fetch gagal
  }

  // 2. Fallback: Authenticated S3 client jika file belum ter-cache di CDN
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    }));

    if (!response.Body) return null;
    const bodyStr = await response.Body.transformToString();
    return JSON.parse(bodyStr) as T;
  } catch (error: any) {
    if ((error as any)?.Code === 'NoSuchKey' || (error as any)?.name === 'NoSuchKey') {
      return null;
    }
    if (error?.name === 'Unauthorized' || error?.message?.includes('Unauthorized') || error?.$metadata?.httpStatusCode === 401) {
      console.error(`[R2 Auth Error] fetchJsonFromR2 401 Unauthorized untuk key: ${key}. Periksa R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY.`);
    } else {
      console.error(`Error reading ${key} from R2:`, error);
    }
    return null;
  }
}

/**
 * Deletes a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    }));
    return true;
  } catch (error) {
    console.error(`Error deleting ${key} from R2:`, error);
    return false;
  }
}

