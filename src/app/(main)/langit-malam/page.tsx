import LangitMalamClient from '@/components/LangitMalamClient';

export const metadata = {
  title: 'Peta Langit Malam - Meteorit Indonesia',
  description: 'Jelajahi peta bintang interaktif langit malam Indonesia. Masukkan nama kota atau izinkan akses lokasi GPS untuk melihat konstelasi bintang malam ini secara real-time.',
  keywords: ['peta bintang', 'langit malam', 'konstelasi', 'astronomi Indonesia', 'bintang malam ini', 'peta langit'],
};

export default function LangitMalamPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <LangitMalamClient />
    </main>
  );
}
