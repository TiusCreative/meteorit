"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export default function CommunityFeature() {
  const [user, setUser] = useState<User | null>(null);
  const language = useSiteLanguage();
  const t = landingText[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-slate-950 via-blue-950/10 to-slate-950 border-t border-cyan-900/10 community-bg-gradient">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          <div className="lg:w-1/2 text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-amber-400">
              {t.communityTitle}
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {t.communityP1}
            </p>
            <p className="text-gray-300 mb-8 leading-relaxed">
              {t.communityP2}
            </p>
            <Link 
              href="/forum"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-cyan-950/50 inline-flex items-center gap-2"
            >
              <span>🔍</span> {t.askForum}
            </Link>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-slate-900/40 backdrop-blur border border-cyan-950/30 rounded-3xl p-8 shadow-2xl">
              <div className="h-64 bg-slate-950 border border-cyan-900/20 rounded-2xl mb-6 overflow-hidden relative">
                <img
                  src="/forum-mockup.webp"
                  alt="Contoh forum diskusi"
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/600x400/020617/22d3ee?text=Forum+Komunitas';
                  }}
                />
              </div>
              <div className="text-center">
                {user ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400">
                        <img src={user.photoURL || '/placeholder-user.webp'} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-gray-200 font-bold text-sm">{t.welcome}, {user.displayName}!</p>
                    </div>
                    <Link href="/forum" className="mt-2 text-xs text-cyan-400 hover:underline">
                      {t.forumVisit} →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 text-sm mb-4">{t.googleLoginPrompt}</p>
                    <button 
                      onClick={handleLogin}
                      className="bg-white text-gray-800 hover:bg-gray-100 font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 mx-auto transition-colors text-sm shadow"
                    >
                      <span>📝</span> {t.googleLogin}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}