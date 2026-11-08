import { uploadToR2 } from './r2Client';
import { convertToWebp } from './imageConverter';
import { isBadImageUrl } from './imageSafeguard';

/**
 * Generates a unique image using Pollinations AI with a fallback to Cloudflare Workers AI.
 * The generated image is converted to WebP, uploaded to Cloudflare R2, and the R2 URL is returned.
 * 
 * @param prompt The prompt describing the desired image
 * @param r2Path The path to upload the image to in R2 (e.g. 'data/blog/images/xyz.webp')
 */
export async function generateImageWithFallback(prompt: string, r2Path: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(prompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&nologo=true&seed=${seed}&enhance=true`;

  console.log(`[ImageGen] Generating unique image (seed: ${seed}). Prompt: "${prompt}"`);
  
  // 1. Try Pollinations AI with a strict 5s timeout
  try {
    console.log(`[ImageGen] Attempting Pollinations AI...`);
    const res = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      },
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined
    });

    if (res.ok) {
      let buffer: Buffer = Buffer.from(await res.arrayBuffer()) as any;
      if (buffer.length > 5000) { // Verify it's a real image buffer
        let finalContentType = 'image/jpeg';
        let finalPath = r2Path;

        // Convert to WebP 75%
        const converted = await convertToWebp(buffer, 75);
        buffer = converted.buffer;
        finalContentType = converted.contentType;
        if (converted.ext === 'webp') {
          finalPath = r2Path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        }

        const publicUrl = await uploadToR2(finalPath, buffer, finalContentType);
        console.log(`[ImageGen] Successfully generated via Pollinations AI. Saved to R2: ${publicUrl}`);
        return publicUrl;
      }
    }
    throw new Error(`Pollinations AI returned status ${res.status} or small buffer size.`);
  } catch (err) {
    console.warn(`[ImageGen] Pollinations AI failed:`, err);
  }

  // 2. Fallback to Cloudflare Workers AI
  const accountId = process.env.R2_ACCOUNT_ID || '';
  const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN || '';
  const model = '@cf/bytedance/stable-diffusion-xl-lightning';
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  try {
    console.log(`[ImageGen] Attempting Cloudflare Workers AI fallback...`);
    const cfResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfAiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: `${prompt}, high quality, realistic space photography, seed ${seed}`,
        seed
      }),
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined
    });

    if (!cfResponse.ok) {
      const errorText = await cfResponse.text();
      throw new Error(`Cloudflare AI API returned status ${cfResponse.status}: ${errorText}`);
    }

    let buffer: Buffer = Buffer.from(await cfResponse.arrayBuffer()) as any;
    if (buffer.length < 1000) {
      throw new Error(`Cloudflare Workers AI returned invalid small buffer: ${buffer.length} bytes`);
    }

    let finalContentType = 'image/png';
    let finalPath = r2Path;

    // Convert to WebP 75%
    const converted = await convertToWebp(buffer, 75);
    buffer = converted.buffer;
    finalContentType = converted.contentType;
    if (converted.ext === 'webp') {
      finalPath = r2Path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    const publicUrl = await uploadToR2(finalPath, buffer, finalContentType);
    console.log(`[ImageGen] Successfully generated via Cloudflare Workers AI. Saved to R2: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[ImageGen] Cloudflare Workers AI fallback failed:`, err);
    // JANGAN return placehold.co — gunakan R2 static fallback
    // yang pasti ada (sudah pre-upload) agar banner tidak blank
    const R2_PUBLIC = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
    return `${R2_PUBLIC}/data/glossary/images/nasa-apod.webp`;
  }
}
