/**
 * Mengonversi gambar dari Buffer format apa saja (JPEG, PNG, dll)
 * menjadi format WebP dengan kualitas 75% (default).
 * Menggunakan dynamic import untuk sharp agar aman di environment serverless.
 */
export async function convertToWebp(
  buffer: Buffer,
  quality = 75
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  try {
    const sharp = (await import('sharp')).default;
    const webpBuffer = await sharp(buffer)
      .webp({ quality })
      .toBuffer();
    
    return {
      buffer: webpBuffer,
      contentType: 'image/webp',
      ext: 'webp'
    };
  } catch (error) {
    console.warn('[ImageConverter] Gagal mengonversi gambar ke WebP (sharp), menggunakan format asli:', error);
    return {
      buffer,
      contentType: 'image/jpeg', // Fallback default
      ext: 'jpg'
    };
  }
}
