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
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
  const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';
  const model = '@cf/black-forest-labs/flux-1-schnell';
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  console.log(`[ImageGen] Generating unique banner image. Prompt: "${prompt}"`);
  
  // 1. Primary: Cloudflare Workers AI FLUX (Fast, high-fidelity, native CF)
  try {
    console.log(`[ImageGen] Attempting Cloudflare Workers AI (${model})...`);
    const cfResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfAiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: `${prompt}, high quality, realistic space photography`
      }),
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(25000) : undefined
    });

    if (cfResponse.ok) {
      const contentType = cfResponse.headers.get('content-type') || '';
      let buffer: Buffer;

      if (contentType.includes('application/json')) {
        const json: any = await cfResponse.json();
        if (json?.result?.image) {
          buffer = Buffer.from(json.result.image, 'base64');
        } else {
          throw new Error('Cloudflare Workers AI JSON missing result.image');
        }
      } else {
        buffer = Buffer.from(await cfResponse.arrayBuffer()) as any;
      }

      if (buffer.length > 1000) {
        const converted = await convertToWebp(buffer, 80);
        const finalPath = r2Path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const publicUrl = await uploadToR2(finalPath, converted.buffer, converted.contentType);
        console.log(`[ImageGen] Successfully generated via Cloudflare Workers AI FLUX. Saved to R2: ${publicUrl}`);
        return publicUrl;
      }
    } else {
      const errorText = await cfResponse.text();
      console.warn(`[ImageGen] Cloudflare Workers AI returned status ${cfResponse.status}: ${errorText.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn(`[ImageGen] Cloudflare Workers AI attempt failed:`, err);
  }

  // 2. Secondary: Fallback to Pollinations AI
  try {
    console.log(`[ImageGen] Attempting Pollinations AI fallback...`);
    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&nologo=true&seed=${seed}&enhance=true`;
    const res = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      },
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(20000) : undefined
    });

    if (res.ok) {
      let buffer: Buffer = Buffer.from(await res.arrayBuffer()) as any;
      if (buffer.length > 5000) {
        const converted = await convertToWebp(buffer, 80);
        const finalPath = r2Path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const publicUrl = await uploadToR2(finalPath, converted.buffer, converted.contentType);
        console.log(`[ImageGen] Successfully generated via Pollinations AI. Saved to R2: ${publicUrl}`);
        return publicUrl;
      }
    }
  } catch (pollErr) {
    console.warn(`[ImageGen] Pollinations AI failed:`, pollErr);
  }

  // 3. Category-specific fallback image jika semua generator gagal (TIDAK BOLEH blind nasa-apod.webp)
  const R2_PUBLIC = process.env.R2_PUBLIC_URL || 'https://cdn.meteorit.my.id';
  if (r2Path.includes('eonet')) {
    return `${R2_PUBLIC}/data/test/flux-wildfire.webp`;
  } else if (r2Path.includes('fireball')) {
    return `${R2_PUBLIC}/data/meteorites/images/nasa-meteorite.webp`;
  } else if (r2Path.includes('komet') || r2Path.includes('asteroid')) {
    return `${R2_PUBLIC}/data/blog/images/fallback-komet.jpg`;
  } else if (r2Path.includes('mars')) {
    return `${R2_PUBLIC}/data/blog/images/fallback-mars.jpg`;
  } else if (r2Path.includes('meteorite') || r2Path.includes('meteorites')) {
    return `${R2_PUBLIC}/data/meteorites/images/fallback-meteorit.jpg`;
  }
  return `${R2_PUBLIC}/data/blog/images/fallback-komet.jpg`;
}
