'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaFacebookF, FaInstagram, FaTelegramPlane, FaWhatsapp, FaTwitter, FaYoutube, FaSpotify, FaPinterest, FaPodcast, FaApple } from 'react-icons/fa'
import { dictionary, defaultLanguage, isSiteLanguage, LANGUAGE_STORAGE_KEY, SiteLanguage } from '@/lib/i18n'

const socialLinks = [
  {
    name: 'WhatsApp Channel',
    href: 'https://whatsapp.com/channel/meteorit',
    icon: FaWhatsapp,
    hoverColor: 'hover:text-green-500 dark:hover:text-green-400',
  },
  {
    name: 'Telegram Channel',
    href: 'https://t.me/meteoritindonesia',
    icon: FaTelegramPlane,
    hoverColor: 'hover:text-sky-500 dark:hover:text-sky-400',
  },
  {
    name: 'X (Twitter)',
    href: 'https://x.com/meteoritind',
    icon: FaTwitter,
    hoverColor: 'hover:text-slate-800 dark:hover:text-white',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/meteorit.indonesia/',
    icon: FaInstagram,
    hoverColor: 'hover:text-pink-500 dark:hover:text-pink-400',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61591469427891',
    icon: FaFacebookF,
    hoverColor: 'hover:text-blue-600 dark:hover:text-blue-400',
  },
  {
    name: 'YouTube Channel',
    href: 'https://www.youtube.com/@Meteorit-h7d',
    icon: FaYoutube,
    hoverColor: 'hover:text-red-600 dark:hover:text-red-500',
  },
  {
    name: 'Spotify Podcast',
    href: 'https://open.spotify.com/show/033TS5YqepN9kNXRguuLZf',
    icon: FaSpotify,
    hoverColor: 'hover:text-emerald-500 dark:hover:text-emerald-400',
  },
  {
    name: 'Pinterest',
    href: 'https://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmeteorit.my.id&media=https%3A%2F%2Fmeteorit.my.id%2Flogo-meteor-spotify.png&description=Meteorit%20Indonesia%20-%20Platform%20Edukasi%20Astronomi%20%26%20Benda%20Langit&app_id=916a7781bd006d5cea3ac39c5087513e3ae89adc',
    icon: FaPinterest,
    hoverColor: 'hover:text-red-500 dark:hover:text-red-400',
  },
]

export default function Footer() {
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage)
  const t = dictionary[language]

  let reversedAttribution = '';
  if (language === 'en') {
    reversedAttribution = '.sesoprup lanoitacude rof desu era dna srenwo thgirypoc evitcepser rieht fo ytreporp era stemoc/setiroetem fo sogol dna sotohp llA .(ataD tuanortsA & rekcarT SSI) yfitoN nepO dna ,(2 yrarbiL hcnuaL) sveD ecapS ehT ,(yciloP ycavirP ASAN yciloP niamod cilbup ASAN rednu esu ot eerf — sWeoN ,CIPE ,DOPA) sIPA nepO ASAN yb emit-laer ni dedivorp ataD :noitubirttA ataD';
  } else if (language === 'zh') {
    reversedAttribution = '。的目育教于用并，产财的者有所权版各自其为均标徽和片照的星彗/石陨有所。供提时实（据数员航宇和器踪追 SSI）yfitoN nepO 和（2 yrarbiL hcnuaL）sveD ecapS ehT、（策政私隐 ASAN 策政域领共公 ASAN 据根 — sWeoN、CIPE、DOPA）sIPA nepO ASAN 由据数：名署据数';
  } else if (language === 'ja') {
    reversedAttribution = '。すまいてれさ用で使用的育教、りであ物有所の者有所権作著のぞれぞれはゴロと真写のすべて星彗/石隕。すまいてれさ供提でムタイリアルよにってに（データ士飛宇とーかっトラ SSI）yfitoN nepO びよお、（2 yrarbiL hcnuaL）sveD ecapS ehT、（シーポリいサーバイプラ ASAN シーポリメンイドッリクバパ の ASAN で下の下使用無で — sWeoN、CIPE、DOPA）sIPA nepO ASAN はデータ：属帰 of ータデ';
  } else {
    reversedAttribution = '.ikasude naujut ktunu nakadigud nad atpic kah kilimep gninasam-gnisasem kilim hala-da temok/tiroetem ogol nad otof huruleS .(ataD tuanortsA & rekcarT SSI) yfitoN nepO nad ,(2 yrarbiL hcnuaL) sveD ecapS ehT ,(ASAN isavirP nakajibeK ASAN kilbup niamod nakajibeK hawab id nakanugid ktunu sitarg — sWeoN ,CIPE ,DOPA) sIPA nepO ASAN helo emit-laer araces nakaidedis ataD :ataD isubirtA';
  }

  useEffect(() => {
    try {
      const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
      if (isSiteLanguage(storedLanguage)) {
        setLanguage(storedLanguage);
      }
    } catch (err) {
      console.warn('Gagal membaca storage di Footer:', err);
    }
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<SiteLanguage>).detail
      if (isSiteLanguage(nextLanguage)) {
        setLanguage(nextLanguage)
      }
    }
    window.addEventListener('meteorit-language-change', handleLanguageChange)
    return () => window.removeEventListener('meteorit-language-change', handleLanguageChange)
  }, [])

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-cyan-950/30 py-12 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-amber-400">Meteorit Indonesia</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
              {t.footerDescription}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-cyan-400">{t.footerMainMenu}</h4>
            <ul className="space-y-2 text-slate-600 dark:text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.navHome}</Link></li>
              <li><Link href="/ensiklopedia" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.navMeteor}</Link></li>
              <li><Link href="/langit-malam" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.navNightSky}</Link></li>
              <li><Link href="/monitoring" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.navMission}</Link></li>
              <li><Link href="/blog" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.navBlog}</Link></li>
              <li><Link href="/apod" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.navApod}</Link></li>
              <li><Link href="/cuaca" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">🌤 {language === 'en' ? 'Weather' : language === 'ms' ? 'Cuaca' : language === 'zh' ? '天气' : language === 'ja' ? '天気' : language === 'fr' ? 'Météo' : language === 'ru' ? 'Погода' : 'Cuaca & Langit'}</Link></li>
              <li><Link href="/miniapp" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">📱 Mini App</Link></li>
              <li><Link href="/forum" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Forum</Link></li>
            </ul>

            {/* Dropdown Menu Pilih Saluran Podcast */}
            <div className="mt-4">
              <label htmlFor="podcast-select" className="text-xs font-semibold text-slate-700 dark:text-cyan-400 mb-1 flex items-center gap-1.5">
                <FaPodcast className="text-emerald-500 text-sm animate-pulse" /> 🎙️ {language === 'en' ? 'Podcast Channels' : 'Saluran Podcast'}:
              </label>
              <select
                id="podcast-select"
                onChange={(e) => {
                  if (e.target.value) {
                    window.open(e.target.value, '_blank', 'noopener,noreferrer');
                  }
                }}
                defaultValue=""
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-cyan-900/60 text-slate-800 dark:text-cyan-300 rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-sm"
              >
                <option value="" disabled>--- {language === 'en' ? 'Select Podcast Platform' : 'Pilih Saluran Podcast'} ---</option>
                <optgroup label="🟢 Spotify Podcast">
                  <option value="https://open.spotify.com/show/033TS5YqepN9kNXRguuLZf">🟢 Spotify (Bahasa Indonesia)</option>
                  <option value="https://open.spotify.com/show/033UqoFQcUSeymMGLqEo0U">🌐 Spotify (English Edition)</option>
                </optgroup>
                <optgroup label="🍎 Apple Podcasts">
                  <option value="https://podcasts.apple.com/us/podcast/meteorit-indonesia-podcast/id6793891219">🍎 Apple Podcasts (Bahasa Indonesia)</option>
                  <option value="https://podcasts.apple.com/us/podcast/meteorit-indonesia-podcast/id6793889181">🍏 Apple Podcasts (English Edition)</option>
                </optgroup>
                <optgroup label="🔴 YouTube Podcast">
                  <option value="https://www.youtube.com/playlist?list=PLIxFsHQZ1MDM">🔴 YouTube Podcast (Bahasa Indonesia)</option>
                  <option value="https://www.youtube.com/playlist?list=PLdy8efOO8Zu8">🌐 YouTube Podcast (English Edition)</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-cyan-400">{t.footerAbout}</h4>
            <ul className="space-y-2 text-slate-600 dark:text-gray-400 text-sm">
              <li><Link href="/tentang" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.footerAboutUs}</Link></li>
              <li><Link href="/visi-misi" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.footerVision}</Link></li>
              <li><Link href="/kontak" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.footerContact}</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.footerTerms}</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{t.footerPrivacy}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-cyan-400">{t.footerFollow}</h4>
            <div className="flex space-x-4 mb-4">
              {socialLinks.map(({ name, href, icon: Icon, hoverColor }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-slate-500 dark:text-gray-400 ${hoverColor} transition-colors`}
                  title={name}
                  aria-label={name}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-500">
              {t.footerJoinTelegram}
            </p>
          </div>
        </div>

        {/* NASA Attribution */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mb-6">
          <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed text-left select-none cursor-default" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              <bdo 
                dir="rtl" 
                className="select-none cursor-default font-normal text-slate-500 dark:text-gray-400" 
                style={{ 
                  unicodeBidi: 'bidi-override', 
                  direction: 'rtl', 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none'
                }}
              >
                {reversedAttribution}
              </bdo>
            </p>
          </div>
        </div>

        {/* Disclaimer & Source Links */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mb-6">
          <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40 rounded-xl px-5 py-4 text-xs text-slate-500 dark:text-gray-500 leading-relaxed text-left space-y-2">
            <p>
              <strong className="text-slate-700 dark:text-gray-400">Disclaimer:</strong> {t.footerDisclaimer}
            </p>
            <p className="select-none cursor-default" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              <strong className="text-slate-700 dark:text-gray-400">{t.footerSourceLinks}</strong>{' '}
              {/* Kami menggunakan bdo dir="rtl" + unicodeBidi: override untuk membalik teks di HTML (mengelabui scraper) tapi normal di layar user */}
              <bdo 
                dir="rtl" 
                className="select-none cursor-default font-semibold text-cyan-600 dark:text-cyan-400" 
                style={{ 
                  unicodeBidi: 'bidi-override', 
                  direction: 'rtl', 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none'
                }}
              >
                SSI yfitoN nepO • 2 yrarbiL hcnuaL • IPA rehtaewNepO • TENOE ASAN • IPA llaberiF LPJ • sIPA ASAN
              </bdo>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-slate-500 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Meteorit Indonesia. {t.footerRights}</p>
          <p className="mt-2">
            {t.footerMade}
          </p>
        </div>
      </div>
    </footer>
  )
}
