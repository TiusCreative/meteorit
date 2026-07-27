import { cookies } from 'next/headers';
import { getGlobalSettings } from '@/lib/settings';
import { getSiteHost } from '@/lib/siteUrl';
import { tentangText } from '@/lib/translations/tentang';
import { LANGUAGE_COOKIE_KEY, defaultLanguage, isSiteLanguage } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function TentangKami() {
  const settings = await getGlobalSettings();
  const contactEmail = `info@${getSiteHost()}`;
  
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const language = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = tentangText[language];

  const visi = (language === 'id' && settings.aboutVisi) ? settings.aboutVisi : t.visionText;
  const misiLines = (language === 'id' && settings.aboutMisi) 
    ? settings.aboutMisi.split('\n').filter(line => line.trim() !== '') 
    : t.missionItems;
  const sejarah = (language === 'id' && settings.aboutSejarah) ? settings.aboutSejarah : t.historyText;

  return (
    <main className="min-h-screen bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-cyan-400">{t.title}</h1>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8 border border-slate-700/40">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">{t.visionLabel}</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            {visi}
          </p>

          <h2 className="text-2xl font-bold mb-4 text-amber-400">{t.missionLabel}</h2>
          <ul className="text-gray-300 space-y-3 list-disc list-inside">
            {misiLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8 border border-slate-700/40">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">{t.historyLabel}</h2>
          <p className="text-gray-300 leading-relaxed">
            {sejarah}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8 border border-slate-700/40">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">{t.partnersLabel}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-750 p-4 rounded-lg text-center border border-slate-700/30">
              <p className="font-semibold text-white">NASA</p>
              <p className="text-xs text-gray-400">{t.partnerRole}</p>
            </div>
            <div className="bg-slate-750 p-4 rounded-lg text-center border border-slate-700/30">
              <p className="font-semibold text-white">BMKG</p>
              <p className="text-xs text-gray-400">{t.partnerRole}</p>
            </div>
            <div className="bg-slate-750 p-4 rounded-lg text-center border border-slate-700/30">
              <p className="font-semibold text-white">ESA</p>
              <p className="text-xs text-gray-400">{t.partnerRole}</p>
            </div>
            <div className="bg-slate-750 p-4 rounded-lg text-center border border-slate-700/30">
              <p className="font-semibold text-white">Open Notify</p>
              <p className="text-xs text-gray-400">{t.partnerRole}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/40">
          <h2 className="text-2xl font-bold mb-4 text-amber-400">{t.joinLabel}</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            {t.joinText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={`mailto:${contactEmail}`}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              {t.ctaContact}
            </a>
            <a
              href="/forum"
              className="border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              {t.ctaForum}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
