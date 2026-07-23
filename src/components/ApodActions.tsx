"use client";

import { useEffect, useState, useRef } from 'react';
import { FaPinterest } from 'react-icons/fa';
import { getSiteHost } from '@/lib/siteUrl';
import { useUserRole } from '@/lib/useUserRole';

interface Apod {
  id: string;
  title: {
    en: string;
    id: string;
  };
  explanation: {
    en: string;
    id: string;
  };
  image_url: string;
  copyright: string;
}

interface ApodActionsProps {
  apod: Apod;
}

function formatDateIndo(dateStr: string) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
  } catch (e) {}
  return dateStr;
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('player.vimeo.com');
};

const getThumbnailUrl = (url: string) => {
  if (!url) return 'https://placehold.co/600x400/020617/22d3ee?text=APOD+Space';
  if (isVideoUrl(url)) {
    const ytId = getYoutubeId(url);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }
    return 'https://placehold.co/600x400/020617/eab308?text=Video+Astronomi';
  }
  return url;
};

export default function ApodActions({ apod }: ApodActionsProps) {
  const { isPremiumOrAdmin } = useUserRole();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareUrls, setShareUrls] = useState({ whatsapp: '', telegram: '', facebook: '', pinterest: '' });
  const cardRef = useRef<HTMLDivElement>(null);
  const apodDisplayUrl = `${getSiteHost()}/apod`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const titleText = apod.title?.id || apod.title?.en || 'Foto Antariksa';
      const pinterestApiKey = process.env.NEXT_PUBLIC_PINTEREST_API_KEY || '916a7781bd006d5cea3ac39c5087513e3ae89adc';
      setShareUrls({
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Foto antariksa menarik "${titleText}" di Meteorit Indonesia: ${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Foto Antariksa NASA APOD: ${titleText}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(apod.image_url || '')}&description=${encodeURIComponent(titleText)}&app_id=${pinterestApiKey}`
      });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [apod]);

  const handleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const titleText = apod.title?.id || apod.title?.en || '';
    const explanationText = apod.explanation?.id || apod.explanation?.en || '';
    const dateFormatted = formatDateIndo(apod.id);
    const copyrightText = apod.copyright || 'NASA Public Domain';

    const narration = `Foto Astronomi Hari Ini: ${titleText}. Tanggal ${dateFormatted}. Hak cipta: ${copyrightText}. Penjelasan: ${explanationText}`;
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.lang = 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-apod-content');
    if (!element) {
      alert("Elemen konten APOD tidak ditemukan.");
      return;
    }

    // Inject temporary style to force black text for PDF capture and prevent elements from breaking across pages
    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-force-black-text';
    styleEl.innerHTML = `
      #printable-apod-content {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      #printable-apod-content * {
        color: #000 !important;
        background-color: transparent !important;
        border-color: #ccc !important;
      }
      #printable-apod-content h1,
      #printable-apod-content h2,
      #printable-apod-content h3 {
        color: #111 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      #printable-apod-content [class*="bg-slate"],
      #printable-apod-content [class*="bg-cyan"] {
        background-color: #f8f9fa !important;
      }
      #printable-apod-content p,
      #printable-apod-content blockquote,
      #printable-apod-content ul,
      #printable-apod-content ol,
      #printable-apod-content img,
      #printable-apod-content figure,
      #printable-apod-content table {
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
    const copyrightText = apod.copyright ? `Foto: © ${apod.copyright}` : 'Foto: NASA Public Domain';
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
      <p style="font-size: 10px; color: #555; margin: 0 0 4px; font-style: italic;">
        ${copyrightText}
      </p>
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
        filename: `apod-${apod.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      };
      await html2pdf().from(element).set(opt as any).save();
    } catch (error) {
      console.error("Gagal mendownload PDF:", error);
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
        scale: 3, // High-quality resolution
        logging: false,
        backgroundColor: '#020617'
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `apod-card-${apod.id}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal mendownload card vertical:", error);
      alert("Gagal membuat gambar vertical card untuk media sosial.");
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert("Tautan APOD berhasil disalin!");
    }
  };

  const title = apod.title?.id || apod.title?.en || 'Foto Antariksa';
  const explanation = apod.explanation?.id || apod.explanation?.en || '';

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
            <span>{isSpeaking ? '⏹️ Diam' : '🔊 Bacakan Penjelasan'}</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1"
          >
            <span>📥</span> Download PDF
          </button>
          <button 
            onClick={handleDownloadShareCard}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1"
          >
            <span>📸</span> Download Share Card (Vertical)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs font-semibold mr-1">BAGIKAN:</span>
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
            Copy
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(6,182,212,0.3)', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🌌</div>
              <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22d3ee' }}>Meteorit Indonesia</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)', backgroundColor: 'rgba(8,47,73,0.8)', color: '#67e8f9', textTransform: 'uppercase' }}>
              NASA APOD
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(22,78,99,0.3)', marginLeft: '24px', marginRight: '24px', flexShrink: 0 }} />

          {/* Banner Image */}
          <div style={{ margin: '16px 24px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(8,47,73,0.5)', height: '200px', backgroundColor: '#0f172a', flexShrink: 0 }}>
            <img 
              src={getThumbnailUrl(apod.image_url)} 
              alt={title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/600x400/020617/22d3ee?text=NASA+APOD';
              }}
            />
          </div>

          {/* Content area - grows to fill available space */}
          <div style={{ padding: '16px 24px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee' }}>Foto Antariksa Harian</span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, lineHeight: '1.3', color: '#fbbf24', margin: 0 }}>
              {title}
            </h2>

            {/* Spec table */}
            <div style={{ border: '1px solid rgba(22,78,99,0.2)', borderRadius: '10px', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)', flexShrink: 0 }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                    <td style={{ padding: '5px 0', color: '#94a3b8' }}>Tanggal Rilis:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#67e8f9' }}>{formatDateIndo(apod.id)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#94a3b8' }}>Hak Cipta:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#e2e8f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apod.copyright || 'NASA Public Domain'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '11px', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
              {explanation}
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(22,78,99,0.3)', margin: '0 24px', padding: '12px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#94a3b8', margin: '0 0 2px' }}>Arsip Astronomi</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#22d3ee', margin: 0 }}>{apodDisplayUrl}</p>
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
