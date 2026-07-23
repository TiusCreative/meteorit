"use client";

import { useEffect, useState, useRef } from 'react';
import { FaPinterest } from 'react-icons/fa';
import { getSiteHost } from '@/lib/siteUrl';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { useUserRole } from '@/lib/useUserRole';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
  image: string;
}

interface ArticleActionsProps {
  post: BlogPost;
}

const speechLangMap: Record<string, string> = {
  id: 'id-ID',
  en: 'en-US',
  ms: 'ms-MY',
  zh: 'zh-CN',
  ja: 'ja-JP',
};

export default function ArticleActions({ post }: ArticleActionsProps) {
  const language = useSiteLanguage();
  const { isPremiumOrAdmin } = useUserRole();
  const t = landingText[language];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareUrls, setShareUrls] = useState({ whatsapp: '', telegram: '', facebook: '', pinterest: '' });
  const cardRef = useRef<HTMLDivElement>(null);
  const siteHost = getSiteHost();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const pinterestApiKey = process.env.NEXT_PUBLIC_PINTEREST_API_KEY || '916a7781bd006d5cea3ac39c5087513e3ae89adc';
      setShareUrls({
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Baca artikel astronomi menarik "${post.title}" di Meteorit Indonesia: ${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(post.image || '')}&description=${encodeURIComponent(post.title)}&app_id=${pinterestApiKey}`
      });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [post]);

  const handleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = post.content
      .replace(/[#*`_]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '');

    const utterance = new SpeechSynthesisUtterance(`${post.title}. ${cleanText}`);
    utterance.lang = speechLangMap[language] || 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-article-content');
    if (!element) {
      alert("Elemen konten artikel tidak ditemukan.");
      return;
    }

    // Inject temporary style to force black text for PDF capture and avoid split layouts
    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-force-black-text';
    styleEl.innerHTML = `
      #printable-article-content {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      #printable-article-content * {
        color: #000 !important;
        background-color: transparent !important;
        border-color: #ccc !important;
      }
      #printable-article-content h1,
      #printable-article-content h2,
      #printable-article-content h3 {
        color: #111 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #printable-article-content p,
      #printable-article-content blockquote,
      #printable-article-content ul,
      #printable-article-content ol,
      #printable-article-content img,
      #printable-article-content figure,
      #printable-article-content table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    document.head.appendChild(styleEl);

    // === INJECT PROFESSIONAL TILED WATERMARK ===
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
        filename: `${post.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      };
      await html2pdf().from(element).set(opt as any).save();
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("Gagal mengunduh PDF secara langsung.");
    } finally {
      const injected = document.getElementById('pdf-force-black-text');
      if (injected) injected.remove();
      const watermark = document.getElementById('pdf-watermark-meteorit');
      if (watermark) watermark.remove();
      const footer = document.getElementById('pdf-footer-meteorit');
      if (footer) footer.remove();
      element.style.position = '';

      // Restore original image srcs
      Array.from(images).forEach((img) => {
        const orig = originalSrcs.get(img);
        if (orig) img.src = orig;
      });
    }
  };

  const handleDownloadShareCard = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 3, // High-quality resolution
        logging: false,
        backgroundColor: '#020617'
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `share-card-${post.id}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal mendownload card vertical:", error);
      alert("Gagal membuat gambar vertical card untuk media sosial.");
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert(t.linkCopied || "Tautan artikel berhasil disalin!");
    }
  };

  return (
    <div>
      {/* Actions Tray */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-cyan-900/30 py-4 mb-8 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleTTS}
            className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${
              isSpeaking 
                ? 'bg-orange-500 text-slate-950 animate-pulse' 
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            <span>{isSpeaking ? t.ttsStop : t.ttsPlay}</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1"
          >
            {t.downloadPdf}
          </button>
          <button 
            onClick={handleDownloadShareCard}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1"
          >
            {t.downloadShareCard} (Vertical)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs font-semibold mr-1">{t.shareLabel}</span>
          <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-green-600/20 hover:bg-green-600/40 text-green-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke WhatsApp">
            🟢 WA
          </a>
          <a href={shareUrls.telegram} target="_blank" rel="noopener noreferrer" className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke Telegram">
            🔵 TG
          </a>
          <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke Facebook">
            📘 FB
          </a>
          <a href={shareUrls.pinterest} target="_blank" rel="noopener noreferrer" className="bg-red-600/20 hover:bg-red-600/40 text-red-400 p-2 rounded-lg text-sm transition-all flex items-center gap-1" title="Bagikan ke Pinterest">
            <FaPinterest className="w-4 h-4" /> <span>PIN</span>
          </a>
          <button onClick={copyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-gray-300 p-2 rounded-lg text-sm transition-all" title="Salin Tautan">
            {t.copyLink}
          </button>
        </div>
      </div>

      {/* HIDDEN VERTICAL CARD FOR SOCIAL MEDIA DOWNLOAD */}
      <div style={{ position: 'fixed', top: '-9999px', left: '0', zIndex: -100, pointerEvents: 'none' }} className="print:hidden">
        <div 
          ref={cardRef}
          style={{
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            backgroundImage: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.15), transparent), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.1), transparent)',
            backgroundColor: '#020617',
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: '4px', background: 'linear-gradient(to right, #22d3ee, #f59e0b, #f97316)', flexShrink: 0 }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(245,158,11,0.3)', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🌠</div>
              <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22d3ee' }}>Meteorit Indonesia</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)', backgroundColor: 'rgba(8,47,73,0.8)', color: '#67e8f9', textTransform: 'uppercase' }}>
              {post.category}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(22,78,99,0.3)', marginLeft: '24px', marginRight: '24px', flexShrink: 0 }} />

          {/* Banner Image */}
          <div style={{ margin: '16px 24px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(8,47,73,0.5)', height: '200px', backgroundColor: '#0f172a', flexShrink: 0 }}>
            {post.image ? (
              <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,47,73,0.5)' }}>
                <span style={{ fontSize: '48px', color: '#67e8f9' }}>🌌</span>
              </div>
            )}
          </div>

          {/* Content area - grows to fill available space */}
          <div style={{ padding: '16px 24px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>📅 TERBIT: {post.date}</span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, lineHeight: '1.3', color: '#fbbf24', margin: 0 }}>
              {post.title}
            </h2>
            <p style={{ fontSize: '12px', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
              {post.excerpt}
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(22,78,99,0.3)', margin: '0 24px', padding: '12px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#94a3b8', margin: '0 0 2px' }}>{t.visitWebsite || "Kunjungi Situs Kami"}</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#22d3ee', margin: 0 }}>{siteHost}</p>
            </div>
            <div style={{ width: '44px', height: '44px', backgroundColor: 'white', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '36px', height: '36px', border: '2px solid #0f172a', display: 'flex', flexWrap: 'wrap', padding: '2px', gap: '2px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#0f172a' }}></div>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'transparent' }}></div>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#0f172a' }}></div>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#0f172a' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
