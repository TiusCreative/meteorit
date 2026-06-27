"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

type Tab = 'users' | 'admins';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role?: string;
  createdAt?: string;
}

interface AdminEntry {
  email: string;
  addedAt?: string;
  addedBy?: string;
}

export default function UserAdminManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('admins');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Admin list state
  const [adminEmails, setAdminEmails] = useState<AdminEntry[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // ── Load admin list ──────────────────────────────────────────────────────
  async function loadAdmins() {
    setIsLoadingAdmins(true);
    try {
      const res = await fetch(`/api/admin/make-admin?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Convert flat email list to AdminEntry array
        const emails: string[] = data.adminEmails || [];
        setAdminEmails(emails.map(e => ({ email: e })));
      }
    } catch (err) {
      console.error('Gagal memuat daftar admin:', err);
    } finally {
      setIsLoadingAdmins(false);
    }
  }

  // ── Load users list ──────────────────────────────────────────────────────
  async function loadUsers() {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Gagal memuat list subscriber:', err);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  // ── Tambah Admin ─────────────────────────────────────────────────────────
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    const cleanEmail = newAdminEmail.trim().toLowerCase();

    if (!confirm(`⚠️ KONFIRMASI\n\nAnda akan memberikan akses ADMIN penuh kepada:\n${cleanEmail}\n\nPemilik email ini akan dapat mengakses seluruh panel admin dan mengelola semua data.\n\nLanjutkan?`)) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          requestorEmail: currentUser?.email || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewAdminEmail('');
        await loadAdmins();
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Gagal: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan admin. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Hapus Admin ──────────────────────────────────────────────────────────
  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('❌ Anda tidak dapat menghapus akses admin Anda sendiri!');
      return;
    }
    if (!confirm(`Hapus ${emailToRemove} dari daftar admin?`)) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/make-admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToRemove,
          requestorEmail: currentUser?.email || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadAdmins();
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-3xl font-bold text-slate-800">Manajemen Pengguna</h1>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {[
            { key: 'admins', label: '🛡️ Administrator', desc: 'Kelola akses admin' },
            { key: 'users', label: '👥 Pengguna', desc: 'Daftar akun pengguna' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: ADMIN MANAGEMENT ─────────────────────────────────────────── */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-red-800 text-sm">Peringatan Keamanan</p>
              <p className="text-red-700 text-xs mt-1">
                Email yang ditambahkan di sini akan mendapatkan akses penuh ke seluruh panel admin.
                Pastikan hanya email terpercaya yang ditambahkan. Administrator dapat mengelola artikel,
                pengguna, donasi, dan semua pengaturan sistem.
              </p>
            </div>
          </div>

          {/* Add Admin Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Tambah Administrator Baru</h2>
            <p className="text-slate-500 text-xs mb-5">
              Masukkan email Google yang akan diberikan akses admin. Email ini harus sudah terdaftar dan akan bisa login via tombol &quot;Masuk Google&quot; di website.
            </p>

            <form onSubmit={handleAddAdmin} className="flex gap-3 max-w-lg">
              <input
                type="email"
                placeholder="email@gmail.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors shrink-0 disabled:opacity-50"
              >
                {isSaving ? '⏳...' : '➕ Tambah Admin'}
              </button>
            </form>
          </div>

          {/* Admin List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Daftar Administrator Aktif ({adminEmails.length})</h2>
              <button onClick={loadAdmins} className="text-xs text-blue-600 hover:underline font-semibold">
                🔄 Refresh
              </button>
            </div>

            {isLoadingAdmins ? (
              <div className="py-10 text-center text-slate-400 text-sm">Memuat daftar admin...</div>
            ) : adminEmails.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Belum ada admin terdaftar.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {adminEmails.map((admin) => (
                  <div key={admin.email} className="flex items-center justify-between p-5 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm">🛡️</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm font-mono">{admin.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {admin.email.toLowerCase() === currentUser?.email?.toLowerCase()
                            ? '🟢 Akun Anda (aktif sekarang)'
                            : 'Administrator'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      disabled={isSaving || admin.email.toLowerCase() === currentUser?.email?.toLowerCase()}
                      className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Hapus Akses
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info cara menjadi admin */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h3 className="font-bold text-blue-800 text-sm mb-2">ℹ️ Cara Menjadi Admin</h3>
            <ol className="text-blue-700 text-xs space-y-1 list-decimal list-inside">
              <li>Admin menambahkan email Anda di halaman ini</li>
              <li>Anda pergi ke website dan klik <strong>&quot;Masuk Google&quot;</strong></li>
              <li>Login dengan akun Google yang emailnya sudah ditambahkan</li>
              <li>Setelah login berhasil, link <strong>&quot;Dashboard&quot;</strong> akan muncul di header</li>
              <li>Akses <code className="bg-blue-100 px-1 rounded">/admin/dashboard</code> — Anda sudah bisa masuk!</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── TAB: USERS ────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Daftar Email Langganan ({users.length})</h2>
              <button onClick={loadUsers} className="text-xs text-blue-600 hover:underline font-semibold">
                🔄 Refresh
              </button>
            </div>

            {isLoadingUsers ? (
              <div className="py-10 text-center text-slate-400 text-sm">Memuat daftar pelanggan...</div>
            ) : users.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Belum ada email langganan terdaftar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="p-4">Email</th>
                      <th className="p-4">Tanggal Langganan</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {users.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold text-slate-800 font-mono">{sub.email}</td>
                        <td className="p-4 text-slate-500">
                          {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sub.active !== false 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sub.active !== false ? '🟢 Aktif' : '⚪ Tidak Aktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
