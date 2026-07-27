/**
 * Integrasi Bluesky API (AT Protocol)
 * Berjalan di server-side untuk memposting status secara otomatis
 */

export async function postToBluesky(message: string, linkUrl?: string): Promise<boolean> {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!identifier || !password) {
    console.warn('[Bluesky] BLUESKY_IDENTIFIER atau BLUESKY_APP_PASSWORD tidak ditemukan di environment variables.');
    return false;
  }

  try {
    // Normalisasi identifier: hapus prefix '@' jika ada
    const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;

    // 1. Membuat Sesi Baru (Login)
    const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: cleanIdentifier,
        password,
      }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error('[Bluesky] Gagal membuat sesi autentikasi:', errText);
      return false;
    }

    const session = await sessionRes.json();
    const { accessJwt, did } = session;

    if (!accessJwt || !did) {
      console.error('[Bluesky] Token accessJwt atau DID tidak valid setelah login.');
      return false;
    }

    // 2. Format Teks - Bluesky limit 295 karakter
    // Sisakan ruang untuk URL jika ada (menggunakan panjang URL sebenarnya + 1 untuk newline)
    const urlLength = linkUrl ? linkUrl.length + 1 : 0;
    const maxMsgLength = 295 - urlLength;
    
    let truncatedMessage = message;
    if (maxMsgLength > 3) {
      if (message.length > maxMsgLength) {
        truncatedMessage = message.substring(0, maxMsgLength - 3) + '...';
      }
    } else {
      // Jika URL sangat panjang sehingga tidak ada ruang untuk pesan, kosongkan pesan
      truncatedMessage = '';
    }
    
    const postText = (linkUrl && truncatedMessage)
      ? `${truncatedMessage}\n${linkUrl}`
      : (linkUrl || truncatedMessage);

    // 3. Hitung facets (link) menggunakan byte offset untuk URL
    const facets: any[] = [];
    
    if (linkUrl) {
      // Hitung byte offset untuk URL di dalam postText
      const textBeforeUrl = `${truncatedMessage}\n`;
      const byteStart = new TextEncoder().encode(textBeforeUrl).length;
      const byteEnd = new TextEncoder().encode(postText).length;
      
      facets.push({
        index: {
          byteStart,
          byteEnd,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: linkUrl,
          },
        ],
      });
    }

    // 4. Buat record payload
    const recordPayload: any = {
      $type: 'app.bsky.feed.post',
      text: postText,
      createdAt: new Date().toISOString(),
    };

    if (facets.length > 0) {
      recordPayload.facets = facets;
    }

    // 5. Tambahkan external card jika linkUrl tersedia
    if (linkUrl) {
      recordPayload.embed = {
        $type: 'app.bsky.embed.external',
        external: {
          uri: linkUrl,
          title: message.split('\n')[0]?.substring(0, 100) || 'Meteorit Indonesia',
          description: message.substring(0, 200),
        },
      };
    }

    const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessJwt}`,
      },
      body: JSON.stringify({
        repo: did,
        collection: 'app.bsky.feed.post',
        record: recordPayload,
      }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.error('[Bluesky] Gagal memposting record:', errText);
      return false;
    }

    console.log('[Bluesky] Berhasil memposting status ke feed.');
    return true;
  } catch (error) {
    console.error('[Bluesky] Terjadi kesalahan dalam pemanggilan API:', error);
    return false;
  }
}
