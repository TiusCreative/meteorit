"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Script from 'next/script';
import EarthMonitoringSimulator from './EarthMonitoringSimulator';

interface DonationTier {
  id: string;
  amount: number;
  label: string;
}

export default function DonationSection() {
  const [tiers, setTiers] = useState<DonationTier[]>([]);
  const [email, setEmail] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadTiers() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setTiers(data.settings?.donationTiers || []);
        }
      } catch (err) {
        console.error("Failed to load donation tiers:", err);
      }
    }
    loadTiers();
  }, []);

  const handleDonation = async (amount: number) => {
    if (!email) {
      alert("Silakan masukkan email Anda terlebih dahulu untuk tanda bukti donasi.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Fetch Midtrans Snap Token
      const res = await axios.post("/api/donations", {
        amount,
        email,
      });

      const { snapToken } = res.data;

      // 2. Open Midtrans Snap UI
      if ((window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: () => {
            setIsLoading(false);
            alert("Donasi berhasil! Terima kasih atas dukungan Anda.");
          },
          onPending: () => {
            setIsLoading(false);
            alert("Pembayaran tertunda, silakan selesaikan pembayaran Anda.");
          },
          onError: (error: any) => {
            setIsLoading(false);
            alert(error.message || "Pembayaran donasi gagal.");
          },
          onClose: () => {
            setIsLoading(false);
          }
        });
      } else {
        throw new Error("Midtrans Snap SDK not loaded.");
      }
    } catch (err) {
      setIsLoading(false);
      console.error(err);
      alert("Gagal memulai pembayaran donasi. Silakan coba kembali.");
    }
  };

  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
  const midtransScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <>
      <Script 
        src={midtransScriptUrl}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      <section id="donasi" className="py-16 bg-slate-950 border-t border-cyan-900/10">
      <div className="container mx-auto px-4 max-w-6xl text-center">
        
        <div className="mb-10">
          <span className="text-amber-400 text-3xl block mb-2">⭐</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Dukung Eksplorasi Sains & Komunitas
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Meteorit Indonesia adalah platform nirlaba yang didukung oleh komunitas. Donasi Anda membantu membiayai operasional hosting, API NASA, dan pengembangan riset edukasi luar angkasa.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              Langkah 1: Masukkan Alamat Email
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: nama@domain.com"
              className="w-full px-4 py-3 bg-slate-950 border border-cyan-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-sm"
              required
            />
          </div>

          <div className="text-left mb-6">
            <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
              Langkah 2: Pilih Jumlah Donasi
            </label>
            
            {/* Tiers Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    setSelectedTier(tier);
                    setCustomAmount('');
                  }}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                    selectedTier?.id === tier.id 
                      ? 'border-amber-400 bg-amber-500/10 text-amber-400' 
                      : 'border-cyan-900/30 bg-slate-950/60 text-gray-300 hover:border-cyan-500/30'
                  }`}
                >
                  {tier.label}
                  <span className="block text-xs text-gray-500 mt-0.5">Rp {tier.amount.toLocaleString()}</span>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-xs text-gray-500 font-bold">Rp</span>
              <input 
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedTier(null);
                }}
                placeholder="Masukkan jumlah donasi khusus"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-cyan-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || (!selectedTier && !customAmount)}
            onClick={() => {
              const amount = selectedTier ? selectedTier.amount : Number(customAmount);
              handleDonation(amount);
            }}
            className="w-full bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-600 hover:to-amber-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all text-sm disabled:from-slate-800 disabled:to-slate-850 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/40"
          >
            {isLoading ? '⏳ Memproses Pembayaran...' : '💝 Kirim Donasi via Midtrans'}
          </button>

        </div>

        <EarthMonitoringSimulator />
        </div>

      </div>
    </section>
  </>
);
}
