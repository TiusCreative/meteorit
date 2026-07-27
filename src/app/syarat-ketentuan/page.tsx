"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSiteHost } from '@/lib/siteUrl';
import { syaratKetentuanText } from '@/lib/translations/syaratKetentuan';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export default function SyaratKetentuan() {
  const language = useSiteLanguage();
  const t = syaratKetentuanText[language];
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

          {/* NASA License Section - PROMINENT */}
          <div className="bg-gradient-to-br from-blue-950/60 to-slate-900/60 border border-blue-500/30 rounded-2xl p-8 mb-8 shadow-lg shadow-blue-950/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl flex-shrink-0">🛰️</div>
              <div>
                <h2 className="text-xl font-bold text-blue-300 mb-3">{t.licensingTitle}</h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {t.licensingDesc}
                </p>
                <div className="space-y-4">

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <span>🌌</span> {t.nasaApiTitle}
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      {t.nasaApiItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                      <span>🚀</span> {t.spacedevsTitle}
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      {t.spacedevsItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                      <span>🛰️</span> {t.opennotifyTitle}
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      {t.opennotifyItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                      <span>🌠</span> {t.stellariumTitle}
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      {t.stellariumItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                </div>
                <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                  {t.licensingNote}
                </p>
              </div>
            </div>
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
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.useTitle}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.eligibilityTitle}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {t.eligibilityDesc}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.accountTitle}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {t.accountDesc}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.contentTitle}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {t.contentDesc}
                </p>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside mt-2">
                  {t.contentItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t.rightsTitle}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {t.rightsDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.intellectualTitle}</h2>
            <p className="text-gray-300 leading-relaxed text-sm mb-4">
              {t.intellectualP1}
            </p>
            <p className="text-gray-300 leading-relaxed text-sm mb-3">{t.intellectualP2}</p>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              {t.intellectualItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.forumTitle}</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              {t.forumDesc}
            </p>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              {t.forumItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.donationTitle}</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              {t.donationDesc}
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t.premiumDesc}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.liabilityTitle}</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              {t.liabilityDesc}
            </p>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              {t.liabilityItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">{t.contactTitle}</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {t.contactDesc}
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">Email: <a href={`mailto:${contactEmail}`} className="text-cyan-400 hover:text-cyan-300">{contactEmail}</a></p>
              <p className="text-gray-300">Telegram: <a href="https://t.me/meteoritindonesia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">t.me/meteoritindonesia</a></p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
