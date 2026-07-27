"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSiteHost } from '@/lib/siteUrl';
import { kebijakanPrivasiText } from '@/lib/translations/kebijakanPrivasi';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export default function KebijakanPrivasi() {
  const language = useSiteLanguage();
  const t = kebijakanPrivasiText[language];
  const contactEmail = `info@${getSiteHost()}`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-cyan-400 mb-3">{t.title}</h1>
            <p className="text-gray-400 text-sm">{t.lastUpdated}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.introTitle}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t.introP1}
            </p>
            <p className="text-gray-300 leading-relaxed">
              {t.introP2}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.collectTitle}</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.collectP1Title}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {t.collectP1Desc}
                </p>
                <ul className="text-gray-300 space-y-2 list-disc list-inside mt-2 text-sm">
                  {t.collectP1Items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.collectP2Title}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {t.collectP2Desc}
                </p>
                <ul className="text-gray-300 space-y-2 list-disc list-inside mt-2 text-sm">
                  {t.collectP2Items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.collectP3Title}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {t.collectP3Desc}
                </p>
                <ul className="text-gray-300 space-y-2 list-disc list-inside mt-2 text-sm">
                  {t.collectP3Items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="text-gray-300 leading-relaxed mt-2 text-sm">
                  {t.collectP3Note}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.useTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.useDesc}
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside text-sm">
                {t.useItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.protectTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.protectDesc}
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside text-sm">
                {t.protectItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-300 leading-relaxed">
                {t.protectNote}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.shareTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.shareDesc}
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside text-sm">
                {t.shareItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-300 leading-relaxed mt-2">
                {t.shareNote}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.rightsTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.rightsDesc}
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside text-sm">
                {t.rightsItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-300 leading-relaxed mt-2">
                {t.rightsNote}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.retentionTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.retentionP1}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t.retentionP2}
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside text-sm">
                {t.retentionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.childrenTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.childrenP1}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t.childrenP2}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.changesTitle}</h2>

            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                {t.changesP1}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t.changesP2}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.contactTitle}</h2>

            <p className="text-gray-300 leading-relaxed mb-4">
              {t.contactDesc}
            </p>

            <div className="space-y-2 text-sm text-gray-300">
              <p>{t.emailLabel}: <a href={`mailto:${contactEmail}`} className="text-cyan-400 hover:text-cyan-300">{contactEmail}</a></p>
              <p>{t.addressLabel}: {t.addressDesc}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
