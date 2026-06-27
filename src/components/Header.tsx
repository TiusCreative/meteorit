"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [meteorDropdownOpen, setMeteorDropdownOpen] = useState(false);
  const [monitoringDropdownOpen, setMonitoringDropdownOpen] = useState(false);

  async function saveUserProfile(currentUser: User) {
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebaseConfig');
      const userRef = doc(db, 'users', currentUser.uid);
      const existing = await getDoc(userRef);
      const currentRole = existing.exists() ? (existing.data()?.role || 'user') : 'user';
      await setDoc(userRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        lastLogin: new Date().toISOString(),
        role: currentRole,
      }, { merge: true });
    } catch (err) {
      console.error("Gagal menyimpan profil pengguna ke Firestore:", err);
    }
  }

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user);
        saveUserProfile(result.user);
      }
    }).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        saveUserProfile(currentUser);
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebaseConfig');
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data()?.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Gagal memeriksa status admin di header:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error?.code === 'auth/unauthorized-domain' ||
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-closed-by-user'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error("Login redirect error:", redirectErr);
          alert("Login Google gagal. Pastikan domain sudah ditambahkan di Firebase Console → Authentication → Authorized Domains.");
        }
      } else {
        console.error("Login error:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinks = [
    { href: '/', label: 'Beranda' },
    {
      href: '/ensiklopedia',
      label: 'Meteorit & Komet',
      dropdown: [
        { href: '/ensiklopedia', label: '🪨 Jenis Meteorit' },
        { href: '/ensiklopedia?tab=komet', label: '☄️ Pantau Komet & Asteroid' },
        { href: '/komet', label: '📰 Artikel Komet & Asteroid' },
        { href: '/mars', label: '🔴 Artikel Planet Mars' },
        { href: '/apod', label: '🌌 Galeri APOD' },
      ]
    },
    { href: '/langit-malam', label: '🌠 Langit Malam' },
    {
      href: '/monitoring',
      label: '🚀 Misi Antariksa',
      dropdown: [
        { href: '/monitoring', label: '🛰️ Pusat Kontrol Misi' },
        { href: '/monitoring-epic', label: '🌎 EPIC Live Bumi' },
        { href: '/astronot', label: '👨‍🚀 Profil Astronot' },
      ]
    },
    { href: '/blog', label: 'Blog' },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-cyan-900/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo and Brand Title */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 bg-black flex items-center justify-center">
            <img src="/logo.png" alt="Meteorit Indonesia" className="w-full h-full object-cover" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/100x100/png?text=MI";
            }} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent hidden sm:inline-block">
            Meteorit Indonesia
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            if (link.dropdown) {
              const isMeteor = link.label.includes('Meteorit');
              const isOpen = isMeteor ? meteorDropdownOpen : monitoringDropdownOpen;
              const setIsOpen = isMeteor ? setMeteorDropdownOpen : setMonitoringDropdownOpen;

              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setIsOpen(true)}
                  onMouseLeave={() => setIsOpen(false)}
                >
                  <button
                    className={`text-sm font-semibold transition-all duration-200 px-3 py-2 rounded-lg flex items-center gap-1 ${
                      active
                        ? 'text-amber-400 bg-amber-400/10'
                        : 'text-gray-300 hover:text-cyan-400 hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Panel */}
                  <div className={`absolute top-full left-0 mt-1 w-52 bg-slate-900/95 backdrop-blur-xl border border-cyan-900/40 rounded-xl shadow-2xl shadow-cyan-950/50 overflow-hidden transition-all duration-200 ${
                    isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}>
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors border-b border-slate-800/50 last:border-0"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-all duration-200 px-3 py-2 rounded-lg ${
                  active
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-gray-300 hover:text-cyan-400 hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Authentication Options */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin/dashboard" className="text-xs bg-cyan-900/50 text-cyan-300 py-1 px-3 rounded-full border border-cyan-500/30 hover:bg-cyan-950 transition-colors">
                  Dashboard
                </Link>
              )}
              <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400">
                <img src={user.photoURL || '/placeholder-user.webp'} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-gray-300 hover:text-orange-400 transition-colors"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-600 hover:to-amber-600 text-slate-950 font-bold py-2 px-5 rounded-lg transition-all text-sm"
            >
              Masuk Google
            </button>
          )}
        </div>

        {/* Mobile Hamburger toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle menu"
        >
          <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/97 backdrop-blur-xl border-b border-cyan-900/30 p-4 absolute top-16 left-0 w-full flex flex-col gap-1 z-50 shadow-2xl">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 px-4 rounded-xl text-base font-semibold flex items-center gap-2 transition-all ${
                    active ? 'bg-amber-400/10 text-amber-400' : 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
                {link.dropdown && (
                  <div className="ml-4 mt-1 mb-2 flex flex-col gap-1">
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2 px-4 rounded-lg text-sm text-gray-400 hover:text-cyan-400 hover:bg-slate-800/40 transition-colors flex items-center gap-2"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-slate-800 pt-3 mt-2 flex flex-col gap-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400">
                    <img src={user.photoURL || '/placeholder-user.webp'} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm text-gray-300">{user.displayName}</span>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs bg-cyan-600 text-white font-bold py-1 px-3 rounded"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs bg-slate-800 text-orange-400 font-bold py-1 px-3 rounded"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 font-bold py-2.5 rounded-lg text-center text-sm"
              >
                Masuk dengan Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
