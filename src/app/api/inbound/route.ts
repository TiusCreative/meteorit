import { NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2, deleteFromR2 } from '@/lib/r2Client';
import { verifyAdminToken } from '@/lib/verifyAdminToken';

export const dynamic = 'force-dynamic';

interface InboundEmailLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
}

interface InboundEmailDetail extends InboundEmailLog {
  text?: string;
  html?: string;
}

/**
 * GET: Mengambil log email masuk dari R2
 * - Jika parameter `id` disediakan, mengambil detail email masuk penuh
 * - Jika tidak, mengambil daftar ringkasan email masuk
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
      // Ambil berkas detail email masuk
      const detail = await fetchJsonFromR2<InboundEmailDetail>(`emails/inbound/${id}.json`);
      if (!detail) {
        return NextResponse.json({ error: 'Log email masuk tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ success: true, detail });
    } else {
      // Ambil daftar ringkasan email masuk
      const list = await fetchJsonFromR2<InboundEmailLog[]>('emails/inbound_list.json');
      return NextResponse.json({ success: true, list: list || [] });
    }
  } catch (error) {
    console.error('[GET /api/inbound] error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * DELETE: Menghapus log email masuk dari R2
 */
export async function DELETE(request: Request) {
  try {
    // 1. Verifikasi Admin
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID email wajib diisi' }, { status: 400 });
    }

    // 2. Ambil list lama dan hapus item dari list
    const list = await fetchJsonFromR2<InboundEmailLog[]>('emails/inbound_list.json') || [];
    const updatedList = list.filter(item => item.id !== id);
    
    // Upload list terupdate
    await uploadToR2('emails/inbound_list.json', JSON.stringify(updatedList, null, 2), 'application/json');

    // 3. Hapus detail file
    await deleteFromR2(`emails/inbound/${id}.json`);

    console.log(`[DELETE /api/inbound] Email ID: ${id} berhasil dihapus.`);
    return NextResponse.json({ success: true, message: 'Email berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE /api/inbound] error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
