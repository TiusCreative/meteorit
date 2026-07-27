"use client";

import { useEffect, useRef, useState } from 'react';
import { useUserRole } from '@/lib/useUserRole';
import type { GlossaryTerm } from '@/lib/glossaryData';
import type { SiteLanguage } from '@/lib/i18n';

export default function GlossaryDetailActions({
  term,
  language,
}: {
  term: GlossaryTerm;
  language: SiteLanguage;
}) {
  const { isPremiumOrAdmin } = useUserRole();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const title = term.term[language] || term.term.id;
  const definition = term.definition[language] || term.definition.id;
  const example = term.example[language] || term.example.id;

  const dict = {
    id: {
      stopVoice: 'Hentikan Suara',
      playVoice: 'Putar Suara',
      savePdf: 'Simpan PDF',
      share: 'Bagikan',
      shareCard: 'Share Card',
      notFound: 'Konten detail glossarium tidak ditemukan.',
      failPdf: 'Gagal menyimpan PDF.',
      copied: 'Link detail glossarium disalin.',
      failCard: 'Gagal membuat share card.'
    },
    en: {
      stopVoice: 'Stop Voice',
      playVoice: 'Play Voice',
      savePdf: 'Save PDF',
      share: 'Share',
      shareCard: 'Share Card',
      notFound: 'Glossary content not found.',
      failPdf: 'Failed to save PDF.',
      copied: 'Glossary link copied.',
      failCard: 'Failed to create share card.'
    },
    ms: {
      stopVoice: 'Hentikan Suara',
      playVoice: 'Putar Suara',
      savePdf: 'Simpan PDF',
      share: 'Kongsi',
      shareCard: 'Share Card',
      notFound: 'Kandungan glosarium tidak ditemui.',
      failPdf: 'Gagal menyimpan PDF.',
      copied: 'Pautan glosarium disalin.',
      failCard: 'Gagal membuat share card.'
    },
    zh: {
      stopVoice: '停止播放',
      playVoice: '播放声音',
      savePdf: '保存 PDF',
      share: '分享',
      shareCard: '分享卡',
      notFound: '未找到术语表内容。',
      failPdf: '保存 PDF 失败。',
      copied: '术语表链接已复制。',
      failCard: '创建分享卡失败。'
    },
    ja: {
      stopVoice: '音声停止',
      playVoice: '音声を再生',
      savePdf: 'PDFを保存',
      share: '共有',
      shareCard: 'シェアカード',
      notFound: '用語集のコンテンツが見つかりません。',
      failPdf: 'PDFの保存に失敗しました。',
      copied: '用語集のリンクがコピーされました。',
      failCard: 'シェアカードの作成に失敗しました。'
    },
    ru: {
      stopVoice: 'Остановить голос',
      playVoice: 'Воспроизвести',
      savePdf: 'Сохранить PDF',
      share: 'Поделиться',
      shareCard: 'Открытка',
      notFound: 'Содержимое глоссария не найдено.',
      failPdf: 'Не удалось сохранить PDF.',
      copied: 'Ссылка на глоссарий скопирована.',
      failCard: 'Не удалось создать открытку.'
    },
    fr: {
      stopVoice: 'Arrêter la voix',
      playVoice: 'Lire la voix',
      savePdf: 'Enregistrer PDF',
      share: 'Partager',
      shareCard: 'Carte de partage',
      notFound: 'Contenu du glossaire introuvable.',
      failPdf: 'Échec de la sauvegarde du PDF.',
      copied: 'Lien du glossaire copié.',
      failCard: 'Échec de la création de la carte.'
    }
  };

  const t = dict[language] || dict.id;

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function toggleSpeech() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${title}. ${definition}. ${example}`);
    const langMap: Record<string, string> = {
      id: 'id-ID', en: 'en-US', ms: 'ms-MY', zh: 'zh-CN', ja: 'ja-JP', ru: 'ru-RU', fr: 'fr-FR'
    };
    utterance.lang = langMap[language] || 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function savePdf() {
    const element = document.getElementById('glossary-detail-pdf');
    if (!element) {
      alert(t.notFound);
      return;
    }

    // === CSS: Force print-friendly styling + prevent awkward page breaks ===
    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-glossary-print-style';
    styleEl.innerHTML = `
      #glossary-detail-pdf {
        background: #fff !important;
        color: #111 !important;
      }
      #glossary-detail-pdf * {
        color: #111 !important;
        background-color: transparent !important;
        border-color: #ddd !important;
      }
      #glossary-detail-pdf h1, #glossary-detail-pdf h2, #glossary-detail-pdf h3 {
        color: #000 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #glossary-detail-pdf img {
        max-height: 280px !important;
        width: 100% !important;
        object-fit: cover !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #glossary-detail-pdf section,
      #glossary-detail-pdf div,
      #glossary-detail-pdf p {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #glossary-detail-pdf .grid {
        display: block !important;
      }
      #glossary-detail-pdf .grid > * {
        margin-bottom: 12px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    document.head.appendChild(styleEl);

    // === INJECT TILED WATERMARK ===
    if (!isPremiumOrAdmin) {
      const watermarkEl = document.createElement('div');
      watermarkEl.id = 'pdf-watermark-meteorit';
      watermarkEl.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 10;
        opacity: 0.18;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><text x='20' y='90' font-size='11' font-weight='bold' font-family='sans-serif' fill='%2306b6d4' transform='rotate(-28 20 90)' opacity='0.8'>Meteorit.my.id</text></svg>");
        background-repeat: repeat;
      `;
      element.style.position = 'relative';
      element.appendChild(watermarkEl);
    }

    // === INJECT FOOTER LEGALITAS ===
    const footerEl = document.createElement('div');
    footerEl.id = 'pdf-footer-meteorit';
    footerEl.style.cssText = `
      margin-top: 32px;
      padding: 12px 0 4px;
      border-top: 1.5px solid #e0e0e0;
      text-align: center;
      font-family: Arial, sans-serif;
      page-break-inside: avoid;
      break-inside: avoid;
    `;
    footerEl.innerHTML = `
      <p style="font-size: 10px; color: #888; margin: 0; line-height: 1.6;">
        Generated by <strong>Meteorit.my.id</strong> &nbsp;|&nbsp; Source: NASA Open API &amp; BMKG Indonesia
      </p>
      <p style="font-size: 9px; color: #aaa; margin: 4px 0 0;">
        &copy; ${new Date().getFullYear()} Meteorit.my.id &mdash; Semua konten hanya untuk tujuan edukasi.
      </p>
    `;
    element.appendChild(footerEl);

    // === BYPASS CORS FOR IMAGES ===
    const images = element.getElementsByTagName('img');
    const originalSrcs = new Map<HTMLImageElement, string>();
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      originalSrcs.set(img, img.src);
      if (img.src && !img.src.startsWith('data:') && !img.src.startsWith(window.location.origin)) {
        img.src = `/api/image-proxy?url=${encodeURIComponent(img.src)}`;
      }
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .from(element)
        .set({
          margin: [0.45, 0.5, 0.5, 0.5],
          filename: `${term.id}.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: 'css' },
        } as any)
        .save();
    } catch (error) {
      console.error('[Glossarium Detail] Gagal menyimpan PDF:', error);
      alert(t.failPdf);
    } finally {
      document.getElementById('pdf-glossary-print-style')?.remove();
      const watermark = document.getElementById('pdf-watermark-meteorit');
      if (watermark) watermark.remove();
      const footer = document.getElementById('pdf-footer-meteorit');
      if (footer) footer.remove();
      element.style.position = '';

      // Restore original image srcs
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const orig = originalSrcs.get(img);
        if (orig) img.src = orig;
      }
    }
  }

  async function sharePage() {
    const url = window.location.href;
    const shareData = {
      title: `${title} - Glossarium Sains`,
      text: definition,
      url,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(url);
    alert(t.copied);
  }

  async function downloadShareCard() {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 3,
        logging: false,
        backgroundColor: '#020617',
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `share-card-${term.id}.png`;
      link.click();
    } catch (error) {
      console.error('[Glossarium Detail] Gagal membuat share card:', error);
      alert(t.failCard);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          onClick={toggleSpeech}
          className={`rounded-lg px-4 py-2 text-sm font-black transition-colors ${isSpeaking ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}
        >
          {isSpeaking ? t.stopVoice : t.playVoice}
        </button>
        <button onClick={savePdf} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-400 transition-colors">
          {t.savePdf}
        </button>
        <button onClick={sharePage} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 transition-colors">
          {t.share}
        </button>
        <button onClick={downloadShareCard} className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-black text-cyan-200 hover:bg-cyan-950 transition-colors">
          {t.shareCard}
        </button>
      </div>

      <div className="fixed left-0 top-[-9999px] z-[-1] print:hidden">
        <div ref={cardRef} className="w-[450px] overflow-hidden bg-slate-950 text-white">
          <img src={term.image} alt={title} className="h-[250px] w-full object-cover" />
          <div className="border-t-4 border-cyan-400 p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">{term.category} Glossarium</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-cyan-200">{title}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200">{definition}</p>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Meteorit Indonesia</p>
          </div>
        </div>
      </div>
    </>
  );
}
