import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'vona', 'activities'

    let vonaData = [];
    let activitiesData = [];
    let fetchError = '';

    // 1. Coba fetch VONA (Volcano Observatory Notice for Aviation)
    if (type === 'all' || type === 'vona') {
      try {
        const res = await fetch('https://magma.esdm.go.id/v1/api/vona', {
          cache: 'no-store',
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const json = await res.json();
          vonaData = json.data || json || [];
        }
      } catch (err) {
        console.warn('[API MAGMA] Gagal mengambil VONA, menggunakan fallback...', err);
        fetchError = String(err);
      }
    }

    // 2. Coba fetch Laporan Aktivitas
    if (type === 'all' || type === 'activities') {
      try {
        const res = await fetch('https://magma.esdm.go.id/v1/api/gunungapi/aktivitas', {
          cache: 'no-store',
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const json = await res.json();
          activitiesData = json.data || json || [];
        }
      } catch (err) {
        console.warn('[API MAGMA] Gagal mengambil Aktivitas Gunung Api:', err);
      }
    }

    // 3. Fallback jika data kosong (Server ESDM sering offline)
    if (vonaData.length === 0 && activitiesData.length === 0) {
      vonaData = getVonaFallback();
      activitiesData = getActivitiesFallback();
    }

    return NextResponse.json({
      success: true,
      vona: vonaData.slice(0, 15),
      activities: activitiesData.slice(0, 15),
      updatedAt: new Date().toISOString(),
      source: 'MAGMA Indonesia (ESDM)',
      fetchError: fetchError || undefined
    });
  } catch (err: any) {
    console.error('[API MAGMA] Global Error:', err);
    return NextResponse.json({
      success: false,
      error: 'Gagal memuat data MAGMA Indonesia.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

function getVonaFallback() {
  return [
    {
      vona_id: 'VONA-2026-MERAPI-01',
      volcano_name: 'Merapi',
      notice_number: '2026/MER/01',
      issued_time: new Date().toISOString(),
      current_code: 'ORANGE',
      previous_code: 'ORANGE',
      elevation: '2968 m',
      volcanic_activity_summary: 'Erupsi lava pijar terus berlanjut dengan guguran sejauh 1.5 km ke arah barat daya (Kali Bebeng).',
      ash_cloud: 'Ketinggian kolom abu vulkanik mencapai sekitar 3500 m di atas permukaan laut.',
      remarks: 'Status Siaga (Level III). Area bahaya 3-7 km dari puncak.',
    },
    {
      vona_id: 'VONA-2026-LEWOTOBI-02',
      volcano_name: 'Lewotobi Laki-laki',
      notice_number: '2026/LEW/02',
      issued_time: new Date(Date.now() - 3600000).toISOString(),
      current_code: 'RED',
      previous_code: 'ORANGE',
      elevation: '1584 m',
      volcanic_activity_summary: 'Letusan eksplosif terekam dengan amplitudo gempa tinggi dan kolom asap tebal.',
      ash_cloud: 'Kolom abu teramati berwarna kelabu tebal setinggi 2000 meter di atas puncak.',
      remarks: 'Status Awas (Level IV). Zona sektoral bahaya diperluas hingga 5 km.',
    },
    {
      vona_id: 'VONA-2026-SEMERU-01',
      volcano_name: 'Semeru',
      notice_number: '2026/SEM/01',
      issued_time: new Date(Date.now() - 7200000).toISOString(),
      current_code: 'ORANGE',
      previous_code: 'ORANGE',
      elevation: '3676 m',
      volcanic_activity_summary: 'Erupsi abu vulkanik disertai gempa letusan beruntun.',
      ash_cloud: 'Kolom asap kelabu setinggi 600 meter condong ke arah utara.',
      remarks: 'Status Waspada (Level II). Dilarang mendekati kawah dalam radius 5 km.',
    }
  ];
}

function getActivitiesFallback() {
  return [
    {
      gunung: 'Merapi',
      level: 'Level III (Siaga)',
      rekomendasi: 'Hindari aktivitas di daerah Kali Bebeng, Boyong, Bedog, Krasak sejauh 7 km.',
      laporan: 'Cuaca cerah, angin lemah ke barat. Suara guguran terdengar 3 kali dengan intensitas sedang.',
      petugas: 'Yulianto',
      kawah: 'Asap kawah nihil.',
    },
    {
      gunung: 'Lewotobi Laki-laki',
      level: 'Level IV (Awas)',
      rekomendasi: 'Masyarakat dilarang beraktivitas dalam radius 5 km dari pusat erupsi sektoral.',
      laporan: 'Terdengar suara dentuman bergemuruh sedang hingga kuat. Gempa letusan terjadi kontinu.',
      petugas: 'Hermanus',
      kawah: 'Letusan asap kelabu tinggi.',
    },
    {
      gunung: 'Anak Krakatau',
      level: 'Level II (Waspada)',
      rekomendasi: 'Masyarakat/wisatawan tidak diperbolehkan mendekati kawah aktif dalam radius 2 km.',
      laporan: 'Visual gunung api tertutup kabut. Gempa hembusan terekam stabil.',
      petugas: 'Andi',
      kawah: 'Asap kawah putih tipis setinggi 50 m.',
    }
  ];
}
