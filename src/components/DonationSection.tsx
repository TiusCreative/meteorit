"use client";

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Script from 'next/script';
import EarthMonitoringSimulator from './EarthMonitoringSimulator';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

interface DonationTier {
  id: string;
  amount: number;
  label: string;
}

const paypalTiers: DonationTier[] = [
  { id: 'pp1', amount: 5, label: '☕ Kopi Hangat' },
  { id: 'pp2', amount: 15, label: '🔭 Lensa Okuler' },
  { id: 'pp3', amount: 35, label: '🚀 Roket Mini' },
  { id: 'pp4', amount: 75, label: '🌌 Bintang Adopsi' }
];

export default function DonationSection() {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [paymentMethod, setPaymentMethod] = useState<'midtrans' | 'paypal'>('midtrans');
  const [tiers, setTiers] = useState<DonationTier[]>([]);
  const [email, setEmail] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

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

  // Reset selected amount when payment method changes
  useEffect(() => {
    setSelectedTier(null);
    setCustomAmount('');
  }, [paymentMethod]);

  const handleMidtransDonation = async (amount: number) => {
    if (!email) {
      alert(t.donationEmailAlert);
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post("/api/donations", {
        amount,
        email,
      });

      const { snapToken } = res.data;

      if ((window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: () => {
            setIsLoading(false);
            alert(t.donationSuccessAlert);
          },
          onPending: () => {
            setIsLoading(false);
            alert(t.donationPendingAlert);
          },
          onError: (error: any) => {
            setIsLoading(false);
            alert(error.message || t.donationFailAlert);
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
      alert(t.donationStartFailAlert);
    }
  };

  // PayPal Button Dynamic Render
  useEffect(() => {
    if (paymentMethod !== 'paypal') return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Reset container
    container.innerHTML = '';

    const amount = selectedTier ? selectedTier.amount : Number(customAmount);
    if (!amount || amount <= 0 || !email) return;

    if ((window as any).paypal) {
      try {
        (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: amount.toString()
                }
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            setIsLoading(true);
            try {
              const response = await axios.post('/api/donations/paypal', {
                orderId: data.orderID,
                email,
                amountUSD: amount
              });
              if (response.data.success) {
                alert(t.donationSuccessAlert);
                setEmail('');
                setCustomAmount('');
                setSelectedTier(null);
              } else {
                alert(t.donationFailAlert);
              }
            } catch (err) {
              console.error(err);
              alert(t.donationFailAlert);
            } finally {
              setIsLoading(false);
            }
          },
          onError: (err: any) => {
            console.error("PayPal Error:", err);
            alert(t.donationFailAlert);
          }
        }).render('#paypal-button-container');
      } catch (err) {
        console.error("Failed to render PayPal Buttons:", err);
      }
    }
  }, [paymentMethod, paypalLoaded, selectedTier, customAmount, email]);

  // PRODUCTION MODE: selalu gunakan Midtrans production endpoint
  const midtransScriptUrl = "https://app.midtrans.com/snap/snap.js";

  // PRODUCTION MODE: selalu gunakan PayPal Live Client ID
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_LIVE_CLIENT_ID || '';
  const paypalScriptUrl = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;

  return (
    <>
      <Script 
        src={midtransScriptUrl}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      {paymentMethod === 'paypal' && (
        <Script 
          src={paypalScriptUrl}
          strategy="afterInteractive"
          onLoad={() => setPaypalLoaded(true)}
        />
      )}
      <section id="donasi" className="py-16 bg-slate-950 border-t border-cyan-900/10">
      <div className="container mx-auto px-4 max-w-6xl text-center">
        
        <div className="mb-10">
          <span className="text-amber-400 text-3xl block mb-2">⭐</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            {t.donationTitle}
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {t.donationDescription}
          </p>
        </div>

        {/* Tab Selector Metode Pembayaran */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setPaymentMethod('midtrans')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
              paymentMethod === 'midtrans'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-900/35'
                : 'bg-slate-900 text-gray-400 border-cyan-900/30 hover:border-cyan-500/20'
            }`}
          >
            🇮🇩 Midtrans (Rupiah / Lokal)
          </button>
          <button
            onClick={() => setPaymentMethod('paypal')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
              paymentMethod === 'paypal'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-900/35'
                : 'bg-slate-900 text-gray-400 border-cyan-900/30 hover:border-cyan-500/20'
            }`}
          >
            🇺🇸 PayPal (USD / Internasional)
          </button>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              {t.donationStepEmail}
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
              {t.donationStepAmount} ({paymentMethod === 'midtrans' ? 'IDR' : 'USD'})
            </label>
            
            {/* Tiers Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {paymentMethod === 'midtrans' ? (
                tiers.map((tier) => (
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
                ))
              ) : (
                paypalTiers.map((tier) => (
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
                    <span className="block text-xs text-gray-500 mt-0.5">${tier.amount} USD</span>
                  </button>
                ))
              )}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-xs text-gray-500 font-bold">
                {paymentMethod === 'midtrans' ? 'Rp' : '$'}
              </span>
              <input 
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedTier(null);
                }}
                placeholder={paymentMethod === 'midtrans' ? t.donationCustom : 'Masukkan jumlah donasi (USD)'}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-cyan-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-sm"
              />
            </div>
          </div>

          {paymentMethod === 'midtrans' ? (
            <button
              type="button"
              disabled={isLoading || (!selectedTier && !customAmount)}
              onClick={() => {
                const amount = selectedTier ? selectedTier.amount : Number(customAmount);
                handleMidtransDonation(amount);
              }}
              className="w-full bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-600 hover:to-amber-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all text-sm disabled:from-slate-800 disabled:to-slate-850 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/40"
            >
              {isLoading ? `⏳ ${t.donationProcessing}` : `💝 ${t.donationButton}`}
            </button>
          ) : (
            <div className="mt-4">
              {(!email || (!selectedTier && !customAmount)) ? (
                <div className="text-center py-4 bg-slate-950/50 border border-dashed border-cyan-900/40 rounded-2xl text-xs text-gray-400">
                  📬 Silakan masukkan email dan pilih jumlah donasi untuk memunculkan tombol PayPal Smart Buttons.
                </div>
              ) : (
                <div id="paypal-button-container" className="relative z-10 w-full min-h-[45px]" />
              )}
            </div>
          )}

        </div>

        <EarthMonitoringSimulator />
        </div>

      </div>
      {/* Catatan: Script Midtrans utama di atas sudah di-load oleh Script tag pertama */}
    </section>
  </>
);
}
