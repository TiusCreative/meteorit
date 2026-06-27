import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getAbsoluteUrl } from "@/lib/siteUrl";

// Lazily initialize Midtrans to avoid build-time errors if env vars are missing
function getSnapClient() {
  // @ts-ignore
  const midtransClient = require("midtrans-client");

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY tidak dikonfigurasi di environment variables Vercel.");
  }
  if (!clientKey) {
    throw new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY tidak dikonfigurasi di environment variables Vercel.");
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
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

    // Initialize Midtrans snap client (will throw if env vars missing)
    let snap: any;
    try {
      snap = getSnapClient();
    } catch (envErr) {
      const msg = envErr instanceof Error ? envErr.message : String(envErr);
      console.error("Midtrans init error:", msg);
      return NextResponse.json(
        { error: "Konfigurasi pembayaran belum lengkap. Hubungi administrator.", details: msg },
        { status: 503 }
      );
    }

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
    const snapToken = await snap.createTransactionToken(parameter);
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
