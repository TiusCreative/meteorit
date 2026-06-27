import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

  await s3Client.send(new PutObjectCommand(uploadParams));
  return `${R2_CONFIG.publicUrl}/${key}`;
}

/**
 * Reads a JSON file from Cloudflare R2
 */
export async function fetchJsonFromR2<T>(key: string): Promise<T | null> {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    }));

    if (!response.Body) return null;
    const bodyStr = await response.Body.transformToString();
    return JSON.parse(bodyStr) as T;
  } catch (error) {
    if ((error as any)?.Code === 'NoSuchKey' || (error as any)?.name === 'NoSuchKey') {
      return null;
    }
    console.error(`Error reading ${key} from R2:`, error);
    return null;
  }
}
