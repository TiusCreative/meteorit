import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getSiteHost, getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

const SENDER_API_KEY = process.env.SENDER_API_KEY || "";
const SENDER_FROM_EMAIL = process.env.SENDER_FROM_EMAIL || `noreply@${getSiteHost()}`;
const SENDER_FROM_NAME = "Meteorit Indonesia";
const SITE_URL = getSiteUrl();
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || SENDER_FROM_EMAIL;

async function sendSmtpEmail(toEmail: string, htmlBody: string): Promise<{ ok: boolean; error?: string }> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    return { ok: false, error: "SMTP belum dikonfigurasi lengkap." };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${SENDER_FROM_NAME}" <${SMTP_FROM}>`,
      to: toEmail,
      subject: "Selamat datang di Newsletter Meteorit Indonesia!",
      html: htmlBody,
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[subscribe] SMTP error:", msg);
    return { ok: false, error: msg };
  }
}

// Kirim email transaksional via SMTP Resend, fallback ke Sender.com REST API.
async function sendWelcomeEmail(toEmail: string): Promise<{ ok: boolean; error?: string }> {
  const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Selamat Datang di Meteorit Indonesia</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #1e3a5f;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c4a6e,#0f172a);padding:40px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">🌠</div>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Meteorit Indonesia
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">Pusat Data Astronomi &amp; Komunitas Meteorit</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#22d3ee;">
                Selamat Datang! 🎉
              </h2>
              <p style="margin:0 0 20px;font-size:16px;color:#cbd5e1;line-height:1.7;">
                Terima kasih telah berlangganan newsletter <strong style="color:#f8fafc;">Meteorit Indonesia</strong>.
                Anda kini akan mendapatkan notifikasi langsung di inbox Anda tentang:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 16px;background:#0f172a;border-radius:10px;margin-bottom:8px;border-left:3px solid #f59e0b;">
                    <span style="font-size:18px;">☄️</span>
                    <strong style="color:#f8fafc;font-size:14px;margin-left:10px;">Kejatuhan Meteor Terbaru</strong>
                    <p style="margin:4px 0 0 28px;font-size:13px;color:#94a3b8;">Laporan real-time kejatuhan meteorit di Indonesia</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#0f172a;border-radius:10px;border-left:3px solid #22d3ee;">
                    <span style="font-size:18px;">🔭</span>
                    <strong style="color:#f8fafc;font-size:14px;margin-left:10px;">Artikel Astronomi Mingguan</strong>
                    <p style="margin:4px 0 0 28px;font-size:13px;color:#94a3b8;">Tips, panduan, dan fakta menarik tentang luar angkasa</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#0f172a;border-radius:10px;border-left:3px solid #a855f7;">
                    <span style="font-size:18px;">🗓️</span>
                    <strong style="color:#f8fafc;font-size:14px;margin-left:10px;">Event Astronomi</strong>
                    <p style="margin:4px 0 0 28px;font-size:13px;color:#94a3b8;">Jadwal hujan meteor, gerhana, dan pengamatan langit</p>
                  </td>
                </tr>
              </table>

              <div style="margin:32px 0;text-align:center;">
                <a href="${SITE_URL}"
                   style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#f59e0b);color:#0f172a;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                  🚀 Jelajahi Meteorit Indonesia
                </a>
              </div>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                Jika Anda tidak merasa mendaftar newsletter ini, abaikan saja email ini.
                Kami tidak akan mengirim email lagi tanpa persetujuan Anda.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0 0 8px;font-size:13px;color:#475569;">
                Dikirim oleh <strong style="color:#94a3b8;">Meteorit Indonesia</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#334155;">
                <a href="${SITE_URL}/ensiklopedia" style="color:#0ea5e9;text-decoration:none;">Ensiklopedia</a> &nbsp;·&nbsp;
                <a href="${SITE_URL}/blog" style="color:#0ea5e9;text-decoration:none;">Blog</a> &nbsp;·&nbsp;
                <a href="${SITE_URL}/forum" style="color:#0ea5e9;text-decoration:none;">Forum</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const smtpResult = await sendSmtpEmail(toEmail, htmlBody);
  if (smtpResult.ok) return smtpResult;

  if (!SENDER_API_KEY) {
    console.warn("[subscribe] SMTP/SENDER tidak lengkap. Melewati pengiriman email.", smtpResult.error);
    return { ok: false, error: smtpResult.error || "Email provider tidak dikonfigurasi." };
  }

  try {
    const res = await fetch("https://api.sender.net/v2/transactional/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDER_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: SENDER_FROM_EMAIL,
          name: SENDER_FROM_NAME,
        },
        to: [{ email: toEmail }],
        subject: "🌠 Selamat datang di Newsletter Meteorit Indonesia!",
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[subscribe] Sender.com error:", res.status, body);
      return { ok: false, error: `Sender.com responded ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[subscribe] Sender.com fetch error:", msg);
    return { ok: false, error: msg };
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }

    // Cek apakah email sudah terdaftar sebelumnya
    const existing = await adminDb
      .collection("subscribers")
      .where("email", "==", email)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true, message: "Email sudah terdaftar sebelumnya." });
    }

    // Simpan ke Firestore
    await adminDb.collection("subscribers").add({
      email,
      subscribedAt: new Date().toISOString(),
      active: true,
    });

    // Kirim email konfirmasi via Sender.com
    const { ok, error: emailError } = await sendWelcomeEmail(email);

    if (!ok) {
      // Data tersimpan tapi email gagal - beri tahu di log, tetapi tetap sukses untuk user
      console.warn("[subscribe] Email gagal dikirim:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil berlangganan! Cek email Anda untuk konfirmasi.",
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[subscribe] Error:", errMsg);
    return NextResponse.json(
      { error: "Gagal mendaftar newsletter. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
