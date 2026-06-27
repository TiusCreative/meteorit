"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        router.push('/');
        return;
      }
      setUser(currentUser);

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Gagal memeriksa status admin:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDbMocked, setIsDbMocked] = useState(false);

  useEffect(() => {
    async function checkDbStatus() {
      try {
        const res = await fetch(`/api/admin/status?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setIsDbMocked(data.isMocked || false);
        }
      } catch (err) {
        console.error("Gagal memeriksa status database:", err);
      }
    }
    checkDbStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Memverifikasi otorisasi admin...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <span className="text-5xl block mb-4">🚫</span>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Akses Ditolak</h1>
          <p className="text-gray-400 text-sm mb-6">
            Akun Anda ({user?.email || 'tidak terautentikasi'}) tidak memiliki hak akses administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex relative overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(prev => !prev)} user={user} />
        <main className="flex-1 p-4 md:p-6 bg-slate-50 overflow-x-hidden space-y-6">
          {isDbMocked && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-sm text-left">
              <div className="flex items-start gap-3">
                <span className="text-xl text-red-500 shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-red-800 text-sm">Mode Firestore Mock Aktif</p>
                  <p className="text-red-700 text-xs mt-1 leading-relaxed">
                    Kredensial Firebase Admin SDK tidak terdeteksi di server (Vercel). Semua perubahan data di panel admin ini 
                    (tambah/hapus admin, data donasi, sinkronisasi, dll.) <strong>tidak akan tersimpan permanen</strong> ke database. 
                    Silakan tambahkan Environment Variables berikut di dashboard Vercel Anda:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-red-700 font-mono mt-2 space-y-0.5">
                    <li>FIREBASE_ADMIN_PROJECT_ID</li>
                    <li>FIREBASE_ADMIN_CLIENT_EMAIL</li>
                    <li>FIREBASE_ADMIN_PRIVATE_KEY</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}