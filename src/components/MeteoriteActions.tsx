"use client";

import { useEffect, useState, useRef } from 'react';
import { getSiteHost } from '@/lib/siteUrl';

interface Meteorite {
  id: string;
  name: string;
  translated_name: string;
  mass: string;
  year: string;
  recclass: string;
  lat: string;
  long: string;
  description: string;
  translated_description: string;
  image_url: string;
}

interface MeteoriteActionsProps {
  meteorite: Meteorite;
}

export default function MeteoriteActions({ meteorite }: MeteoriteActionsProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareUrls, setShareUrls] = useState({ whatsapp: '', telegram: '', facebook: '' });
  const cardRef = useRef<HTMLDivElement>(null);
  const siteHost = getSiteHost();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setShareUrls({
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Info meteorit menarik "${meteorite.name}" di Meteorit Indonesia: ${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Meteorit ${meteorite.name}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [meteorite]);

  const handleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narration = `Meteorit ${meteorite.name}. Klasifikasi ${meteorite.recclass}. Massa berat ${meteorite.mass}. Ditemukan pada tahun ${meteorite.year}. ${meteorite.translated_description}`;
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.lang = 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-meteorite-content');
    if (!element) {
      alert("Elemen konten meteorit tidak ditemukan.");
      return;
    }

    // Inject temporary style to force black text for PDF capture
    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-force-black-text';
    styleEl.innerHTML = `
      #printable-meteorite-content * {
        color: #000 !important;
        background-color: transparent !important;
        border-color: #ccc !important;
      }
      #printable-meteorite-content h1,
      #printable-meteorite-content h2,
      #printable-meteorite-content h3 {
        color: #111 !important;
      }
      #printable-meteorite-content [class*="border-cyan"],
      #printable-meteorite-content [class*="bg-slate"],
      #printable-meteorite-content [class*="bg-cyan"] {
        background-color: #f8f9fa !important;
        border-color: #dee2e6 !important;
      }
    `;
    document.head.appendChild(styleEl);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.5,
        filename: `meteorite-${meteorite.name.toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().from(element).set(opt as any).save();
    } catch (error) {
      console.error("Gagal mendownload PDF:", error);
      alert("Gagal mengunduh PDF secara langsung.");
    } finally {
      // Always remove the injected style
      const injected = document.getElementById('pdf-force-black-text');
      if (injected) injected.remove();
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
      link.download = `meteorite-card-${meteorite.id}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal mendownload card vertical:", error);
      alert("Gagal membuat gambar vertical card untuk media sosial.");
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert("Tautan meteorit berhasil disalin!");
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
            <span>{isSpeaking ? '⏹️ Diam' : '🔊 Bacakan Karakteristik'}</span>
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
          <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-2 rounded-lg text-sm transition-all">
            FB
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(6,182,212,0.3)', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>☄️</div>
              <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22d3ee' }}>Meteorit Indonesia</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)', backgroundColor: 'rgba(8,47,73,0.8)', color: '#67e8f9', textTransform: 'uppercase' }}>
              {meteorite.recclass}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(22,78,99,0.3)', marginLeft: '24px', marginRight: '24px', flexShrink: 0 }} />

          {/* Banner Image */}
          <div style={{ margin: '16px 24px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(8,47,73,0.5)', height: '200px', backgroundColor: '#0f172a', flexShrink: 0 }}>
            {meteorite.image_url ? (
              <img src={meteorite.image_url} alt={meteorite.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,47,73,0.5)' }}>
                <span style={{ fontSize: '48px', color: '#67e8f9' }}>🌌</span>
              </div>
            )}
          </div>

          {/* Content area - grows to fill available space */}
          <div style={{ padding: '16px 24px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee', display: 'block', marginBottom: '4px' }}>Katalog Astronomi</span>
              <h2 style={{ fontSize: '20px', fontWeight: 900, lineHeight: '1.3', color: '#fbbf24', margin: 0 }}>
                Meteorit {meteorite.name}
              </h2>
            </div>

            {/* Spec table */}
            <div style={{ border: '1px solid rgba(22,78,99,0.2)', borderRadius: '10px', padding: '10px 12px', backgroundColor: 'rgba(15,23,42,0.6)', flexShrink: 0 }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                    <td style={{ padding: '5px 0', color: '#94a3b8' }}>Tipe / Kelas:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>{meteorite.recclass}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                    <td style={{ padding: '5px 0', color: '#94a3b8' }}>Massa Berat:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#67e8f9' }}>{meteorite.mass}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                    <td style={{ padding: '5px 0', color: '#94a3b8' }}>Tahun Ditemukan:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#e2e8f0' }}>{meteorite.year}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#94a3b8' }}>Koordinat:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px', color: '#22d3ee' }}>{meteorite.lat}, {meteorite.long}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '11px', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
              {meteorite.translated_description}
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(22,78,99,0.3)', margin: '0 24px', padding: '12px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#94a3b8', margin: '0 0 2px' }}>Jelajahi Database</p>
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
