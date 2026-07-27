import { Metadata } from 'next';
import WeatherMiniApp from '@/components/cuaca/WeatherMiniApp';

export const metadata: Metadata = {
  title: 'Cuaca & Langit Indonesia - Meteorit Indonesia',
  description: 'Pantau cuaca real-time, prakiraan 7 hari, peringatan ekstrem, dan laporan komunitas langit Indonesia. Didukung data BMKG, OpenWeatherMap, dan Open-Meteo.',
  keywords: ['cuaca indonesia', 'prakiraan cuaca', 'bmkg', 'cuaca hari ini', 'cuaca minggu ini', 'cuaca real-time'],
  manifest: '/manifest-cuaca.json',
  openGraph: {
    title: 'Cuaca & Langit Indonesia',
    description: 'Pantau cuaca real-time seluruh Indonesia dengan prakiraan 7 hari dan peringatan ekstrem.',
    type: 'website',
  },
};

export default function CuacaPage() {
  return <WeatherMiniApp />;
}
