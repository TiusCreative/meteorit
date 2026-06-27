import type { Metadata } from 'next';
import MonitoringClient from './MonitoringClient';
import { getAbsoluteUrl } from '@/lib/siteUrl';

export const revalidate = 3600; // ISR: rebuild every 1 hour

export async function generateMetadata(): Promise<Metadata> {
  // Fetch asteroid count for dynamic SEO description
  let asteroidCount = 0;
  let hazardousCount = 0;
  try {
    const res = await fetch(getAbsoluteUrl('/api/nasa/neo'), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      asteroidCount = data.count || 0;
      hazardousCount = (data.data || []).filter((n: any) => n.is_potentially_hazardous).length;
    }
  } catch {
    // Use defaults
  }

  const description = asteroidCount > 0
    ? `Pantau ${asteroidCount} asteroid yang melintasi dekat Bumi hari ini${hazardousCount > 0 ? `, termasuk ${hazardousCount} berpotensi berbahaya` : ''} secara real-time. Dapatkan info kecepatan, jarak melintas, laporan bola api, dan cuaca antariksa dari NASA di Meteorit Indonesia.`
    : 'Pantau asteroid dekat Bumi, laporan bola api meteor, cuaca luar angkasa, dan galeri foto Mars secara real-time. Data resmi dari NASA & JPL untuk komunitas meteorit Indonesia.';

  return {
    title: 'Dashboard Monitoring Benda Langit | Meteorit Indonesia',
    description,
    keywords: ['asteroid', 'bola api', 'meteor', 'cuaca antariksa', 'NASA', 'monitoring', 'meteorit indonesia', 'NEO', 'fireball', 'solar flare'],
    openGraph: {
      title: 'Dashboard Monitoring Benda Langit — Meteorit Indonesia',
      description,
      type: 'website',
    },
  };
}

export default function MonitoringPage() {
  return <MonitoringClient />;
}
