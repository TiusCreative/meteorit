"use client";

import { useState } from 'react';
import AdDisplay from '@/components/AdDisplay';

interface Product {
  id: string;
  name: string;
  type: string;
  weight: string;
  priceVal: number;
  seller: string;
  phone: string;
  image: string;
  description: string;
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const products: Product[] = [
    {
      id: 'prod-1',
      name: 'Campo del Cielo Iron Meteorite',
      type: 'Besi (Iron)',
      weight: '450 gram',
      priceVal: 6500000,
      seller: 'Meteorit Galeri Indo',
      phone: '6281234567890',
      image: 'https://placehold.co/600x400/020617/eab308?text=Campo+del+Cielo',
      description: 'Serpihan meteorit Campo del Cielo asli dari Chaco, Argentina. Kerak fusi yang indah, dibersihkan dengan aman dari karat.'
    },
    {
      id: 'prod-2',
      name: 'NWA 869 Chondrite Specimen',
      type: 'Batuan (Chondrite)',
      weight: '120 gram',
      priceVal: 2400000,
      seller: 'Galaksi Shop',
      phone: '6281234567890',
      image: 'https://placehold.co/600x400/020617/22d3ee?text=NWA+869',
      description: 'Spesimen meteorit kondrit NWA 869 utuh yang bertekstur kasar dengan butiran kondrul silikon internal yang terlihat jelas.'
    },
    {
      id: 'prod-3',
      name: 'Seymchan Pallasite Slice',
      type: 'Pallasite (Besi-Batuan)',
      weight: '35 gram',
      priceVal: 14500000,
      seller: 'Kolektor Langit',
      phone: '6281234567890',
      image: 'https://placehold.co/600x400/020617/a855f7?text=Seymchan+Pallasite',
      description: 'Irisan tipis meteorit Seymchan yang sangat indah. Menampilkan kristal olivin kuning keemasan transparan yang dilapisi besi logam.'
    }
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? p.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Jembatan Transaksi & Marketplace
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Pasar jual beli terpercaya untuk kolektor meteorit di Indonesia. Temukan spesimen bersertifikat langsung dari penemu dan kolektor.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/60 backdrop-blur border border-cyan-900/30 p-6 rounded-2xl mb-12 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg shadow-cyan-950/20">
          <div className="w-full md:w-1/3">
            <input 
              type="text"
              placeholder="Cari spesimen meteorit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="w-full md:w-auto flex items-center gap-3 justify-end">
            <label className="text-gray-400 text-sm font-semibold shrink-0">Kategori Tipe:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-slate-950 border border-cyan-900/40 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Semua Tipe</option>
              <option value="Besi (Iron)">Meteorit Besi (Iron)</option>
              <option value="Batuan (Chondrite)">Meteorit Batuan (Chondrite)</option>
              <option value="Pallasite (Besi-Batuan)">Pallasite (Besi-Batuan)</option>
            </select>
          </div>
        </div>

        {/* Info Banner for Escrow & Commission */}
        <div className="max-w-4xl mx-auto bg-slate-900/60 backdrop-blur border border-cyan-500/20 p-6 rounded-2xl mb-12 text-left flex items-start gap-4 shadow-lg shadow-cyan-950/20">
          <span className="text-3xl">🛡️</span>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-1">Sistem Transaksi Bersertifikat & Komisi Platform</h3>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-normal">
              Semua transaksi marketplace difasilitasi oleh **Sistem Escrow Rekening Bersama (Midtrans)** untuk keamanan 100%. Platform memotong komisi transaksi sebesar **20%** dari total nilai penjualan untuk biaya pemeliharaan server, jaminan keaslian sertifikat meteorit oleh tim ahli, dan pengembangan riset komunitas.
            </p>
          </div>
        </div>

        <AdDisplay position="hero" />

        {/* Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((prod) => {
            const basePrice = prod.priceVal;
            const platformFee = basePrice * 0.20; // 20% platform commission
            const totalPrice = basePrice + platformFee;

            return (
              <div key={prod.id} className="bg-slate-900/40 border border-cyan-950/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-cyan-900/10 hover:border-cyan-500/30 transition-all duration-300 group flex flex-col h-full text-left">
                <div className="h-48 bg-slate-950 overflow-hidden relative">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400/020617/22d3ee?text=Spesimen+Meteorit';
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {prod.type}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-4">
                    <span className="text-gray-500 text-xs font-semibold block mb-2">Berat Spesimen: {prod.weight}</span>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-950/50 space-y-1.5 text-xs text-gray-300">
                      <p className="flex justify-between">
                        <span>Harga Bersih:</span>
                        <span>Rp {basePrice.toLocaleString('id-ID')}</span>
                      </p>
                      <p className="flex justify-between text-cyan-400">
                        <span>Platform Fee & Sertifikasi (20%):</span>
                        <span>+ Rp {platformFee.toLocaleString('id-ID')}</span>
                      </p>
                      <p className="flex justify-between border-t border-cyan-950/50 pt-1.5 text-sm font-bold text-amber-400">
                        <span>Total Pembayaran:</span>
                        <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold mb-3 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    {prod.name}
                  </h2>

                  <p className="text-gray-300 text-sm mb-6 leading-relaxed flex-grow line-clamp-3">
                    {prod.description}
                  </p>

                  <div className="border-t border-cyan-950/50 pt-4 flex justify-between items-center mt-auto">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Penjual Terpercaya</span>
                      <span className="text-gray-300 text-sm font-semibold">{prod.seller}</span>
                    </div>
                    <a 
                      href={`https://wa.me/${prod.phone}?text=${encodeURIComponent(`Halo ${prod.seller}, saya tertarik dengan spesimen "${prod.name}" seharga Rp ${totalPrice.toLocaleString('id-ID')} (termasuk biaya rekber rek-ber 20%) yang diiklankan di Meteorit Indonesia.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>💬</span> Hubungi Penjual
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <AdDisplay position="footer" />
      </div>
    </main>
  );
}
