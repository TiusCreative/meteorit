import { uploadToR2 } from './r2Client';
import { convertToWebp } from './imageConverter';

/**
 * Generates an image using Pollinations AI with a fallback to Cloudflare Workers AI.
 * The generated image is uploaded to R2, and the R2 public URL is returned.
 * 
 * @param prompt The prompt to generate the image for
 * @param r2Path The path to upload the image to in R2 (e.g. 'data/blog/images/xyz.jpg')
 */
export async function generateImageWithFallback(prompt: string, r2Path: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&nologo=true`;

  console.log(`[ImageGen] Generating image. Prompt: "${prompt}"`);
  
  // 1. Try Pollinations AI
  try {
    console.log(`[ImageGen] Attempting Pollinations AI...`);
    const res = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      let buffer: Buffer = Buffer.from(await res.arrayBuffer()) as any;
      if (buffer.length > 5000) { // Verify it's a real image buffer and not a tiny text error
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
      body: JSON.stringify({ prompt }),
      next: { revalidate: 0 }
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
    // Return the original static placeholder as final fallback
    return `https://placehold.co/800x500/020617/f59e0b?text=${encodeURIComponent(prompt.substring(0, 15))}`;
  }
}
