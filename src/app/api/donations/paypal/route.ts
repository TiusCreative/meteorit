import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { grantPremiumByDonationUSD } from '@/lib/premiumUtils';

export const dynamic = 'force-dynamic';

// Helper to exchange credentials for PayPal access token
async function getPayPalAccessToken(clientId: string, clientSecret: string, isLive: boolean) {
  const host = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${host}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Helper to capture a PayPal order
async function capturePayPalOrder(orderId: string, accessToken: string, isLive: boolean) {
  const host = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${host}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PayPal capture failed: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, email, amountUSD } = body;

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Order ID dan Email diperlukan.' }, { status: 400 });
    }

    // PRODUCTION MODE: selalu gunakan Live credentials
    const mode = process.env.PAYPAL_MODE || 'live';
    const isLive = mode !== 'sandbox'; // default production kecuali diset sandbox secara eksplisit

    // Get correct credentials based on mode
    const clientId = isLive 
      ? process.env.NEXT_PUBLIC_PAYPAL_LIVE_CLIENT_ID 
      : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;
    const clientSecret = isLive 
      ? process.env.PAYPAL_LIVE_SECRET_ID 
      : process.env.PAYPAL_SANDBOX_SECRET_ID;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Konfigurasi PayPal API tidak ditemukan di server.' 
      }, { status: 500 });
    }

    console.log(`[PayPal API] Capturing order: ${orderId} in ${mode} mode`);

    // 1. Get Access Token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, isLive);

    // 2. Capture Order
    const captureDetails = await capturePayPalOrder(orderId, accessToken, isLive);
    const status = captureDetails.status;

    if (status !== 'COMPLETED') {
      throw new Error(`PayPal order status is ${status}, expected COMPLETED`);
    }

    const amount = parseFloat(captureDetails.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || amountUSD || '0');
    const payerName = captureDetails.payer?.name?.given_name || 'Donatur';
    const payerEmail = captureDetails.payer?.email_address || email;

    // 3. Save to Firestore
    const dbData = {
      orderId,
      amount: amount, // in USD
      currency: 'USD',
      email: payerEmail,
      status: 'Completed',
      method: 'PayPal',
      payerName,
      isProduction: isLive,
      date: new Date().toISOString(),
      telegramDonationNotified: false,
    };

    const docRef = adminDb.collection('donations').doc(orderId);
    await docRef.set(dbData);

    // 4. Send Telegram Alert to Admin ID
    const adminChatId = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const donationMsg =
      `💰 <b>DONASI INTERNASIONAL BERHASIL (PAYPAL)</b>\n\n` +
      `🟢 <b>Status:</b> Completed\n` +
      `🧾 <b>Order ID:</b> ${orderId}\n` +
      `👤 <b>Donatur:</b> ${payerName} (${payerEmail})\n` +
      `💳 <b>Metode:</b> PayPal (${mode})\n` +
      `💵 <b>Jumlah:</b> $${amount.toFixed(2)} USD\n\n` +
      `Terima kasih, donasi internasional berhasil masuk melalui PayPal.`;

    const telegramSent = await sendTelegramMessage(adminChatId, donationMsg);
    await docRef.update({
      telegramDonationNotified: telegramSent,
      telegramDonationNotifiedAt: telegramSent ? new Date().toISOString() : null,
    });

    // Grant premium otomatis berdasarkan nominal donasi (konversi USD → IDR)
    try {
      const premiumResult = await grantPremiumByDonationUSD(payerEmail, amount);
      if (premiumResult.granted) {
        const premiumMsg = `⭐ <b>PREMIUM OTOMATIS (PAYPAL)</b>\n\n` +
          `👤 <b>Email:</b> ${payerEmail}\n` +
          `💵 <b>Donasi:</b> $${amount.toFixed(2)} USD (≈ Rp ${premiumResult.amountIDR.toLocaleString('id-ID')})\n` +
          `⏳ <b>Durasi:</b> ${premiumResult.days} hari\n` +
          `✅ <b>Pesan:</b> ${premiumResult.message}`;
        await sendTelegramMessage(adminChatId, premiumMsg);
      } else {
        console.log(`[paypal] Premium tidak diberikan: ${premiumResult.message}`);
      }
    } catch (premiumErr) {
      console.error('[paypal] Gagal grant premium:', premiumErr);
    }

    return NextResponse.json({ 
      success: true, 
      orderId, 
      status, 
      amount, 
      payerEmail 
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[PayPal API Error] POST:', errMsg);
    return NextResponse.json({ 
      error: 'Gagal menangkap pembayaran PayPal.', 
      details: errMsg 
    }, { status: 500 });
  }
}
