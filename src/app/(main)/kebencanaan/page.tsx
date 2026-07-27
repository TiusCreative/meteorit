import { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const DisasterDashboard = dynamicImport(
  () => import('@/components/kebencanaan/DisasterDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm font-semibold animate-pulse">Memuat Dasbor Kebencanaan...</p>
        </div>
      </div>
    ),
  }
);


export const metadata: Metadata = {
  title: 'Peta & Pantauan Kebencanaan Nasional - Meteorit Indonesia',
  description: 'Pantau aktivitas gempa bumi, titik api kebakaran hutan (hotspot) NASA FIRMS, curah hujan satelit NASA GPM, letusan gunung api aktif ESDM MAGMA, dan siklus iklim La Niña/ENSO secara real-time.',
  keywords: ['kebencanaan', 'gempa bumi', 'titik api', 'karhutla', 'gunung api', 'gunung merapi', 'la nina', 'enso', 'bmkg', 'magma indonesia', 'tews'],
  openGraph: {
    title: 'Dasbor Kebencanaan Nasional Indonesia',
    description: 'Pemantauan real-time bencana alam seismik, termal karhutla, presipitasi satelit, dan aktivitas letusan gunung api.',
    type: 'website',
    images: [
      {
        url: '/logo-cuaca.png',
        width: 800,
        height: 600,
        alt: 'Dasbor Kebencanaan Nasional'
      }
    ]
  }
};

interface PageProps {
  searchParams: { tab?: string };
}

export default function KebencanaanPage({ searchParams }: PageProps) {
  const tab = searchParams?.tab || 'volcano';
  return <DisasterDashboard initialTab={tab} />;
}
