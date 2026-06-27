import Link from 'next/link';
import AstronautActions from '@/components/AstronautActions';
import SafeImage from '@/components/SafeImage';
import { getAstronautBySlug, type AstronautProfile } from '@/lib/astronautData';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const astro = await getAstronautBySlug(params.slug);
  if (!astro) {
    return {
      title: 'Astronot Tidak Ditemukan - Meteorit Indonesia',
      description: 'Detail profil astronot tidak ditemukan di sistem kami.'
    };
  }
  return {
    title: `Profil ${astro.name} (${astro.role}) - Meteorit Indonesia`,
    description: `Biografi, negara asal, agensi, dan misi antariksa ${astro.name} di ${astro.craft}.`,
    keywords: [astro.name, astro.role, astro.country, astro.agency, 'astronot', 'misi antariksa'],
  };
}

function calculateDays(launchDateStr: string, returnDateStr?: string): number {
  const launchDate = new Date(launchDateStr);
  const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffTime = Math.abs(endDate.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / 86400000);
  return isNaN(diffDays) ? 0 : diffDays;
}

function statusCopy(astro: AstronautProfile) {
  if (astro.status === 'active') return { label: 'Sedang Bertugas', accent: 'text-green-300', badge: 'bg-green-900/60 text-green-300 border-green-500/20' };
  if (astro.status === 'upcoming') return { label: 'Misi Mendatang', accent: 'text-amber-300', badge: 'bg-amber-900/60 text-amber-300 border-amber-500/20' };
  return { label: 'Sudah Kembali', accent: 'text-cyan-300', badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/20' };
}

export default async function AstronautDetailPage({ params }: { params: { slug: string } }) {
  const astro = await getAstronautBySlug(params.slug);

  if (!astro) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">Profil astronot tidak ditemukan.</p>
          <Link href="/astronot" className="text-cyan-400 hover:underline mt-4 inline-block">Kembali ke Database Astronot</Link>
        </div>
      </div>
    );
  }

  const daysInMission = calculateDays(astro.launchDate, astro.status === 'returned' ? astro.returnDate : undefined);
  const status = statusCopy(astro);

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        <Link
          href={`/astronot?status=${astro.status}`}
          className="text-purple-400 hover:text-purple-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          ← Kembali ke Database Astronot
        </Link>

        <article className="bg-slate-900/40 border border-purple-950/20 rounded-3xl p-6 md:p-10 shadow-2xl print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
            <div className="w-48 h-60 rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex-shrink-0">
              <SafeImage
                src={astro.imageUrl}
                alt={astro.name}
                className="w-full h-full object-cover"
                fallback="https://placehold.co/400x500/020617/a855f7?text=Astronot"
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <span className={`${status.badge} border text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider`}>
                {status.label}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {astro.name}
              </h1>
              <p className={`font-semibold text-lg ${status.accent}`}>{astro.role}</p>
              <p className="text-sm text-slate-400">{astro.mission || `Misi ${astro.craft}`}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Asal Negara</span>
                  <span className="text-sm font-bold text-gray-200 mt-1 block">{astro.country}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Agensi</span>
                  <span className="text-sm font-bold text-gray-200 mt-1 block">{astro.agency}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Durasi Misi</span>
                  <span className="text-sm font-bold text-amber-400 mt-1 block">
                    {astro.status === 'upcoming' ? 'Terjadwal' : `${daysInMission} Hari`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AstronautActions astronaut={astro} />

          <div id="printable-astronaut-content" className="space-y-6 text-left border-t border-purple-950/10 pt-8 mt-6">
            <h2 className="text-2xl font-bold text-purple-400 border-b border-purple-950/10 pb-2">Biografi & Misi</h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {astro.biography}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
