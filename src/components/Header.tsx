"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { dictionary, defaultLanguage, isSiteLanguage, languageOptions, LANGUAGE_COOKIE_KEY, LANGUAGE_STORAGE_KEY, SiteLanguage } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import SmartSearch from './SmartSearch';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [meteorDropdownOpen, setMeteorDropdownOpen] = useState(false);
  const [monitoringDropdownOpen, setMonitoringDropdownOpen] = useState(false);
  const [disasterDropdownOpen, setDisasterDropdownOpen] = useState(false);
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage);
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState<Record<string, boolean>>({});
  const t = dictionary[language];

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const toggleMobileDropdown = (key: string) => {
    setMobileDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    try {
      const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
      if (isSiteLanguage(storedLanguage)) {
        setLanguage(storedLanguage);
        return;
      }

      const cookieLocale = typeof document !== 'undefined'
        ? document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
            ?.split('=')[1]
        : null;
      if (isSiteLanguage(cookieLocale || null)) {
        setLanguage(cookieLocale as SiteLanguage);
      }
    } catch (err) {
      console.warn('Gagal membaca storage di Header:', err);
    }
  }, []);

  const handleLanguageChange = (nextLanguage: SiteLanguage) => {
    setLanguage(nextLanguage);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      }
      if (typeof document !== 'undefined') {
        document.cookie = `${LANGUAGE_COOKIE_KEY}=${nextLanguage}; max-age=31536000; path=/; samesite=lax`;
      }
    } catch (err) {
      console.warn('Gagal menyimpan storage di Header:', err);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meteorit-language-change', { detail: nextLanguage }));
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLanguage;
    }
  };

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
    { href: '/', label: t.navHome },
    {
      href: '/ensiklopedia',
      label: t.navMeteor,
      dropdown: [
        { href: '/ensiklopedia', label: t.navMeteorTypes },
        { href: '/ensiklopedia?tab=komet', label: t.navCometTracker },
        { href: '/komet', label: t.navCometArticles },
        { href: '/mars', label: t.navMarsArticles },
        { href: '/fireball', label: (t as any).navFireballArticles },
        { href: '/eonet', label: (t as any).navEonetArticles },
        { href: '/apod', label: t.navApod },
      ]
    },
    { href: '/langit-malam', label: t.navNightSky },
    { href: '/glossarium', label: t.navGlossary },
    {
      href: '/kebencanaan',
      label: (t as any).navDisaster || 'Kebencanaan',
      dropdown: [
        { href: '/kebencanaan?tab=quake', label: (t as any).navQuake || 'Gempa Bumi' },
        { href: '/kebencanaan?tab=hotspots', label: (t as any).navHotspots || 'Titik Api' },
        { href: '/kebencanaan?tab=rain', label: (t as any).navRain || 'Curah Hujan' },
        { href: '/kebencanaan?tab=volcano', label: (t as any).navVolcano || 'Gunung Api' },
        { href: '/kebencanaan?tab=enso', label: (t as any).navEnso || 'Iklim La Niña / ENSO' },
        { href: '/kebencanaan?tab=data-center', label: (t as any).navDataCenter || '🗄️ Pusat Data & Arsip' },
      ]
    },
    {
      href: '/monitoring',
      label: t.navMission,
      dropdown: [
        { href: '/monitoring', label: t.navMissionControl },
        { href: '/monitoring-epic', label: t.navEpic },
        { href: '/astronot', label: t.navAstronaut },
      ]
    },
    { href: '/blog', label: t.navBlog },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-[100] backdrop-blur-md bg-white/95 dark:bg-slate-950/90 border-b border-slate-200 dark:border-cyan-900/30 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo and Brand Title */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-10 flex items-center justify-center bg-slate-900/10 dark:bg-white/5 rounded-lg px-2 border border-slate-200 dark:border-slate-800/40">
            <img src="/logo.png" alt="Meteorit Indonesia" className="h-8 w-auto object-contain" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/100x100/png?text=MI";
            }} />
          </div>
          <span className="text-lg sm:text-xl font-bold text-white drop-shadow-sm inline-block">
            Meteorit Indonesia
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            if (link.dropdown) {
              const isOpen = link.href === '/ensiklopedia'
                ? meteorDropdownOpen
                : link.href === '/monitoring'
                  ? monitoringDropdownOpen
                  : disasterDropdownOpen;
              const setIsOpen = link.href === '/ensiklopedia'
                ? setMeteorDropdownOpen
                : link.href === '/monitoring'
                  ? setMonitoringDropdownOpen
                  : setDisasterDropdownOpen;

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
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10'
                        : 'text-slate-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Panel */}
                  <div className={`absolute top-full left-0 mt-1 w-52 bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-cyan-900/40 rounded-xl shadow-2xl shadow-slate-100 dark:shadow-cyan-950/50 overflow-hidden transition-all duration-200 ${
                    isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}>
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
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
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10'
                    : 'text-slate-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
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
                  {t.dashboard}
                </Link>
              )}
              <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400">
                <img src={user.photoURL || '/placeholder-user.webp'} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-gray-300 hover:text-orange-400 transition-colors"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-600 hover:to-amber-600 text-slate-950 font-bold py-2 px-5 rounded-lg transition-all text-sm"
            >
              {t.login}
            </button>
          )}

          <SmartSearch />

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg border border-cyan-500/30 flex items-center justify-center text-gray-300 hover:text-amber-400 hover:bg-slate-850 transition-all focus:outline-none"
            title="Ubah Tema"
            aria-label="Toggle theme"
          >
            {themeMounted && theme === 'light' ? (
              // Icon Bulan
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              // Icon Matahari
              <svg className="w-5 h-5 text-amber-400 animate-[spin_20s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>

          <label className="sr-only" htmlFor="site-language">
            {t.language}
          </label>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/30 rounded-lg px-2.5 py-2 mr-3 sm:mr-4">
            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20M2 12h20" />
            </svg>
            <select
              id="site-language"
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value as SiteLanguage)}
              className="bg-transparent text-cyan-100 text-xs font-bold focus:outline-none cursor-pointer pr-1"
              aria-label={t.language}
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code} className="bg-slate-900 text-white">
                  {option.shortLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Actions (Search & Hamburger) */}
        <div className="flex lg:hidden items-center gap-2">
          <SmartSearch />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-cyan-900/30 p-4 absolute top-16 left-0 w-full flex flex-col gap-1 z-[110] shadow-2xl transition-colors duration-300">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const hasDropdown = !!link.dropdown;
            const isOpen = mobileDropdowns[link.href] || false;

            return (
              <div key={link.href} className="border-b border-slate-100 dark:border-slate-900 last:border-0 pb-1">
                {hasDropdown ? (
                  <button
                    onClick={() => toggleMobileDropdown(link.href)}
                    className={`w-full py-2.5 px-4 rounded-xl text-base font-semibold flex items-center justify-between transition-all ${
                      active ? 'bg-amber-500/5 dark:bg-amber-400/5 text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{link.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-250 ${isOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2.5 px-4 rounded-xl text-base font-semibold flex items-center gap-2 transition-all ${
                      active ? 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                )}

                {hasDropdown && isOpen && (
                  <div className="ml-4 mt-1 mb-2 pl-2 border-l border-slate-200 dark:border-cyan-900/30 flex flex-col gap-1">
                    {link.dropdown!.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2 px-4 rounded-lg text-sm text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-2"
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
                      {t.dashboard}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs bg-slate-800 text-orange-400 font-bold py-1 px-3 rounded"
                  >
                    {t.logout}
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
                {t.loginMobile}
              </button>
            )}
            <div className="grid grid-cols-5 gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleLanguageChange(option.code)}
                  className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                    language === option.code
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {option.shortLabel}
                </button>
              ))}
            </div>

            {/* Mobile Theme Switcher */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-850 rounded-xl p-3 mt-2">
              <span className="text-xs font-bold text-gray-400">Mode Tampilan</span>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-bold text-cyan-400 hover:bg-slate-800 transition-all focus:outline-none"
              >
                {themeMounted && theme === 'light' ? '🌙 Gelap' : '☀️ Terang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
