import Link from 'next/link';

export const metadata = {
  title: 'Visi & Misi - Meteorit Indonesia',
  description: 'Visi dan misi Meteorit Indonesia sebagai portal Live Space Dashboard berbahasa Indonesia pertama yang memadukan edukasi meteorit dengan data antariksa real-time untuk mendukung literasi sains nasional.',
  keywords: ['visi misi meteorit indonesia', 'portal astronomi indonesia', 'edukasi sains antariksa', 'literasi sains nasional'],
};

const VALUES = [
  {
    icon: '🌌',
    title: 'Eksplorasi Tanpa Batas',
    desc: 'Kami percaya rasa ingin tahu adalah bahan bakar kemajuan. Kami mendorong setiap orang Indonesia untuk memandang langit dengan penuh rasa ingin tahu.',
  },
  {
    icon: '📡',
    title: 'Data Akurat & Terverifikasi',
    desc: 'Seluruh data kami bersumber dari lembaga antariksa terpercaya dunia (NASA, ESA, BRIN) dan diverifikasi sebelum dipublikasikan.',
  },
  {
    icon: '🇮🇩',
    title: 'Bahasa Indonesia Pertama',
    desc: 'Kami berkomitmen menyajikan data kompleks antariksa dalam bahasa Indonesia yang mudah dipahami oleh seluruh kalangan masyarakat.',
  },
  {
    icon: '🤝',
    title: 'Komunitas Inklusif',
    desc: 'Setiap orang berhak belajar tentang antariksa. Forum dan konten kami dirancang terbuka dan ramah untuk pemula hingga peneliti.',
  },
  {
    icon: '⚡',
    title: 'Real-Time & Relevan',
    desc: 'Kami tidak hanya menyajikan fakta lama. Data ISS, APOD, astronot, dan peluncuran roket kami perbarui setiap hari secara otomatis.',
  },
  {
    icon: '🔬',
    title: 'Mendukung Riset Nasional',
    desc: 'Platform kami dirancang untuk mendukung peneliti, mahasiswa, dan pelajar Indonesia yang membutuhkan akses mudah ke data antariksa.',
  },
];

const MILESTONES = [
  { year: '2023', label: 'Meteorit Indonesia diluncurkan sebagai platform katalog meteorit pertama berbahasa Indonesia' },
  { year: '2024', label: 'Integrasi data NASA APOD, forum komunitas aktif, dan fitur monitoring antariksa real-time' },
  { year: '2025', label: 'Penambahan fitur Galeri APOD, data astronot live, tracker ISS, dan sistem blog berlisensi' },
  { year: '2026', label: 'Transformasi menjadi Live Space Dashboard: EPIC, NeoWs, peta langit malam, dan data roket real-time' },
];

export default function VisiMisiPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 z-0" />
        <div className="absolute inset-0 bg-[url('/nebula.webp')] bg-cover bg-center opacity-15 z-0" />
        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-amber-400">
            🌌 Meteorit Indonesia V2
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white leading-tight">
            Visi &amp;{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Misi
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Membangun portal <em>Live Space Dashboard</em> berbahasa Indonesia pertama yang memadukan edukasi meteorit dengan data antariksa real-time NASA.
          </p>
        </div>
      </section>

      {/* Visi & Misi Cards */}
      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">

          {/* VISI */}
          <div className="relative bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur border border-indigo-500/30 rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl mb-6">🔭</div>
              <h2 className="text-2xl font-extrabold text-indigo-400 mb-4">Visi</h2>
              <p className="text-gray-200 text-base leading-relaxed font-medium">
                Menjadi portal <strong>Live Space Dashboard berbahasa Indonesia pertama</strong> yang memadukan edukasi meteorit dengan data antariksa real-time, sehingga setiap warga Indonesia dapat memahami dan menikmati keajaiban alam semesta.
              </p>
            </div>
          </div>

          {/* MISI */}
          <div className="relative bg-gradient-to-br from-amber-950/40 to-slate-900/60 backdrop-blur border border-amber-500/20 rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl mb-6">🚀</div>
              <h2 className="text-2xl font-extrabold text-amber-400 mb-4">Misi</h2>
              <ul className="space-y-3">
                {[
                  'Menyajikan data NASA, ESA, dan lembaga antariksa dunia dalam bahasa Indonesia yang mudah dipahami',
                  'Membangun komunitas astronomi Indonesia yang inklusif, aktif, dan berbasis pengetahuan',
                  'Mendukung literasi sains nasional melalui konten edukasi meteorit, komet, dan fenomena antariksa',
                  'Menyediakan data real-time (ISS, astronot, APOD, NEO) yang akurat dan terverifikasi',
                  'Menjadi referensi terpercaya bagi pelajar, peneliti, dan penggemar astronomi Indonesia',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-bold mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Nilai-Nilai */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Nilai-Nilai Kami</h2>
            <p className="text-gray-400">Prinsip yang memandu setiap keputusan dan inovasi di Meteorit Indonesia</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300 group">
                <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-300">{v.icon}</span>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Perjalanan Kami</h2>
            <p className="text-gray-400">Tonggak penting dalam perkembangan Meteorit Indonesia</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-amber-500/30 to-transparent hidden md:block"></div>
            <div className="space-y-6">
              {MILESTONES.map((m, i) => (
                <div key={m.year} className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 text-sm hidden md:flex">
                    {m.year}
                  </div>
                  <div className="flex-1 bg-slate-900/40 border border-slate-700/40 rounded-2xl p-5 hover:border-cyan-500/20 transition-colors">
                    <p className="text-xs text-cyan-400 font-bold mb-1 md:hidden">{m.year}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-12">
          <h2 className="text-2xl font-extrabold text-white mb-4">Bergabunglah dalam Perjalanan Antariksa Ini</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Bersama komunitas astronomi Indonesia, mari kita eksplorasi alam semesta dan tingkatkan literasi sains bangsa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ensiklopedia"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
            >
              🪨 Jelajahi Ensiklopedia
            </Link>
            <Link
              href="/forum"
              className="border-2 border-indigo-500/60 text-indigo-400 hover:bg-indigo-500/10 font-bold py-3 px-8 rounded-xl transition-all hover:scale-105"
            >
              🤝 Gabung Komunitas
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
