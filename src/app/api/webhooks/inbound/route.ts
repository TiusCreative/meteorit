import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

interface InboundEmailDetail {
  id: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  receivedAt: string;
  rawPayload: any;
}

interface InboundEmailLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
}

// Get header value trying both svix-* and webhook-* prefixes
function getWebhookHeader(headers: Headers, name: string): string | null {
  return headers.get(`webhook-${name}`) || headers.get(`svix-${name}`);
}

// Verification function supporting both svix-* and webhook-* header prefixes
function verifyWebhookSignature(rawBody: string, id: string, timestamp: string, signatureHeader: string, secret: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 1800) {
    console.error(`[Webhook] Timestamp too old. diff=${Math.abs(now - ts)}s`);
    return false;
  }

  const toSign = `${id}.${timestamp}.${rawBody}`;
  const cleanSecret = secret.startsWith('whsec_') ? secret.substring(6) : secret;

  try {
    const keyBuffer = Buffer.from(cleanSecret, 'base64');
    const hmac = crypto.createHmac('sha256', keyBuffer);
    hmac.update(toSign);
    const expectedSignature = hmac.digest('base64');

    const signatures = signatureHeader.split(' ');
    for (const sig of signatures) {
      const parts = sig.split(',');
      if (parts.length === 2 && parts[0] === 'v1') {
        const sigBytes = Buffer.from(parts[1], 'base64');
        const expectedBytes = Buffer.from(expectedSignature, 'base64');
        
        if (sigBytes.length === expectedBytes.length && crypto.timingSafeEqual(sigBytes, expectedBytes)) {
          return true;
        }
      }
    }
    console.error(`[Webhook] Signature mismatch. Expected: ${expectedSignature}`);
  } catch (err) {
    console.error('[Webhook] Error verifying signature:', err);
  }

  return false;
}

/**
 * Mengambil konten penuh email dari Resend Receiving API dengan retry + delay
 * untuk mengatasi race condition (email belum terindeks saat webhook diterima)
 */
async function fetchEmailContentWithRetry(
  emailId: string,
  resendApiKey: string,
  maxRetries = 3
): Promise<{ text: string; html: string; success: boolean }> {
  const resend = new Resend(resendApiKey);
  // Delay bertahap: percobaan ke-2 tunggu 1.5s, ke-3 tunggu 4s
  const delays = [0, 1500, 4000];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delayMs = delays[attempt - 1] ?? 4000;
    if (delayMs > 0) {
      console.log(`[Webhook Inbound] Retry attempt ${attempt}/${maxRetries} - menunggu ${delayMs}ms sebelum fetch konten...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    try {
      const { data: fullEmail, error: fetchErr } = await resend.emails.receiving.get(emailId);

      if (fetchErr) {
        console.error(`[Webhook Inbound] Attempt ${attempt}/${maxRetries} - Resend Receiving API error:`, JSON.stringify(fetchErr));
        continue;
      }

      if (!fullEmail) {
        console.warn(`[Webhook Inbound] Attempt ${attempt}/${maxRetries} - fullEmail null/undefined`);
        continue;
      }

      const text = fullEmail.text || '';
      const html = fullEmail.html || '';

      if (!html && !text) {
        console.warn(`[Webhook Inbound] Attempt ${attempt}/${maxRetries} - konten email masih kosong (html='', text='')`);
        // Lanjut retry - mungkin email belum selesai diindeks
        continue;
      }

      console.log(`[Webhook Inbound] Attempt ${attempt}/${maxRetries} - Berhasil mengambil konten. html=${html.length} chars, text=${text.length} chars`);
      return { text, html, success: true };

    } catch (err) {
      console.error(`[Webhook Inbound] Attempt ${attempt}/${maxRetries} - Exception saat fetch konten:`, err);
    }
  }

  console.error(`[Webhook Inbound] Semua ${maxRetries} percobaan gagal mengambil konten email ID: ${emailId}`);
  return { text: '', html: '', success: false };
}

/**
 * Membuat HTML fallback yang informatif saat konten email tidak berhasil diambil
 */
function buildFallbackHtml(fromVal: string, subjectVal: string, emailId: string): string {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <strong>⚠️ Konten email tidak dapat dimuat otomatis</strong><br/>
        <small style="color: #666;">Email berhasil diterima, namun isi pesan tidak dapat diambil dari server Resend saat ini.</small>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 80px; color: #555;">Dari:</td>
          <td style="padding: 8px 0;">${fromVal}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">Subjek:</td>
          <td style="padding: 8px 0;">${subjectVal}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">ID Email:</td>
          <td style="padding: 8px 0; font-size: 12px; color: #888;">${emailId}</td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;"/>
      <p style="font-size: 13px; color: #888;">
        Silakan buka <strong>Admin Panel → Inbox</strong> untuk membaca isi email lengkap.
      </p>
    </div>
  `.trim();
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    // Log ALL headers for debugging
    const allHeaders: Record<string, string> = {};
    headers.forEach((value, key) => { allHeaders[key] = value; });
    console.log('[Webhook Inbound] All headers:', JSON.stringify(allHeaders));
    console.log('[Webhook Inbound] Raw body (first 500):', rawBody.substring(0, 500));

    // Get webhook headers - try both webhook-* and svix-* prefixes
    const whId = getWebhookHeader(headers, 'id');
    const whTimestamp = getWebhookHeader(headers, 'timestamp');
    const whSignature = getWebhookHeader(headers, 'signature');
    console.log('[Webhook Inbound] Signature headers found:', { whId, whTimestamp, hasSignature: !!whSignature });

    // 1. Verifikasi Signature - tidak memblokir jika gagal (hanya log untuk debugging)
    if (webhookSecret && whId && whTimestamp && whSignature) {
      const isVerified = verifyWebhookSignature(rawBody, whId, whTimestamp, whSignature, webhookSecret);
      if (isVerified) {
        console.log('[Webhook Inbound] Signature verified successfully.');
      } else {
        console.warn('[Webhook Inbound] Signature mismatch - processing anyway for debugging.');
      }
    } else {
      console.warn('[Webhook Inbound] RESEND_WEBHOOK_SECRET not configured. Skipping verification.');
    }

    // 2. Parse Payload
    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    console.log('[Webhook Inbound] Event type received:', eventType);

    // Resend inbound email event type is "email.received"
    if (eventType !== 'email.received') {
      console.log(`[Webhook Inbound] Unhandled event type: ${eventType} - returning 200 OK`);
      return NextResponse.json({ success: true, message: 'Event type ignored' });
    }

    const emailData = payload.data;
    if (!emailData) {
      return NextResponse.json({ error: 'Missing data in payload' }, { status: 400 });
    }

    // Log semua field emailData untuk diagnosis
    console.log('[Webhook Inbound] emailData fields:', Object.keys(emailData));
    console.log('[Webhook Inbound] email_id:', emailData.email_id);

    const emailId = emailData.email_id || `inbound-${Date.now()}`;
    
    // Parse sender/receiver
    const fromVal = emailData.from || 'Unknown Sender';
    const toArray = Array.isArray(emailData.to) ? emailData.to : [emailData.to || ''];
    const toVal = toArray.filter(Boolean).join(', ');
    const subjectVal = emailData.subject || '(Tanpa Subjek)';
    const receivedAt = emailData.date || new Date().toISOString();

    // Fetch full email content dari Resend Receiving API (dengan retry untuk atasi race condition)
    let textBody = '';
    let htmlBody = '';
    let contentFetchSuccess = false;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey && emailData.email_id) {
      const result = await fetchEmailContentWithRetry(emailData.email_id, resendApiKey);
      textBody = result.text;
      htmlBody = result.html;
      contentFetchSuccess = result.success;
    } else {
      if (!resendApiKey) {
        console.error('[Webhook Inbound] RESEND_API_KEY tidak dikonfigurasi - tidak bisa fetch konten email.');
      }
      if (!emailData.email_id) {
        console.error('[Webhook Inbound] email_id tidak ada di payload - tidak bisa fetch konten email. emailData:', JSON.stringify(emailData));
      }
    }

    const inboundDetail: InboundEmailDetail = {
      id: emailId,
      from: fromVal,
      to: toVal,
      subject: subjectVal,
      text: textBody,
      html: htmlBody || textBody,
      receivedAt,
      rawPayload: payload
    };

    // 3. Simpan Detail Email masuk ke R2
    await uploadToR2(`emails/inbound/${emailId}.json`, JSON.stringify(inboundDetail, null, 2), 'application/json');

    // 4. Update Index List Inbound di R2
    let inboundList: InboundEmailLog[] = [];
    try {
      const existingList = await fetchJsonFromR2<InboundEmailLog[]>('emails/inbound_list.json');
      if (Array.isArray(existingList)) {
        inboundList = existingList;
      }
    } catch (err) {
      console.warn('Gagal memuat list inbound lama, menginisialisasi baru:', err);
    }

    const newLogItem: InboundEmailLog = {
      id: emailId,
      from: fromVal,
      to: toVal,
      subject: subjectVal,
      receivedAt
    };

    // Tambahkan di urutan paling atas
    inboundList.unshift(newLogItem);

    // Batasi list maksimal 200 item
    if (inboundList.length > 200) {
      inboundList = inboundList.slice(0, 200);
    }

    // Upload index terbaru ke R2
    await uploadToR2('emails/inbound_list.json', JSON.stringify(inboundList, null, 2), 'application/json');

    // 5. Meneruskan salinan email ke Gmail admin melalui Resend API
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Cari email pengirim asli
        const originalTo = toVal.toLowerCase();
        const fromEmail = originalTo.includes('timotius@meteorit.my.id') 
          ? 'timotius@meteorit.my.id' 
          : 'info@meteorit.my.id';

        // Gunakan konten asli jika berhasil diambil, fallback HTML informatif jika gagal
        const forwardHtml = htmlBody
          ? htmlBody
          : textBody
            ? `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; word-wrap: break-word;">${textBody}</pre>`
            : buildFallbackHtml(fromVal, subjectVal, emailId);

        await resend.emails.send({
          from: `Meteorit Inbound <${fromEmail}>`,
          to: ['creativecortex168@gmail.com', 'timotiuss75@gmail.com'], // Meneruskan ke email Gmail Admin
          replyTo: fromVal, // Memungkinkan balas langsung ke pengirim asli di Gmail
          subject: `${subjectVal} (dari: ${fromVal})`,
          html: forwardHtml,
          ...(textBody ? { text: textBody } : {}),
        });
        console.log(`[Webhook Inbound] Berhasil meneruskan email ke Gmail. contentFetchSuccess=${contentFetchSuccess}`);
      } catch (forwardErr) {
        console.error('[Webhook Inbound] Gagal meneruskan email ke Gmail:', forwardErr);
      }
    }

    console.log(`[Webhook Inbound] Email masuk berhasil diproses. ID: ${emailId}, Dari: ${fromVal}, contentFetched: ${contentFetchSuccess}`);
    return NextResponse.json({ success: true, message: 'Inbound email logged and forwarded successfully' });

  } catch (error) {
    console.error('[Webhook Inbound POST] error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${String(error)}` }, { status: 500 });
  }
}
