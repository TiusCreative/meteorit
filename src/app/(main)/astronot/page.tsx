import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { loadAstronautDataset, type AstronautProfile, type AstronautStatus } from '@/lib/astronautData';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profil Astronot, Kosmonot, dan Taikonaut | Meteorit Indonesia',
  description: 'Database profil astronot aktif, misi mendatang, dan alumni misi antariksa yang pernah bertugas di ISS, Tiangong, dan orbit Bumi.',
  keywords: ['astronot', 'kosmonot', 'taikonaut', 'manusia di antariksa', 'ISS', 'Tiangong', 'misi antariksa'],
};

const TABS: { key: AstronautStatus; label: string; title: string; description: string }[] = [
  {
    key: 'active',
    label: 'Sedang di Antariksa',
    title: 'Kru yang Sedang Bertugas',
    description: 'Astronot, kosmonot, dan taikonaut yang sedang menjalankan misi di orbit Bumi.'
  },
  {
    key: 'upcoming',
    label: 'Misi Mendatang',
    title: 'Kru yang Akan Meluncur',
    description: 'Nama-nama kru yang sudah masuk jadwal misi berikutnya menuju stasiun antariksa atau program eksplorasi.'
  },
  {
    key: 'returned',
    label: 'Pahlawan Antariksa',
    title: 'Alumni dan Kru yang Sudah Kembali',
    description: 'Arsip kru yang pernah bertugas di ISS, Tiangong, atau misi orbit lain dan sudah kembali ke Bumi.'
  }
];

function calculateDays(launchDateStr: string, returnDateStr?: string): number {
  const launchDate = new Date(launchDateStr);
  const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffTime = Math.abs(endDate.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / 86400000);
  return isNaN(diffDays) ? 0 : diffDays;
}

function statusLabel(status: AstronautStatus) {
  if (status === 'active') return 'Sedang Bertugas';
  if (status === 'upcoming') return 'Misi Mendatang';
  return 'Sudah Kembali';
}

function AstronautCard({ astro }: { astro: AstronautProfile }) {
  const days = calculateDays(astro.launchDate, astro.status === 'returned' ? astro.returnDate : undefined);

  return (
    <div className="astro-card rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[4/5] bg-slate-900 border-b border-purple-950/20 overflow-hidden">
        <SafeImage
          src={astro.imageUrl}
          alt={astro.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          fallback="https://placehold.co/400x500/020617/a855f7?text=Astronot"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-slate-950/90 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
            {statusLabel(astro.status)}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="bg-slate-950/90 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase line-clamp-1">
            {astro.role}
          </span>
          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
            {astro.status === 'upcoming' ? 'Terjadwal' : `${days} Hari`}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-white font-bold text-base hover:text-purple-400 transition-colors line-clamp-1">
            {astro.name}
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            {astro.agency} &bull; {astro.country}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {astro.mission || `Misi ${astro.craft}`}
          </p>
          <p className="text-slate-400 text-xs leading-relaxed mt-3 line-clamp-3">
            {astro.biography}
          </p>
        </div>

        <Link
          href={`/astronot/${astro.id}`}
          className="w-full text-center block bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/30 hover:border-purple-600/50 py-2.5 rounded-xl text-xs font-bold transition-all duration-300"
        >
          Lihat Biografi Lengkap &rarr;
        </Link>
      </div>
    </div>
  );
}

export default async function AstronautsPage({
  searchParams
}: {
  searchParams?: { status?: string };
}) {
  const dataset = await loadAstronautDataset();
  const activeTab = TABS.some((tab) => tab.key === searchParams?.status)
    ? (searchParams?.status as AstronautStatus)
    : 'active';
  const currentTab = TABS.find((tab) => tab.key === activeTab) || TABS[0];
  const filtered = dataset.astronauts.filter((astronaut) => astronaut.status === activeTab);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .astro-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(168, 85, 247, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .astro-card:hover {
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.2);
          transform: translateY(-3px);
        }
        .glow-text-purple {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
        }
      ` }} />

      <main className="min-h-screen bg-slate-950 text-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs font-semibold text-purple-400 tracking-wider uppercase">
              Live & arsip misi
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent glow-text-purple">
              Database Manusia di Antariksa
            </h1>
            <div className="text-slate-400 text-sm md:text-base max-w-3xl mx-auto leading-relaxed space-y-4">
              <p>
                Halaman ini merangkum profil astronot, kosmonot, dan taikonaut dalam tiga kelompok agar pembaca dapat memahami siapa yang sedang berada di orbit, siapa yang sedang bersiap terbang, dan siapa yang sudah menuntaskan misi bersejarahnya.
              </p>
              <p>
                Kru aktif biasanya tinggal di ISS atau Tiangong selama berbulan-bulan untuk menjalankan eksperimen mikrogravitasi, memantau kesehatan tubuh manusia, merawat sistem stasiun, dan mengambil citra Bumi. Data aktif dapat berubah ketika kapsul kru berlabuh, undocking, atau mendarat kembali.
              </p>
              <p>
                Arsip alumni tetap disimpan karena setiap profil memiliki nilai edukasi dan SEO jangka panjang. Misi yang sudah selesai sering menyimpan cerita penting tentang eksperimen, spacewalk, kerja sama internasional, dan teknologi yang menjadi pijakan eksplorasi Bulan serta Mars.
              </p>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Profil</p>
              <p className="text-2xl font-black text-white">{dataset.summary.total}</p>
            </div>
            <div className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-4">
              <p className="text-xs uppercase tracking-wider text-purple-300 font-bold">Aktif</p>
              <p className="text-2xl font-black text-white">{dataset.summary.active}</p>
            </div>
            <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
              <p className="text-xs uppercase tracking-wider text-amber-300 font-bold">Mendatang</p>
              <p className="text-2xl font-black text-white">{dataset.summary.upcoming}</p>
            </div>
            <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-4">
              <p className="text-xs uppercase tracking-wider text-cyan-300 font-bold">Alumni</p>
              <p className="text-2xl font-black text-white">{dataset.summary.returned}</p>
            </div>
          </div>

          <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/astronot?status=${tab.key}`}
                className={`rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold border transition-all ${
                  activeTab === tab.key
                    ? 'bg-purple-500 text-slate-950 border-purple-300'
                    : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-purple-600 hover:text-purple-300'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">{currentTab.title}</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-2xl">{currentTab.description}</p>
              </div>
              <p className="text-xs text-slate-500">
                Diperbarui: {new Date(dataset.updatedAt).toLocaleString('id-ID')}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/30">
                Belum ada data untuk kategori ini. Jalankan pemicu astronot di admin console untuk memperbarui JSON R2.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((astro) => (
                  <AstronautCard key={astro.id} astro={astro} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
