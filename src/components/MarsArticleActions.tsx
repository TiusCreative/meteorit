"use client";

import { useEffect, useRef, useState } from 'react';
import { FaPinterest } from 'react-icons/fa';
import { useUserRole } from '@/lib/useUserRole';

interface MarsArticle {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  mars_data?: {
    topic?: string;
    rover?: string;
    camera?: string;
    sol?: number;
    earth_date?: string;
  };
}

interface MarsArticleActionsProps {
  article: MarsArticle;
}

export default function MarsArticleActions({ article }: MarsArticleActionsProps) {
  const { isPremiumOrAdmin } = useUserRole();
  const [shareUrls, setShareUrls] = useState({ whatsapp: '', telegram: '', facebook: '', pinterest: '' });
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    const pinterestApiKey = process.env.NEXT_PUBLIC_PINTEREST_API_KEY || '916a7781bd006d5cea3ac39c5087513e3ae89adc';
    setShareUrls({
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Baca artikel Planet Mars "${article.title}" di Meteorit Indonesia: ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Artikel Planet Mars: ${article.title}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(article.image || '')}&description=${encodeURIComponent(article.title)}&app_id=${pinterestApiKey}`
    });

    return () => {
      recognitionRef.current?.stop?.();
    };
  }, [article.title]);

  const handleVoiceToText = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser ini belum mendukung voice to text. Coba gunakan Chrome atau Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ');
      setVoiceText(transcript.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-mars-content');
    if (!element) {
      alert('Elemen artikel Mars tidak ditemukan.');
      return;
    }

    // Sembunyikan elemen actions bar jika ada di dalam printable content
    const actionsBar = element.querySelector('.border-y');
    const originalDisplay = actionsBar ? (actionsBar as HTMLElement).style.display : '';
    if (actionsBar) {
      (actionsBar as HTMLElement).style.setProperty('display', 'none', 'important');
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-force-black-text-mars';
    styleEl.innerHTML = `
      #printable-mars-content * {
        color: #000 !important;
        background-color: transparent !important;
        border-color: #ccc !important;
      }
      #printable-mars-content h1,
      #printable-mars-content h2,
      #printable-mars-content h3 {
        color: #111 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #printable-mars-content p,
      #printable-mars-content blockquote,
      #printable-mars-content ul,
      #printable-mars-content ol,
      #printable-mars-content img,
      #printable-mars-content figure,
      #printable-mars-content table {
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
      const opt = {
        margin: 0.5,
        filename: `artikel-planet-mars-${article.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      };
      await html2pdf().from(element).set(opt as any).save();
    } catch (error) {
      console.error('Gagal membuat PDF artikel Mars:', error);
      alert('Gagal mengunduh PDF artikel Mars.');
    } finally {
      document.getElementById('pdf-force-black-text-mars')?.remove();
      const watermark = document.getElementById('pdf-watermark-meteorit');
      if (watermark) watermark.remove();
      const footer = document.getElementById('pdf-footer-meteorit');
      if (footer) footer.remove();
      element.style.position = '';
      if (actionsBar) {
        (actionsBar as HTMLElement).style.display = originalDisplay;
      }

      // Restore original src
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const orig = originalSrcs.get(img);
        if (orig) img.src = orig;
      }
    }
  };

  const handleDownloadShareCard = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 3,
        logging: false,
        backgroundColor: '#130704'
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `share-card-mars-${article.id}.png`;
      link.click();
    } catch (error) {
      console.error('Gagal membuat share card Mars:', error);
      alert('Gagal membuat gambar share card Mars.');
    }
  };

  const copyToClipboard = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    alert('Tautan artikel Mars berhasil disalin!');
  };

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-orange-900/30 py-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleVoiceToText}
            className={`font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${
              isListening ? 'bg-orange-500 text-slate-950 animate-pulse' : 'bg-red-700 hover:bg-red-800 text-white'
            }`}
          >
            {isListening ? 'Hentikan Voice to Text' : 'Voice to Text'}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            Save PDF
          </button>
          <button
            onClick={handleDownloadShareCard}
            className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            Share Card
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-green-600/20 hover:bg-green-600/40 text-green-400 p-2 rounded-lg text-sm transition-all">
            WA
          </a>
          <a href={shareUrls.telegram} target="_blank" rel="noopener noreferrer" className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 p-2 rounded-lg text-sm transition-all">
            TG
          </a>
          <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke Facebook">
            FB
          </a>
          <a href={shareUrls.pinterest} target="_blank" rel="noopener noreferrer" className="bg-red-600/20 hover:bg-red-600/40 text-red-400 p-2 rounded-lg text-sm transition-all flex items-center gap-1" title="Bagikan ke Pinterest">
            <FaPinterest className="w-4 h-4" /> <span>PIN</span>
          </a>
          <button onClick={copyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-gray-300 p-2 rounded-lg text-sm transition-all">
            Salin
          </button>
        </div>
      </div>

      {voiceText && (
        <div className="mb-8 rounded-2xl border border-orange-900/30 bg-slate-900/60 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-orange-300 mb-2">Catatan Voice to Text</div>
          <textarea
            value={voiceText}
            onChange={(event) => setVoiceText(event.target.value)}
            className="w-full min-h-28 rounded-xl border border-orange-900/30 bg-slate-950 p-3 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      )}

      <div style={{ position: 'fixed', top: '-9999px', left: 0, zIndex: -100, pointerEvents: 'none' }}>
        <div
          ref={cardRef}
          style={{
            width: '480px',
            minHeight: '640px',
            backgroundColor: '#130704',
            color: '#fff7ed',
            border: '1px solid rgba(251, 146, 60, 0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ height: '260px', backgroundColor: '#1c1917' }}>
            {article.image ? (
              <img src={article.image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div style={{ padding: '28px', flex: 1 }}>
            <div style={{ color: '#fdba74', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Planet Mars • Meteorit Indonesia
            </div>
            <h2 style={{ fontSize: '31px', lineHeight: 1.12, margin: 0, fontWeight: 900 }}>{article.title}</h2>
            <p style={{ color: '#fed7aa', fontSize: '15px', lineHeight: 1.55, marginTop: '18px' }}>{article.excerpt}</p>
            <div style={{ marginTop: '24px', color: '#fb923c', fontSize: '12px', fontWeight: 800 }}>
              {article.mars_data?.rover || 'NASA Rover'} • {article.date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
