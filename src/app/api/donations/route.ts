export const runtime = 'edge';
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getAbsoluteUrl } from "@/lib/siteUrl";
import { grantPremiumByDonation } from "@/lib/premiumUtils";

// Midtrans Snap REST API Helper (100% Edge runtime compatible)
async function createMidtransTransactionToken(parameter: any): Promise<string> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY tidak dikonfigurasi.");
  }

  const endpoint = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify(parameter),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Midtrans API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.token) {
    throw new Error("Midtrans API tidak mengembalikan snap token.");
  }

  return data.token;
}

// GET: Retrieve donation history (for admin dashboard)
export async function GET() {
  try {
    const snapshot = await adminDb.collection("donations").orderBy("date", "desc").limit(100).get();
    const donations: any[] = [];
    snapshot.forEach((doc: any) => {
      donations.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json({ success: true, donations });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data donasi" }, { status: 500 });
  }
}

// POST: Create transaction token or handle webhook notification from Midtrans
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── Midtrans Webhook Handler ──────────────────────────────────────────────
    if (body.transaction_status && body.order_id) {
      const orderId = body.order_id as string;
      const status = body.transaction_status as string;
      const docRef = adminDb.collection("donations").doc(orderId);
      const existingSnap = await docRef.get();
      const existingData = existingSnap.exists ? existingSnap.data() : null;

      let dbStatus = "Pending";
      if (status === "settlement" || status === "capture") {
        dbStatus = "Completed";
      } else if (status === "deny" || status === "cancel" || status === "expire") {
        dbStatus = "Failed";
      }

      await docRef.set(
        {
          status: dbStatus,
          paymentType: body.payment_type || "Unknown",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      const shouldNotifyDonation =
        dbStatus === "Completed" &&
        existingData?.telegramDonationNotified !== true &&
        (existingData?.status !== "Completed" || existingData?.telegramDonationNotified === false);

      if (shouldNotifyDonation) {
        const adminChatId = process.env.TELEGRAM_CHAT_ID || "5429818332";
        const amount = Number(body.gross_amount || existingData?.amount || 0);
        const email = body.customer_details?.email || existingData?.email || "Tidak tersedia";
        const paymentType = body.payment_type || existingData?.paymentType || existingData?.method || "Unknown";
        const donationMsg =
          `💰 <b>DONASI BERHASIL</b>\n\n` +
          `🟢 <b>Status:</b> Completed\n` +
          `🧾 <b>Order ID:</b> ${orderId}\n` +
          `👤 <b>Donatur:</b> ${email}\n` +
          `💳 <b>Metode:</b> ${paymentType}\n` +
          `💵 <b>Jumlah:</b> Rp ${amount.toLocaleString("id-ID")}\n\n` +
          `Terima kasih, donasi berhasil masuk melalui Midtrans.`;

        const telegramSent = await sendTelegramMessage(adminChatId, donationMsg);
        await docRef.set(
          {
            telegramDonationNotified: telegramSent,
            telegramDonationNotifiedAt: telegramSent ? new Date().toISOString() : null,
          },
          { merge: true }
        );

        // Grant premium otomatis berdasarkan nominal donasi
        if (email && email !== 'Tidak tersedia') {
          try {
            const premiumResult = await grantPremiumByDonation(email, amount);
            if (premiumResult.granted) {
              const premiumMsg = `⭐ <b>PREMIUM OTOMATIS DIBERIKAN</b>\n\n` +
                `👤 <b>Email:</b> ${email}\n` +
                `💰 <b>Donasi:</b> Rp ${amount.toLocaleString('id-ID')}\n` +
                `⏳ <b>Durasi:</b> ${premiumResult.days} hari\n` +
                `✅ <b>Pesan:</b> ${premiumResult.message}`;
              await sendTelegramMessage(adminChatId, premiumMsg);
            } else {
              console.log(`[donations] Premium tidak diberikan: ${premiumResult.message}`);
            }
          } catch (premiumErr) {
            console.error('[donations] Gagal grant premium:', premiumErr);
          }
        }
      }

      return NextResponse.json({ success: true, message: "Webhook processed" });
    }

    // ── Customer Checkout Request ─────────────────────────────────────────────
    const { amount, email } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) < 1000) {
      return NextResponse.json(
        { error: "Jumlah donasi tidak valid. Minimal Rp 1.000." },
        { status: 400 }
      );
    }

    const orderId = `DONATION-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(amount),
      },
      customer_details: {
        email: email || "donatur@meteorit.id",
      },
      callbacks: {
        finish: getAbsoluteUrl("/"),
      },
    };

    console.log("[donations] Creating Midtrans transaction:", orderId, "Amount:", amount);
    let snapToken: string;
    try {
      snapToken = await createMidtransTransactionToken(parameter);
    } catch (midtransErr) {
      const msg = midtransErr instanceof Error ? midtransErr.message : String(midtransErr);
      console.error("[donations] Midtrans error:", msg);
      return NextResponse.json(
        { error: "Gagal memproses pembayaran Midtrans. Coba beberapa saat lagi.", details: msg },
        { status: 503 }
      );
    }
    console.log("[donations] Snap token created for:", orderId);

    // Save pending transaction to Firestore
    try {
      await adminDb.collection("donations").doc(orderId).set({
        orderId,
        amount: Number(amount),
        email: email || "donatur@meteorit.id",
        status: "Pending",
        method: "Midtrans Snap",
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        date: new Date().toISOString(),
      });
    } catch (dbErr) {
      // Non-fatal: log but don't fail the transaction
      console.warn("[donations] Could not save to Firestore:", dbErr);
    }

    return NextResponse.json({ snapToken, orderId });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[donations] POST error:", errMsg);
    return NextResponse.json(
      {
        error: "Gagal memproses pembayaran.",
        details: errMsg,
      },
      { status: 500 }
    );
  }
}
