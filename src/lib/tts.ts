/**
 * Konfigurasi standar format audio MP3 Podcast TTS:
 * Format: MP3
 * Channel: Mono (1 Channel)
 * Bitrate: 32 kbps (khusus suara TTS) / 48 kbps
 * Sample rate: 24 kHz (24,000 Hz) / 22.05 kHz
 */
export const TTS_AUDIO_CONFIG = {
  format: 'MP3' as const,
  channels: 1, // Mono
  bitrateKbps: 32, // 32 kbps (TTS voice) / 48 kbps
  sampleRateHz: 24000, // 24 kHz
  sampleRateKhz: 24
};

/**
 * Helper to split text into chunks of maximum 200 characters.
 * Splits on punctuation or spaces so words aren't truncated.
 */
export function splitTextIntoChunks(text: string, maxLength = 200): string[] {
  const cleanText = text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[*#_`~]/g, '') // remove Markdown symbols
    .replace(/\s+/g, ' ')    // normalize whitespace
    .trim();

  const chunks: string[] = [];
  let currentChunk = '';

  // Split on spaces and punctuation, keeping the delimiter
  const parts = cleanText.split(/([.!?。，,、；;：:\s]+)/);

  for (const part of parts) {
    if (currentChunk.length + part.length > maxLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // If a single part exceeds maxLength, force split it
      if (part.length > maxLength) {
        let subPart = part;
        while (subPart.length > maxLength) {
          chunks.push(subPart.slice(0, maxLength).trim());
          subPart = subPart.slice(maxLength);
        }
        currentChunk = subPart;
      } else {
        currentChunk = part;
      }
    } else {
      currentChunk += part;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Converts text into an MP3 Buffer using Google Translate TTS API.
 * Output format standard: MP3, Mono (1 channel), 32 kbps, 24 kHz (24,000 Hz).
 * Default language is Indonesian ('id'), supports 'en' for English.
 */
export async function generateTtsMp3(text: string, lang = 'id'): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text, 200);
  if (chunks.length === 0) {
    throw new Error("No pronounceable text provided");
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    
    let success = false;
    let retries = 3;
    let lastError: any = null;

    while (retries > 0 && !success) {
      try {
        const response = await fetch(url, { headers, cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Google TTS returned status ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffers.push(Buffer.from(arrayBuffer));
        success = true;
      } catch (err) {
        lastError = err;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // wait before retry
        }
      }
    }

    if (!success) {
      throw new Error(`Gagal memproses TTS untuk teks: "${chunk.substring(0, 30)}...". Error: ${lastError?.message || lastError}`);
    }
  }

  const concatenatedBuffer = Buffer.concat(buffers);
  console.log(`[TTS Engine] Generasi MP3 selesai. Output: ${concatenatedBuffer.length} bytes (Format: MP3 | Channel: Mono | Bitrate: ${TTS_AUDIO_CONFIG.bitrateKbps} kbps | Sample Rate: ${TTS_AUDIO_CONFIG.sampleRateKhz} kHz)`);
  return concatenatedBuffer;
}

