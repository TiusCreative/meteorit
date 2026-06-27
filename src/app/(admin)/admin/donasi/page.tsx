"use client";

import { useEffect, useState } from 'react';

interface DonationTier {
  id: string;
  amount: number;
  label: string;
}

interface DonationRecord {
  id: string;
  orderId: string;
  amount: number;
  email: string;
  status: 'Pending' | 'Completed' | 'Failed';
  method: string;
  date: string;
}

export default function DonasiManagement() {
  const [donationTiers, setDonationTiers] = useState<DonationTier[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New tier form states
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  async function loadData() {
    setIsLoading(true);
    try {
      // 1. Fetch settings (for donation tiers)
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setDonationTiers(settingsData.settings?.donationTiers || []);
      }

      // 2. Fetch donations history
      const donationsRes = await fetch('/api/donations');
      if (donationsRes.ok) {
        const donationsData = await donationsRes.json();
        setDonations(donationsData.donations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateTiers = async (updatedTiers: DonationTier[]) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationTiers: updatedTiers })
      });
      if (res.ok) {
        setDonationTiers(updatedTiers);
        alert('Opsi donasi berhasil diperbarui di database!');
      } else {
        alert('Gagal memperbarui opsi donasi.');
      }
    } catch (err) {
      console.error(err);
      alert('Error memperbarui opsi donasi.');
    }
  };

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAmount) return;

    const amountNum = Number(newAmount);
    if (isNaN(amountNum) || amountNum <= 0) return alert('Jumlah donasi harus valid');

    const updated = [
      ...donationTiers,
      { id: `tier-${Date.now()}`, amount: amountNum, label: newLabel }
    ];

    setNewLabel('');
    setNewAmount('');
    handleUpdateTiers(updated);
  };

  const handleDeleteTier = (id: string) => {
    const updated = donationTiers.filter(t => t.id !== id);
    handleUpdateTiers(updated);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Manajemen Donasi & Tiers</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Manage Tiers Option Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Edit Pilihan Donasi</h2>
            
            {/* List active tiers */}
            <div className="space-y-3 mb-6">
              {donationTiers.map((tier) => (
                <div key={tier.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{tier.label}</p>
                    <p className="text-xs text-cyan-600 font-bold">Rp {tier.amount.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteTier(tier.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-xs"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom tier form */}
            <form onSubmit={handleAddTier} className="space-y-4 border-t border-slate-150 pt-4">
              <h3 className="text-sm font-bold text-slate-700">Tambah Opsi Baru</h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nama Label</label>
                <input 
                  type="text" 
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Contoh: Donasi Pendidikan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Jumlah Donasi (Rupiah)</label>
                <input 
                  type="number" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-800"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors">
                Tambah Opsi Donasi
              </button>
            </form>
          </div>
        </div>

        {/* History table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Riwayat Pembayaran Midtrans</h2>
              <button 
                onClick={loadData}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                🔄 Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-500">Memuat transaksi...</div>
            ) : donations.length === 0 ? (
              <div className="py-12 text-center text-slate-500">Belum ada transaksi donasi yang tercatat.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Donatur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 text-sm">
                    {donations.map((don) => (
                      <tr key={don.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                          {don.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                          {don.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-cyan-600 font-bold">
                          Rp {don.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            don.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            don.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {don.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(don.date).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}