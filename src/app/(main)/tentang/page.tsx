import { getGlobalSettings } from '@/lib/settings';
import { getSiteHost } from '@/lib/siteUrl';

export default async function TentangKami() {
  const settings = await getGlobalSettings();
  const contactEmail = `info@${getSiteHost()}`;
  const visi = settings.aboutVisi || "Menjadi pusat informasi dan komunitas astronomi terpercaya di Indonesia yang mendorong minat masyarakat terhadap ilmu astronomi, khususnya tentang meteorit dan benda-benda langit lainnya.";
  const misiLines = (settings.aboutMisi || "Menyediakan ensiklopedia meteorit yang komprehensif dan mudah diakses\nMembangun komunitas penggemar astronomi yang aktif dan saling mendukung\nMenyediakan platform untuk diskusi dan pertukaran pengetahuan tentang meteorit\nMeningkatkan kesadaran masyarakat tentang pentingnya pelestarian meteorit\nMenjadi jembatan antara kolektor, peneliti, dan penggemar meteorit").split('\n').filter(line => line.trim() !== '');
  const sejarah = settings.aboutSejarah || "Meteorit Indonesia didirikan pada tahun 2023 oleh sekelompok penggemar astronomi yang ingin menciptakan platform yang dapat diakses oleh semua orang untuk mempelajari tentang meteorit. Kami mulai sebagai forum kecil dan telah berkembang menjadi sumber daya komprehensif dengan ribuan anggota dari seluruh Indonesia.";

  return (
    <main className="min-h-screen bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-cyan-400">Tentang Meteorit Indonesia</h1>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">Visi Kami</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            {visi}
          </p>

          <h2 className="text-2xl font-bold mb-4 text-amber-400">Misi Kami</h2>
          <ul className="text-gray-300 space-y-3 list-disc list-inside">
            {misiLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">Sejarah Kami</h2>
          <p className="text-gray-300 leading-relaxed">
            {sejarah}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">Mitra Kami</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <p className="font-semibold text-white">NASA</p>
              <p className="text-xs text-gray-400">Data API Partner</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <p className="font-semibold text-white">NASA</p>
              <p className="text-xs text-gray-400">Data API Partner</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <p className="font-semibold text-white">NASA</p>
              <p className="text-xs text-gray-400">Data API Partner</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <p className="font-semibold text-white">NASA</p>
              <p className="text-xs text-gray-400">Data API Partner</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">Bergabung dengan Kami</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Kami selalu mencari individu yang bersemangat untuk bergabung dengan tim kami. Jika Anda tertarik dengan astronomi, meteorit, atau ingin berkontribusi pada komunitas kami, silakan hubungi kami.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={`mailto:${contactEmail}`}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Hubungi Kami
            </a>
            <a
              href="/forum"
              className="border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Bergabung di Forum
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
