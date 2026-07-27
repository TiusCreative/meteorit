import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/cleanup-telegram-reports
 * Cron job: hapus pesan Telegram yang sudah berumur 48 jam
 * Dipanggil oleh Vercel Cron setiap jam
 */
export async function GET(req: NextRequest) {
  // Validasi cron secret agar tidak bisa dipanggil sembarangan
  const authHeader = req.headers.get('authorization');
  const secret = authHeader?.replace('Bearer ', '');
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN tidak dikonfigurasi' }, { status: 500 });
  }

  const results = { deleted: 0, failed: 0, errors: [] as string[] };

  try {
    const { adminDb } = await import('@/lib/firebaseAdmin');
    const now = new Date();

    // Cari semua pesan yang sudah melewati waktu delete (48 jam) dan belum dihapus
    const snapshot = await adminDb
      .collection('telegram_share_reports')
      .where('deleted', '==', false)
      .where('delete_at', '<=', now.toISOString())
      .limit(50) // Batasi 50 per run agar tidak timeout
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        ok: true,
        message: 'Tidak ada pesan yang perlu dihapus',
        ...results,
      });
    }

    const batch = adminDb.batch();
    const deletionPromises: Promise<void>[] = [];

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const { message_id, chat_id } = data;

      if (!message_id || !chat_id) {
        // Tandai sebagai deleted jika tidak ada message_id
        batch.update(doc.ref, { deleted: true, deleted_reason: 'missing_message_id' });
        return;
      }

      // Hapus dari Telegram (hanya bisa dalam 48 jam dari pengiriman)
      const deletePromise = fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, message_id }),
        }
      )
        .then(async (res) => {
          const result = await res.json();
          if (result.ok) {
            results.deleted++;
            batch.update(doc.ref, {
              deleted: true,
              deleted_at: new Date().toISOString(),
            });
          } else {
            // Pesan mungkin sudah dihapus manual atau melebihi 48 jam
            results.failed++;
            results.errors.push(`msg_id ${message_id}: ${result.description || 'Unknown error'}`);
            // Tandai sebagai deleted agar tidak dicoba lagi
            batch.update(doc.ref, {
              deleted: true,
              deleted_at: new Date().toISOString(),
              deleted_reason: result.description || 'telegram_error',
            });
          }
        })
        .catch((err) => {
          results.failed++;
          results.errors.push(`msg_id ${message_id}: ${err.message}`);
        });

      deletionPromises.push(deletePromise);
    });

    // Tunggu semua request selesai
    await Promise.allSettled(deletionPromises);

    // Commit batch update ke Firestore
    await batch.commit();

    console.log(`[Cleanup Telegram Reports] Selesai: ${results.deleted} terhapus, ${results.failed} gagal`);

    return NextResponse.json({
      ok: true,
      message: `Pembersihan selesai: ${results.deleted} pesan terhapus, ${results.failed} gagal`,
      ...results,
    });
  } catch (err: any) {
    console.error('[Cleanup Telegram Reports] Error:', err);
    return NextResponse.json(
      { ok: false, error: err.message, ...results },
      { status: 500 }
    );
  }
}
