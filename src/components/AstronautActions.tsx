"use client";

import { useEffect, useState, useRef } from 'react';
import { getSiteHost } from '@/lib/siteUrl';

interface Astronaut {
  id: string;
  name: string;
  craft: string;
  country: string;
  agency: string;
  role: string;
  launchDate: string;
  biography: string;
  imageUrl: string;
}

interface AstronautActionsProps {
  astronaut: Astronaut;
}

export default function AstronautActions({ astronaut }: AstronautActionsProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareUrls, setShareUrls] = useState({ whatsapp: '', telegram: '', facebook: '' });
  const cardRef = useRef<HTMLDivElement>(null);
  const siteHost = getSiteHost();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setShareUrls({
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Kenali astronot "${astronaut.name}" (${astronaut.role} asal ${astronaut.country} di ${astronaut.craft}) di Meteorit Indonesia: ${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Profil Astronot: ${astronaut.name}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [astronaut]);

  const handleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Astronot ${astronaut.name}. Jabatan sebagai ${astronaut.role} dari agensi ${astronaut.agency} negara ${astronaut.country}. Misi saat ini di ${astronaut.craft}. Biografi: ${astronaut.biography}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-astronaut-content');
    if (!element) {
      alert("Elemen profil astronot tidak ditemukan.");
      return;
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-force-black-text-astro';
    styleEl.innerHTML = `
      #printable-astronaut-content * {
        color: #000 !important;
        background-color: transparent !important;
        border-color: #ccc !important;
      }
      #printable-astronaut-content h1,
      #printable-astronaut-content h2,
      #printable-astronaut-content h3 {
        color: #111 !important;
      }
    `;
    document.head.appendChild(styleEl);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.5,
        filename: `profil-astronot-${astronaut.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().from(element).set(opt as any).save();
    } catch (error) {
      console.error("Gagal membuat PDF astronot:", error);
      alert("Gagal mengunduh PDF profil astronot.");
    } finally {
      const injected = document.getElementById('pdf-force-black-text-astro');
      if (injected) injected.remove();
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
        backgroundColor: '#020617'
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `share-card-astronot-${astronaut.id}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal mendownload card astronot:", error);
      alert("Gagal membuat gambar share card astronot.");
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert("Tautan profil astronot berhasil disalin!");
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
            <span>{isSpeaking ? '⏹️ Hentikan Suara' : '🔊 Putar Suara AI'}</span>
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
            <span>📸</span> Download Share Card
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs font-semibold mr-1">BAGIKAN:</span>
          <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-green-600/20 hover:bg-green-600/40 text-green-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke WhatsApp">
            🟢 WA
          </a>
          <a href={shareUrls.telegram} target="_blank" rel="noopener noreferrer" className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke Telegram">
            🔵 TG
          </a>
          <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-2 rounded-lg text-sm transition-all" title="Bagikan ke Facebook">
            📘 FB
          </a>
          <button onClick={copyToClipboard} className="bg-slate-800 hover:bg-slate-700 text-gray-300 p-2 rounded-lg text-sm transition-all" title="Salin Tautan">
            🔗 Salin
          </button>
        </div>
      </div>

      {/* HIDDEN SHARE CARD */}
      <div style={{ position: 'fixed', top: '-9999px', left: '0', zIndex: -100, pointerEvents: 'none' }} className="print:hidden">
        <div 
          ref={cardRef}
          style={{
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            backgroundImage: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent), radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.1), transparent)',
            backgroundColor: '#020617',
          }}
        >
          <div style={{ height: '4px', background: 'linear-gradient(to right, #a855f7, #22d3ee, #e9d5ff)', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px 12px', flexShrink: 0, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>👨‍🚀</span>
              <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7' }}>Profil Astronot</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(168,85,247,0.3)', backgroundColor: 'rgba(88,28,135,0.8)', color: '#d8b4fe', textTransform: 'uppercase' }}>
              {astronaut.craft}
            </span>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(88,28,135,0.2)', marginLeft: '24px', marginRight: '24px', flexShrink: 0 }} />

          <div style={{ margin: '16px 24px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(88,28,135,0.3)', height: '220px', backgroundColor: '#0f172a', flexShrink: 0, position: 'relative' }}>
            {astronaut.imageUrl ? (
              <img src={astronaut.imageUrl} alt={astronaut.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px' }}>👨‍🚀</span>
              </div>
            )}
          </div>

          <div style={{ padding: '16px 24px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#f3e8ff', margin: 0 }}>
              {astronaut.name}
            </h2>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', margin: 0 }}>
              {astronaut.role} • {astronaut.agency} ({astronaut.country})
            </p>
            <p style={{ fontSize: '11px', lineHeight: '1.6', color: '#cbd5e1', margin: '4px 0 0' }}>
              {astronaut.biography.substring(0, 160)}...
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(88,28,135,0.2)', margin: '0 24px', padding: '12px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#94a3b8', margin: '0 0 2px' }}>Kunjungi Situs Kami</p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', margin: 0 }}>{siteHost}</p>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid #0f172a', display: 'flex', flexWrap: 'wrap', padding: '2px', gap: '2px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#0f172a' }}></div>
                <div style={{ width: '10px', height: '10px', backgroundColor: 'transparent' }}></div>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#0f172a' }}></div>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#0f172a' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
