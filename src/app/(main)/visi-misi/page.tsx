"use client";

import Link from 'next/link';
import { visiMisiText } from '@/lib/translations/visiMisi';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

const VALUES = [
  { icon: '🌌', titleKey: 'val1Title', descKey: 'val1Desc' },
  { icon: '📡', titleKey: 'val2Title', descKey: 'val2Desc' },
  { icon: '🇮🇩', titleKey: 'val3Title', descKey: 'val3Desc' },
  { icon: '🤝', titleKey: 'val4Title', descKey: 'val4Desc' },
  { icon: '⚡', titleKey: 'val5Title', descKey: 'val5Desc' },
  { icon: '🔬', titleKey: 'val6Title', descKey: 'val6Desc' },
];

const VALUES_DATA: Record<string, { title: string; desc: string }[]> = {
  id: [
    { title: 'Eksplorasi Tanpa Batas', desc: 'Kami percaya rasa ingin tahu adalah bahan bakar kemajuan. Kami mendorong setiap orang Indonesia untuk memandang langit dengan penuh rasa ingin tahu.' },
    { title: 'Data Akurat & Terverifikasi', desc: 'Seluruh data kami bersumber dari lembaga antariksa terpercaya dunia (NASA, ESA, BRIN) dan diverifikasi sebelum dipublikasikan.' },
    { title: 'Bahasa Indonesia Pertama', desc: 'Kami berkomitmen menyajikan data kompleks antariksa dalam bahasa Indonesia yang mudah dipahami oleh seluruh kalangan masyarakat.' },
    { title: 'Komunitas Inklusif', desc: 'Setiap orang berhak belajar tentang antariksa. Forum dan konten kami dirancang terbuka dan ramah untuk pemula hingga peneliti.' },
    { title: 'Real-Time & Relevan', desc: 'Kami tidak hanya menyajikan fakta lama. Data ISS, APOD, astronot, dan peluncuran roket kami perbarui setiap hari secara otomatis.' },
    { title: 'Mendukung Riset Nasional', desc: 'Platform kami dirancang untuk mendukung peneliti, mahasiswa, dan pelajar Indonesia yang membutuhkan akses mudah ke data antariksa.' },
  ],
  en: [
    { title: 'Boundless Exploration', desc: 'We believe curiosity is the fuel of progress. We encourage every Indonesian to look at the sky with wonder.' },
    { title: 'Accurate & Verified Data', desc: 'All our data comes from trusted world space agencies (NASA, ESA, BRIN) and is verified before publication.' },
    { title: 'Indonesian Language First', desc: 'We are committed to presenting complex space data in Indonesian that everyone can understand.' },
    { title: 'Inclusive Community', desc: 'Everyone deserves to learn about space. Our forum and content are open and welcoming from beginners to researchers.' },
    { title: 'Real-Time & Relevant', desc: 'We don\'t just present old facts. ISS, APOD, astronaut, and rocket launch data is updated every day automatically.' },
    { title: 'Supporting National Research', desc: 'Our platform is designed to support Indonesian researchers, university students, and learners who need easy access to space data.' },
  ],
  ms: [
    { title: 'Penerokaan Tanpa Had', desc: 'Kami percaya rasa ingin tahu adalah bahan bakar kemajuan. Kami menggalakkan setiap rakyat Indonesia untuk memandang langit dengan penuh rasa ingin tahu.' },
    { title: 'Data Tepat & Disahkan', desc: 'Semua data kami bersumber dari agensi angkasa terpercaya dunia (NASA, ESA, BRIN) dan disahkan sebelum diterbitkan.' },
    { title: 'Bahasa Indonesia Dahulu', desc: 'Kami komited menyajikan data angkasa yang kompleks dalam bahasa yang mudah difahami oleh semua kalangan masyarakat.' },
    { title: 'Komuniti Inklusif', desc: 'Setiap orang berhak belajar tentang angkasa. Forum dan kandungan kami direka terbuka dan mesra dari pemula hingga penyelidik.' },
    { title: 'Real-Time & Relevan', desc: 'Kami tidak hanya menyajikan fakta lama. Data ISS, APOD, angkasawan, dan pelancaran roket kami kemas kini setiap hari.' },
    { title: 'Menyokong Penyelidikan Nasional', desc: 'Platform kami direka untuk menyokong penyelidik, pelajar universiti, dan pelajar Indonesia yang memerlukan akses mudah ke data angkasa.' },
  ],
  zh: [
    { title: '无限探索', desc: '我们相信好奇心是进步的燃料。我们鼓励每一个印度尼西亚人充满好奇地仰望天空。' },
    { title: '准确且经过验证的数据', desc: '我们所有的数据来自全球受信任的航天机构（NASA、ESA、BRIN），并在发布前经过验证。' },
    { title: '印度尼西亚语优先', desc: '我们致力于以所有人都能理解的印度尼西亚语呈现复杂的太空数据。' },
    { title: '包容的社区', desc: '每个人都有权学习太空知识。我们的论坛和内容对初学者到研究人员都是开放且友好的。' },
    { title: '实时且相关', desc: '我们不只呈现旧事实。ISS、APOD、宇航员和火箭发射数据每天自动更新。' },
    { title: '支持国家研究', desc: '我们的平台旨在支持需要轻松访问太空数据的印度尼西亚研究人员、大学生和学习者。' },
  ],
  ja: [
    { title: '無限の探求', desc: '好奇心は進歩の燃料だと私たちは信じています。すべてのインドネシア人が空を不思議の目で見るよう促します。' },
    { title: '正確で検証済みのデータ', desc: '私たちのデータはすべて、信頼できる世界の宇宙機関（NASA、ESA、BRIN）から得られ、公開前に検証されています。' },
    { title: 'インドネシア語優先', desc: '私たちは、複雑な宇宙データを誰もが理解できるインドネシア語で提供することに取り組んでいます。' },
    { title: '包括的なコミュニティ', desc: 'すべての人が宇宙について学ぶ権利があります。私たちのフォーラムとコンテンツは初心者から研究者まで開放的で歓迎しています。' },
    { title: 'リアルタイムで関連性がある', desc: '古い事実を提示するだけではありません。ISS、APOD、宇宙飛行士、ロケット打上げデータは毎日自動更新されます。' },
    { title: '国家研究の支援', desc: '私たちのプラットフォームは、宇宙データへの簡単なアクセスを必要とするインドネシアの研究者、大学生、学習者をサポートするように設計されています。' },
  ],
  ru: [
    { title: 'Безграничные исследования', desc: 'Мы верим, что любопытство — это двигатель прогресса. Мы призываем каждого смотреть на небо с интересом.' },
    { title: 'Точные и проверенные данные', desc: 'Все наши данные поступают из надежных мировых космических агентств (NASA, ESA, BRIN) и проверяются перед публикацией.' },
    { title: 'Местный язык прежде всего', desc: 'Мы стремимся представлять сложные космические данные на понятном индонезийском и местном языках.' },
    { title: 'Инклюзивное сообщество', desc: 'Каждый имеет право изучать космос. Наш форум и контент открыты для всех — от новичков до исследователей.' },
    { title: 'В реальном времени', desc: 'Мы не просто представляем старые факты. Данные МКС, APOD, космонавтов и запусков ракет обновляются автоматически каждый день.' },
    { title: 'Поддержка исследований', desc: 'Наша платформа разработана для поддержки индонезийских исследователей, студентов и всех, кому нужен доступ к космическим данным.' },
  ],
  fr: [
    { title: 'Exploration sans limites', desc: 'Nous croyons que la curiosité est le moteur du progrès. Nous encourageons chacun à regarder le ciel avec émerveillement.' },
    { title: 'Données précises & vérifiées', desc: 'Toutes nos données proviennent d\'agences spatiales mondiales de confiance (NASA, ESA, BRIN) et sont vérifiées avant publication.' },
    { title: 'La langue locale d\'abord', desc: 'Nous nous engageons à présenter des données spatiales complexes dans un langage simple et accessible.' },
    { title: 'Communauté inclusive', desc: 'Tout le monde a le droit d\'apprendre sur l\'espace. Notre forum et nos contenus sont ouverts et accueillants, des débutants aux chercheurs.' },
    { title: 'Temps réel & pertinent', desc: 'Nous ne présentons pas seulement des faits anciens. Les données de l\'ISS, de l\'APOD, des astronautes et des lancements de fusées sont mises à jour automatiquement chaque jour.' },
    { title: 'Soutien à la recherche', desc: 'Notre plateforme est conçue pour soutenir les chercheurs, les étudiants et les apprenants qui ont besoin d\'un accès facile aux données spatiales.' },
  ],
};

const MILESTONES = [
  { year: '2023', id: 'Meteorit Indonesia diluncurkan sebagai platform katalog meteorit pertama berbahasa Indonesia', en: 'Meteorit Indonesia launched as the first Indonesian-language meteorite catalog platform', ms: 'Meteorit Indonesia dilancarkan sebagai platform katalog meteorit pertama berbahasa Indonesia', zh: 'Meteorit Indonesia 作为首个印度尼西亚语陨石目录平台推出', ja: 'Meteorit Indonesiaがインドネシア語初の隕石カタログプラットフォームとして開始' },
  { year: '2024', id: 'Integrasi data NASA APOD, forum komunitas aktif, dan fitur monitoring antariksa real-time', en: 'NASA APOD data integration, active community forum, and real-time space monitoring features', ms: 'Integrasi data NASA APOD, forum komuniti aktif, dan ciri pemantauan angkasa real-time', zh: 'NASA APOD 数据集成、活跃的社区论坛和实时太空监测功能', ja: 'NASA APODデータ統合、活発なコミュニティフォーラム、リアルタイム宇宙モニタリング機能' },
  { year: '2025', id: 'Penambahan fitur Galeri APOD, data astronot live, tracker ISS, dan sistem blog berlisensi', en: 'Addition of APOD Gallery, live astronaut data, ISS tracker, and licensed blog system', ms: 'Penambahan Galeri APOD, data angkasawan langsung, penjejak ISS, dan sistem blog berlesen', zh: '新增 APOD 画廊、实时宇航员数据、ISS 追踪器和授权博客系统', ja: 'APODギャラリー、ライブ宇宙飛行士データ、ISSトラッカー、ライセンス付きブログシステムを追加' },
  { year: '2026', id: 'Transformasi menjadi Live Space Dashboard: EPIC, NeoWs, peta langit malam, dan data roket real-time', en: 'Transformation to Live Space Dashboard: EPIC, NeoWs, night sky map, and real-time rocket data', ms: 'Transformasi kepada Live Space Dashboard: EPIC, NeoWs, peta langit malam, dan data roket real-time', zh: '转型为 Live Space Dashboard：EPIC、NeoWs、夜空地图和实时火箭数据', ja: 'Live Space Dashboardへの変革：EPIC、NeoWs、夜空マップ、リアルタイムロケットデータ' },
];

export default function VisiMisiPage() {
  const language = useSiteLanguage();
  const t = visiMisiText[language];
  const values = VALUES_DATA[language] || VALUES_DATA['id'];

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
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t.title}
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {t.visionText}
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
              <h2 className="text-2xl font-extrabold text-indigo-400 mb-4">{t.visionLabel}</h2>
              <p className="text-gray-200 text-base leading-relaxed font-medium">{t.visionText}</p>
            </div>
          </div>

          {/* MISI */}
          <div className="relative bg-gradient-to-br from-amber-950/40 to-slate-900/60 backdrop-blur border border-amber-500/20 rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl mb-6">🚀</div>
              <h2 className="text-2xl font-extrabold text-amber-400 mb-4">{t.missionLabel}</h2>
              <ul className="space-y-3">
                {t.missionItems.map((item, i) => (
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
            <h2 className="text-3xl font-extrabold text-white mb-3">{t.valuesTitle}</h2>
            <p className="text-gray-400">{t.valuesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300 group">
                <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-300">{VALUES[values.indexOf(v)]?.icon || '🌟'}</span>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">{t.timelineTitle}</h2>
            <p className="text-gray-400">{t.timelineSubtitle}</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-amber-500/30 to-transparent hidden md:block"></div>
            <div className="space-y-6">
              {MILESTONES.map((m) => (
                <div key={m.year} className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 text-sm hidden md:flex">
                    {m.year}
                  </div>
                  <div className="flex-1 bg-slate-900/40 border border-slate-700/40 rounded-2xl p-5 hover:border-cyan-500/20 transition-colors">
                    <p className="text-xs text-cyan-400 font-bold mb-1 md:hidden">{m.year}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{m[language as keyof typeof m] || m.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-12">
          <h2 className="text-2xl font-extrabold text-white mb-4">{t.ctaTitle}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">{t.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ensiklopedia"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
            >
              {t.ctaEncyc}
            </Link>
            <Link
              href="/forum"
              className="border-2 border-indigo-500/60 text-indigo-400 hover:bg-indigo-500/10 font-bold py-3 px-8 rounded-xl transition-all hover:scale-105"
            >
              {t.ctaCommunity}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
