"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LANGUAGE_COOKIE_KEY, LANGUAGE_STORAGE_KEY, SiteLanguage, defaultLanguage, isSiteLanguage, languageOptions } from '@/lib/i18n';
import type { GlossaryTerm, GlossaryCategory } from '@/lib/glossaryData';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';

const PAGE_SIZE = 20;

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// UI teks per bahasa untuk halaman Glossarium
const glossaryUI: Record<SiteLanguage, {
  title: string;
  subtitle: string;
  badge: string;
  savePdf: string;
  share: string;
  searchPlaceholder: string;
  voiceBtn: string;
  listening: string;
  allCategory: string;
  showingOf: string;
  page: string;
  prev: string;
  next: string;
  openDetail: string;
}> = {
  id: {
    title: 'Glossarium Sains',
    subtitle: 'Kamus istilah meteorologi, geofisika, astronomi, dan misi antariksa dalam Bahasa Indonesia, Inggris, Melayu, Mandarin, Jepang, Rusia, dan Prancis.',
    badge: 'BMKG + NASA',
    savePdf: 'Simpan PDF',
    share: 'Share',
    searchPlaceholder: 'Cari istilah, contoh: hujan ringan, APOD, kosame...',
    voiceBtn: 'Voice',
    listening: 'Mendengar...',
    allCategory: 'Semua Kategori',
    showingOf: 'Menampilkan {shown} dari {total} istilah. Halaman {page} / {totalPages}.',
    page: 'Halaman',
    prev: 'Sebelumnya',
    next: 'Berikutnya',
    openDetail: 'Buka detail',
  },
  en: {
    title: 'Science Glossary',
    subtitle: 'Dictionary of meteorology, geophysics, astronomy, and space mission terms in Indonesian, English, Malay, Chinese, Japanese, Russian, and French.',
    badge: 'BMKG + NASA',
    savePdf: 'Save PDF',
    share: 'Share',
    searchPlaceholder: 'Search terms, e.g.: aurora, APOD, comet...',
    voiceBtn: 'Voice',
    listening: 'Listening...',
    allCategory: 'All Categories',
    showingOf: 'Showing {shown} of {total} terms. Page {page} / {totalPages}.',
    page: 'Page',
    prev: 'Previous',
    next: 'Next',
    openDetail: 'Open detail',
  },
  ms: {
    title: 'Glosari Sains',
    subtitle: 'Kamus istilah meteorologi, geofizik, astronomi, dan misi angkasa dalam pelbagai bahasa.',
    badge: 'BMKG + NASA',
    savePdf: 'Simpan PDF',
    share: 'Kongsi',
    searchPlaceholder: 'Cari istilah, contoh: hujan, APOD, komet...',
    voiceBtn: 'Suara',
    listening: 'Mendengar...',
    allCategory: 'Semua Kategori',
    showingOf: 'Memaparkan {shown} daripada {total} istilah. Halaman {page} / {totalPages}.',
    page: 'Halaman',
    prev: 'Sebelumnya',
    next: 'Seterusnya',
    openDetail: 'Buka perincian',
  },
  zh: {
    title: '科学词汇表',
    subtitle: '涵盖气象学、地球物理学、天文学及太空任务术语的多语言词典。',
    badge: 'BMKG + NASA',
    savePdf: '保存为 PDF',
    share: '分享',
    searchPlaceholder: '搜索术语，例如：极光、APOD、彗星…',
    voiceBtn: '语音',
    listening: '聆听中…',
    allCategory: '所有分类',
    showingOf: '显示第 {shown} 条，共 {total} 条。第 {page} / {totalPages} 页。',
    page: '页',
    prev: '上一页',
    next: '下一页',
    openDetail: '查看详情',
  },
  ja: {
    title: '科学用語集',
    subtitle: '気象学・地球物理学・天文学・宇宙ミッションに関する多言語用語辞典。',
    badge: 'BMKG + NASA',
    savePdf: 'PDFで保存',
    share: '共有',
    searchPlaceholder: '用語を検索、例：オーロラ、APOD、彗星…',
    voiceBtn: '音声',
    listening: '聴取中…',
    allCategory: 'すべてのカテゴリ',
    showingOf: '{total} 件中 {shown} 件表示。{page} / {totalPages} ページ。',
    page: 'ページ',
    prev: '前へ',
    next: '次へ',
    openDetail: '詳細を開く',
  },
  ru: {
    title: 'Научный глоссарий',
    subtitle: 'Словарь терминов метеорологии, геофизики, астрономии и космических миссий на нескольких языках.',
    badge: 'BMKG + NASA',
    savePdf: 'Сохранить PDF',
    share: 'Поделиться',
    searchPlaceholder: 'Поиск терминов, например: аврора, APOD, комета…',
    voiceBtn: 'Голос',
    listening: 'Слушаю…',
    allCategory: 'Все категории',
    showingOf: 'Показано {shown} из {total} терминов. Страница {page} / {totalPages}.',
    page: 'Страница',
    prev: 'Назад',
    next: 'Вперёд',
    openDetail: 'Открыть подробнее',
  },
  fr: {
    title: 'Glossaire scientifique',
    subtitle: 'Dictionnaire de termes en météorologie, géophysique, astronomie et missions spatiales en plusieurs langues.',
    badge: 'BMKG + NASA',
    savePdf: 'Enregistrer PDF',
    share: 'Partager',
    searchPlaceholder: 'Rechercher un terme, ex : aurore, APOD, comète…',
    voiceBtn: 'Voix',
    listening: 'Écoute…',
    allCategory: 'Toutes les catégories',
    showingOf: 'Affichage de {shown} sur {total} termes. Page {page} / {totalPages}.',
    page: 'Page',
    prev: 'Précédent',
    next: 'Suivant',
    openDetail: 'Voir les détails',
  },
};

import { useLocalizedGlossary } from '@/lib/useLocalizedGlossary';

export default function GlossaryClient({ initialTerms }: { initialTerms: GlossaryTerm[] }) {
  const language = useSiteLanguage();
  const ui = glossaryUI[language] || glossaryUI['id'];
  const terms = useLocalizedGlossary(initialTerms, language);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'Semua'>('Semua');
  const [page, setPage] = useState(1);
  const [isListening, setIsListening] = useState(false);

  const filteredTerms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return terms.filter((item) => {
      const categoryMatch = category === 'Semua' || item.category === category;
      const haystack = [
        item.category,
        item.term.id,
        item.term.en,
        item.term.ms,
        item.term.zh,
        item.term.ja,
        item.term.ru,
        item.term.fr,
        item.definition.id,
        item.definition[language],
      ].filter(Boolean).join(' ').toLowerCase();
      return categoryMatch && (!normalized || haystack.includes(normalized));
    });
  }, [category, terms, query, language]);

  const totalPages = Math.max(1, Math.ceil(filteredTerms.length / PAGE_SIZE));
  const paginatedTerms = filteredTerms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [category, query, language]);

  function changeLanguage(nextLanguage: SiteLanguage) {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      }
      if (typeof document !== 'undefined') {
        document.cookie = `${LANGUAGE_COOKIE_KEY}=${nextLanguage}; max-age=31536000; path=/; samesite=lax`;
      }
    } catch (err) {
      console.warn('Gagal menyimpan storage di GlossaryClient:', err);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meteorit-language-change', { detail: nextLanguage }));
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLanguage;
    }
  }

  async function savePdf() {
    const element = document.getElementById('glossary-pdf-content');
    if (!element) {
      alert('Konten glossarium tidak ditemukan.');
      return;
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .from(element)
        .set({
          margin: 0.45,
          filename: `glossarium-sains-${language}.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        } as any)
        .save();
    } catch (error) {
      console.error('[Glossarium] Gagal menyimpan PDF:', error);
      alert('Gagal menyimpan PDF secara langsung.');
    }
  }

  async function shareGlossary() {
    const shareData = {
      title: ui.title,
      text: ui.subtitle,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    alert(language === 'ru' ? 'Ссылка скопирована.' : language === 'fr' ? 'Lien copié.' : language === 'en' ? 'Link copied.' : language === 'zh' ? '链接已复制。' : language === 'ja' ? 'リンクをコピーしました。' : 'Link glossarium disalin.');
  }

  function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice to text belum didukung browser ini.');
      return;
    }

    const langMap: Record<SiteLanguage, string> = {
      id: 'id-ID', en: 'en-US', ms: 'ms-MY', zh: 'zh-CN', ja: 'ja-JP', ru: 'ru-RU', fr: 'fr-FR'
    };

    const recognition = new SpeechRecognition();
    recognition.lang = langMap[language] || 'id-ID';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setQuery(event.results[0][0].transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  }

  const showingText = ui.showingOf
    .replace('{shown}', String(paginatedTerms.length))
    .replace('{total}', String(filteredTerms.length))
    .replace('{page}', String(page))
    .replace('{totalPages}', String(totalPages));

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between print:hidden">
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">{ui.badge}</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-extrabold text-cyan-300">{ui.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              {ui.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={savePdf} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-400">
              {ui.savePdf}
            </button>
            <button onClick={shareGlossary} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-500">
              {ui.share}
            </button>
          </div>
        </div>

        <section id="glossary-pdf-content" className="mt-8 rounded-2xl border border-cyan-900/30 bg-slate-900/50 p-4 md:p-5 print:border-0 print:bg-white print:p-0">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] print:hidden">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={ui.searchPlaceholder}
                className="min-w-0 flex-1 rounded-lg border border-cyan-900/40 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
              <button
                onClick={startVoiceSearch}
                className="rounded-lg border border-cyan-700 px-4 py-3 text-sm font-black text-cyan-200 hover:bg-cyan-950"
              >
                {isListening ? ui.listening : ui.voiceBtn}
              </button>
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as GlossaryCategory | 'Semua')}
              className="rounded-lg border border-cyan-900/40 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none"
            >
              <option value="Semua">{ui.allCategory}</option>
              <option value="BMKG">BMKG</option>
              <option value="NASA">NASA</option>
            </select>
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value as SiteLanguage)}
              className="rounded-lg border border-cyan-900/40 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none"
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {paginatedTerms.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60 text-left transition-colors hover:border-cyan-500 print:border-gray-300 print:bg-white">
                <Link href={`/glossarium/${item.id}`} className="block">
                  <div className="h-40 bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.term[language] || item.term.en || item.term.id}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${item.category === 'BMKG' ? 'bg-cyan-400 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                          {item.category}
                        </span>
                        <h2 className="mt-3 text-xl font-extrabold text-cyan-200 print:text-black">
                          {item.term[language] || item.term.en || item.term.id}
                        </h2>
                      </div>
                      <p className="text-right text-xs font-bold text-slate-400">{item.term.en}</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300 print:text-black">
                      {item.definition[language] || item.definition.en || item.definition.id}
                    </p>
                    <p className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-400 print:bg-gray-100 print:text-black">
                      {item.example[language] || item.example.en || item.example.id}
                    </p>
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-300 print:hidden">
                      {ui.openDetail}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <p className="text-xs font-semibold text-slate-400">
              {showingText}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-40"
              >
                {ui.prev}
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-40"
              >
                {ui.next}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
