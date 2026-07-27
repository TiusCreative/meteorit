/**
 * Client untuk melakukan posting otomatis ke Facebook Page dan Instagram Business Account
 * menggunakan Meta Graph API v20.0.
 */
export async function postToFacebookPage(
  message: string,
  linkUrl?: string,
  title?: string,
  imageUrl?: string
): Promise<{ fbSuccess: boolean; igSuccess: boolean | 'skipped' | 'disabled' }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const instagramId = process.env.FACEBOOK_INSTAGRAM_ID;

  if (!pageId || !pageToken) {
    console.warn('[Facebook/Instagram] FACEBOOK_PAGE_ID atau FACEBOOK_PAGE_ACCESS_TOKEN belum dikonfigurasi di Environment Variables.');
    return { fbSuccess: false, igSuccess: 'disabled' };
  }

  let fbSuccess = false;
  let igSuccess: boolean | 'skipped' | 'disabled' = 'skipped';

  // === 1. POSTING KE FACEBOOK PAGE (FORMAT 2: LINK SHARE POST) ===
  try {
    console.log(`[Facebook] Mengirim postingan link share ke Halaman ${pageId}...`);
    const fbPayload: any = {
      message: title ? `${title}\n\n${message}` : message,
      access_token: pageToken,
    };
    if (linkUrl) {
      fbPayload.link = linkUrl;
    }

    const fbFeedRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fbPayload),
    });

    const feedData = await fbFeedRes.json();
    if (fbFeedRes.ok && feedData.id) {
      console.log(`[Facebook] ✅ Berhasil posting link share ke Halaman. ID: ${feedData.id}`);
      fbSuccess = true;
    } else {
      console.error('[Facebook] ❌ Gagal posting link share:', feedData);
      
      // Fallback ke upload foto jika posting link gagal dan ada imageUrl
      if (imageUrl) {
        console.log('[Facebook] Mencoba fallback ke postingan foto...');
        const captionParts = [];
        if (title) captionParts.push(title);
        if (message) captionParts.push(message);
        if (linkUrl) captionParts.push(`Baca selengkapnya: ${linkUrl}`);
        const captionText = captionParts.join('\n\n');

        const fbPhotoRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption: captionText,
            access_token: pageToken,
          }),
        });
        const photoData = await fbPhotoRes.json();
        if (fbPhotoRes.ok && photoData.id) {
          console.log(`[Facebook] ✅ Berhasil posting foto (Fallback). ID: ${photoData.id}`);
          fbSuccess = true;
        } else {
          console.error('[Facebook] ❌ Fallback posting foto juga gagal:', photoData);
        }
      }
    }
  } catch (err) {
    console.error('[Facebook] Gagal menghubungi Facebook Graph API:', err);
  }

  // === 2. POSTING KE INSTAGRAM ===
  // Instagram tidak mendukung format link share (tautan tidak aktif di deskripsi).
  // Instagram wajib memposting file gambar atau video, sehingga tetap menggunakan format Foto.
  if (instagramId && imageUrl) {
    try {
      console.log(`[Instagram] Membuat media container di Instagram Account ${instagramId}...`);
      const igCaption = title ? `${title}\n\n${message}${linkUrl ? `\n\nLink: ${linkUrl}` : ''}` : `${message}${linkUrl ? `\n\nLink: ${linkUrl}` : ''}`;
      
      const containerRes = await fetch(`https://graph.facebook.com/v20.0/${instagramId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: igCaption,
          access_token: pageToken,
        }),
      });

      const containerData = await containerRes.json();
      if (containerRes.ok && containerData.id) {
        const creationId = containerData.id;
        console.log(`[Instagram] Media container berhasil dibuat. ID: ${creationId}. Memulai publikasi...`);

        // Jeda 3 detik agar media diproses di server Instagram sebelum dipublikasikan
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const publishRes = await fetch(`https://graph.facebook.com/v20.0/${instagramId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: pageToken,
          }),
        });

        const publishData = await publishRes.json();
        if (publishRes.ok && publishData.id) {
          console.log(`[Instagram] ✅ Media berhasil dipublikasikan. ID: ${publishData.id}`);
          igSuccess = true;
        } else {
          console.error('[Instagram] ❌ Gagal mempublikasikan media container:', publishData);
          igSuccess = false;
        }
      } else {
        console.error('[Instagram] ❌ Gagal membuat media container:', containerData);
        igSuccess = false;
      }
    } catch (err) {
      console.error('[Instagram] Gagal menghubungi Instagram Graph API:', err);
      igSuccess = false;
    }
  } else if (!instagramId) {
    igSuccess = 'skipped';
  } else {
    console.log('[Instagram] Lewati posting karena tidak ada imageUrl (Instagram mewajibkan media gambar/video).');
    igSuccess = 'skipped';
  }

  return { fbSuccess, igSuccess };
}
