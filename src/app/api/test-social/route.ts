import { NextResponse } from 'next/server';
import { sendBroadcastNotification } from '@/lib/notifications';
import { isValidCronRequest } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verifikasi apakah permintaan memiliki token cron yang sah (secret)
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mockTitle = searchParams.get('title') || '🌌 Uji Coba Penyiaran Sosial Media Terpadu!';
  const mockBody = searchParams.get('body') || 'Ini adalah pesan percobaan dari sistem penyiaran otomatis Meteorit Indonesia untuk Facebook, Bluesky, Mastodon, dan Discord.';
  const mockLink = searchParams.get('link') || '/blog/article-1719600000000'; // Mock relative link
  const mockImageUrl = searchParams.get('imageUrl') || 'https://placehold.co/800x500/020617/f59e0b?text=Uji+Coba';

  const telegramHtml = `🌌 <b>${mockTitle}</b>\n\n` +
    `<i>${mockBody}</i>\n\n` +
    `🔗 Uji tautan: https://meteorit.my.id${mockLink}`;

  try {
    console.log('[Test Social] Memulai pengiriman uji coba broadcast...');
    
    const results = await sendBroadcastNotification({
      title: mockTitle,
      body: mockBody,
      telegramHtml: telegramHtml,
      link: mockLink,
      imageUrl: mockImageUrl
    });

    return NextResponse.json({
      success: true,
      message: 'Pesan uji coba broadcast berhasil dipicu.',
      results
    });
  } catch (error) {
    console.error('[Test Social] Gagal memicu broadcast:', error);
    return NextResponse.json({
      success: false,
      error: 'Gagal memicu broadcast sosial.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
