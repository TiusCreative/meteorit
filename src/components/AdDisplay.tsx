"use client";

import { useEffect, useState } from 'react';

type AdDisplayProps = {
  position: 'hero' | 'content' | 'footer' | string;
};

export default function AdDisplay({ position }: AdDisplayProps) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Failed to load ad settings', err);
      }
    }
    loadSettings();
  }, []);

  if (!settings) return null;

  const { adsenseActive, adsensePositions, manualAds } = settings;

  // Gunakan env variable untuk client ID dan slot ID AdSense
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || settings.adsenseClientId || 'ca-pub-9511274459054303';
  const adsenseSlotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || settings.adsenseSlotId || '2773589292';

  // AdSense diaktifkan jika active dan sudah dikonfigurasi
  const adsenseEnabled = adsenseActive && adsenseClientId && adsenseSlotId;
  if (adsenseEnabled && adsensePositions?.includes(position)) {
    return (
      <div className="my-8 flex justify-center items-center w-full overflow-hidden min-h-[90px] bg-slate-900/40 border border-cyan-950/30 rounded-lg p-2">
        <div className="text-center w-full">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Pariwara Google</span>
          <ins
            className="adsbygoogle"
            style={{ display: 'block', textCombineUpright: 'all' }}
            data-ad-client={adsenseClientId}
            data-ad-slot={adsenseSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  // 2. Manual Advertisements (fallback or specific) - Hide if placeholder-ad or not configured
  const matchedManualAd = manualAds?.find((ad: any) => 
    ad.position === position && 
    ad.imageUrl && 
    ad.imageUrl !== '/placeholder-ad.webp' && 
    !ad.imageUrl.includes('placeholder-ad')
  );
  if (matchedManualAd) {
    return (
      <div className="my-8 flex justify-center items-center w-full overflow-hidden rounded-lg border border-cyan-900/20 bg-slate-950/60 p-4 transition-all hover:border-cyan-500/30">
        <a 
          href={matchedManualAd.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="relative block w-full text-center group"
        >
          <span className="absolute top-1 right-2 text-[9px] bg-slate-900/80 text-cyan-400 font-bold px-2 py-0.5 rounded uppercase z-10">Promosi Sponsor</span>
          <img 
            src={matchedManualAd.imageUrl} 
            alt="Iklan Sponsor" 
            className="mx-auto rounded max-h-[150px] object-cover transition-opacity duration-300 group-hover:opacity-90"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/728x90/020617/22d3ee?text=Iklan+Mitra+Lokal";
            }}
          />
        </a>
      </div>
    );
  }

  // Hide slot if nothing is active
  return null;
}
