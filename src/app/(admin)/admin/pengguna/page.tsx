"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

type TabType = 'all' | 'premium' | 'admin';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  premiumExpiry?: string | null;
  premiumGrantedAt?: string | null;
  premiumGrantedByDonation?: number | null;
  lastLogin?: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const PREMIUM_DURATION_OPTIONS = [
  { label: '30 Hari', days: 30 },
  { label: '60 Hari', days: 60 },
  { label: '90 Hari', days: 90 },
  { label: '360 Hari', days: 360 },
  { label: 'Unlimited', days: 0 },
];

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border border-purple-300',
  premium: 'bg-amber-100 text-amber-800 border border-amber-300',
  user: 'bg-slate-100 text-slate-600 border border-slate-300',
};

const ROLE_LABEL: Record<string, string> = {
  admin: '👑 Admin',
  premium: '⭐ Premium',
  user: '👤 Pengguna',
};

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<string>('user');
  const [editPremiumDays, setEditPremiumDays] = useState<number>(30);
  const [isSaving, setIsSaving] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Debounce search input (500ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const loadUsers = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        tab: activeTab,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { 'x-admin-uid': currentUser.uid },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(data.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 1 });
      } else {
        console.error('Gagal memuat daftar pengguna.');
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentPage, activeTab, debouncedSearch]);

  useEffect(() => {
    if (currentUser) loadUsers();
  }, [loadUsers, currentUser]);

  const handleEditClick = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role || 'user');
    setEditPremiumDays(30);
  };

  const handleSaveRole = async () => {
    if (!editingUser || !currentUser) return;
    setIsSaving(true);
    try {
      const body: any = { uid: editingUser.uid, role: editRole };
      if (editRole === 'premium') body.premiumDays = editPremiumDays;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': currentUser.uid,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
        setEditingUser(null);
        loadUsers();
      } else {
        alert(`❌ Gagal: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const isPremiumActive = (expiry: string | null | undefined) => {
    if (!expiry) return false;
    return new Date(expiry) > new Date();
  };

  const formatExpiry = (expiry: string | null | undefined) => {
    if (!expiry) return '-';
    const d = new Date(expiry);
    const now = new Date();
    if (d.getFullYear() > now.getFullYear() + 50) return '∞ Unlimited';
    if (d < now) return `⚠️ Kedaluwarsa ${d.toLocaleDateString('id-ID')}`;
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} hari lagi (${d.toLocaleDateString('id-ID')})`;
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola role, status premium, dan hak akses pengguna terdaftar.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 self-start md:self-auto"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pengguna', value: pagination.totalCount, color: 'blue', icon: '👥' },
          { label: 'Premium Aktif', value: users.filter(u => u.role === 'premium' && isPremiumActive(u.premiumExpiry)).length, color: 'amber', icon: '⭐' },
          { label: 'Administrator', value: users.filter(u => u.role === 'admin').length, color: 'purple', icon: '👑' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-slate-800">{stat.icon} {stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'premium', 'admin'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white shadow text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'all' ? '👥 Semua' : tab === 'premium' ? '⭐ Premium' : '👑 Admin'}
              </button>
            ))}
          </div>

          {/* Search with debounce */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="text-3xl mb-3 animate-pulse">⏳</div>
            Memuat daftar pengguna...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="text-3xl mb-3">👤</div>
            {searchQuery ? `Tidak ada pengguna yang cocok dengan pencarian "${searchQuery}"` : 'Belum ada pengguna terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengguna</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Masa Premium</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Login Terakhir</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const active = isPremiumActive(user.premiumExpiry);
                  return (
                    <tr key={user.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base">👤</div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 leading-snug">{user.displayName || '(Tanpa Nama)'}</div>
                            <div className="text-xs text-slate-400 leading-snug">{user.email}</div>
                            <div className="text-[10px] text-slate-300 font-mono leading-snug">{user.uid.slice(0, 16)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[user.role] || ROLE_BADGE.user}`}>
                          {ROLE_LABEL[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.role === 'premium' || user.premiumExpiry ? (
                          <span className={`text-xs font-semibold ${active ? 'text-green-700' : 'text-red-500'}`}>
                            {formatExpiry(user.premiumExpiry)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                        {user.premiumGrantedByDonation && (
                          <div className="text-[10px] text-amber-500 mt-0.5">
                            💰 Via Donasi Rp {user.premiumGrantedByDonation.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          ✏️ Edit Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
                <span className="text-xs text-slate-500">
                  {pagination.totalCount} pengguna — Halaman {pagination.page}/{pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit Role Pengguna</h2>
              <p className="text-sm text-slate-500 mt-1">Ubah peran dan masa aktif premium untuk pengguna ini.</p>
            </div>

            <div className="p-6 space-y-5">
              {/* User Info */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-200 flex-shrink-0">
                  {editingUser.photoURL ? (
                    <img src={editingUser.photoURL} alt={editingUser.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{editingUser.displayName || '(Tanpa Nama)'}</div>
                  <div className="text-xs text-slate-500">{editingUser.email}</div>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="user">👤 Pengguna Biasa</option>
                  <option value="premium">⭐ Premium</option>
                  <option value="admin">👑 Administrator</option>
                </select>
              </div>

              {/* Premium duration (only show when premium selected) */}
              {editRole === 'premium' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Durasi Premium</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PREMIUM_DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setEditPremiumDays(opt.days)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          editPremiumDays === opt.days
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {editPremiumDays === 0
                      ? 'Premium tanpa batas waktu.'
                      : `Premium aktif selama ${editPremiumDays} hari dari sekarang.`}
                  </p>
                </div>
              )}

              {editRole === 'user' && editingUser.role !== 'user' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  ⚠️ Mendowngrade ke Pengguna Biasa akan menghapus status premium yang aktif.
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? '⏳ Menyimpan...' : '✅ Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
