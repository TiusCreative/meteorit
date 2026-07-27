import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { verifyAdminToken } from '@/lib/verifyAdminToken';

export const dynamic = 'force-dynamic';

const resendApiKey = process.env.RESEND_API_KEY;

// Zod Schema for validation
const sendEmailSchema = z.object({
  fromName: z.string().min(1, 'Nama pengirim (From Name) wajib diisi'),
  fromEmail: z.enum(['timotius@meteorit.my.id', 'info@meteorit.my.id'] as const, {
    message: 'Alamat pengirim harus timotius@meteorit.my.id atau info@meteorit.my.id'
  }),
  to: z.string().min(1, 'Email penerima wajib diisi').email('Format email penerima tidak valid'),
  cc: z.string().refine(val => {
    if (!val) return true;
    return val.split(',').every(email => z.string().email().safeParse(email.trim()).success);
  }, { message: 'Format email pada CC tidak valid' }).optional(),
  bcc: z.string().refine(val => {
    if (!val) return true;
    return val.split(',').every(email => z.string().email().safeParse(email.trim()).success);
  }, { message: 'Format email pada BCC tidak valid' }).optional(),
  subject: z.string().min(3, 'Subjek minimal 3 karakter'),
  message: z.string().min(10, 'Pesan minimal 10 karakter')
});

interface EmailLog {
  id: string;
  fromName: string;
  fromEmail: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  sentAt: string;
  status: 'success' | 'failed';
  error?: string;
}

interface EmailDetail extends EmailLog {
  message: string;
}

/**
 * GET: Mengambil riwayat pengiriman email dari R2
 * - Jika parameter `id` disediakan, mengambil detail email penuh
 * - Jika tidak, mengambil daftar ringkasan email
 */
export async function GET(request: Request) {
  try {
    // 1. Verifikasi Admin
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Ambil berkas detail email
      const detail = await fetchJsonFromR2<EmailDetail>(`emails/${id}.json`);
      if (!detail) {
        return NextResponse.json({ error: 'Log email tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ success: true, detail });
    } else {
      // Ambil daftar ringkasan email
      const list = await fetchJsonFromR2<EmailLog[]>('emails/list.json');
      return NextResponse.json({ success: true, list: list || [] });
    }
  } catch (error) {
    console.error('[GET /api/send] error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * POST: Mengirim email via Resend dan mencatat ke R2
 */
export async function POST(request: Request) {
  try {
    // 1. Verifikasi Admin
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    // 2. Parse dan Validasi Input
    const body = await request.json();
    const result = sendEmailSchema.safeParse(body);
    
    if (!result.success) {
      const formattedErrors = result.error.format();
      return NextResponse.json({ 
        error: 'Validasi gagal', 
        details: formattedErrors 
      }, { status: 400 });
    }

    const { fromName, fromEmail, to, cc, bcc, subject, message } = result.data;

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Resend API Key tidak terkonfigurasi di server.' }, { status: 500 });
    }

    // 3. Kirim Email Menggunakan Resend SDK
    const resend = new Resend(resendApiKey);
    const emailOptions: any = {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: message,
    };

    if (cc) {
      emailOptions.cc = cc.split(',').map(e => e.trim()).filter(Boolean);
    }
    if (bcc) {
      emailOptions.bcc = bcc.split(',').map(e => e.trim()).filter(Boolean);
    }

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({ error: `Gagal mengirim email: ${error.message}` }, { status: 500 });
    }

    const resendId = data?.id || `fallback-${Date.now()}`;
    const sentAt = new Date().toISOString();

    // 4. Buat Log Detail
    const emailDetail: EmailDetail = {
      id: resendId,
      fromName,
      fromEmail,
      to,
      cc: cc || '',
      bcc: bcc || '',
      subject,
      message,
      sentAt,
      status: 'success'
    };

    // Simpan file log detail ke R2
    await uploadToR2(`emails/${resendId}.json`, JSON.stringify(emailDetail, null, 2), 'application/json');

    // 5. Update index daftar email di R2
    let list: EmailLog[] = [];
    try {
      const existingList = await fetchJsonFromR2<EmailLog[]>('emails/list.json');
      if (Array.isArray(existingList)) {
        list = existingList;
      }
    } catch (err) {
      console.warn('Gagal memuat list lama, menginisialisasi list baru:', err);
    }

    const newLogItem: EmailLog = {
      id: resendId,
      fromName,
      fromEmail,
      to,
      subject,
      sentAt,
      status: 'success'
    };

    // Tambah di awal list (terbaru diatas)
    list.unshift(newLogItem);

    // Batasi list index maksimal 200 riwayat pengiriman untuk optimalisasi size
    if (list.length > 200) {
      list = list.slice(0, 200);
    }

    // Upload index terbaru ke R2
    await uploadToR2('emails/list.json', JSON.stringify(list, null, 2), 'application/json');

    return NextResponse.json({
      success: true,
      message: 'Email berhasil terkirim dan dicatat ke R2.',
      resendId
    });

  } catch (error) {
    console.error('[POST /api/send] error:', error);
    return NextResponse.json({ error: `Terjadi kesalahan internal: ${String(error)}` }, { status: 500 });
  }
}
