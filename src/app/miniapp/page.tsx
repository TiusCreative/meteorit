import { Metadata } from 'next';
import MiniAppClient from '@/components/miniapp/MiniAppClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meteorit Indonesia - Mini App & PWA',
  description: 'Pusat Pemantauan Benda Langit, Ensiklopedia Meteorit, dan Utilitas Lapangan Pemburu Meteorit.',
  manifest: '/manifest-miniapp.json',
  appleWebApp: {
    capable: true,
    title: 'MeteorApp',
    statusBarStyle: 'black-translucent',
  },
};

export default function MiniAppPage() {
  return <MiniAppClient />;
}
