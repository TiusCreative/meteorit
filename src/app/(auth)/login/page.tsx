"use client"

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Save/Register user to Firestore checking if whitelisted in adminEmails
      if (result.user && result.user.email) {
        const userEmail = result.user.email.toLowerCase();
        let finalRole = 'user';
        
        try {
          const settingsRes = await fetch('/api/admin/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            const whitelist: string[] = settingsData.settings?.adminEmails || [];
            if (whitelist.map(e => e.toLowerCase()).includes(userEmail)) {
              finalRole = 'admin';
            }
          }
        } catch (err) {
          console.error("Failed to query settings for admin whitelist:", err);
        }

        // Hardcoded safety fallback for tius emails
        if (userEmail.includes('tius') || userEmail.includes('tiuss75')) {
          finalRole = 'admin';
        }

        const userRef = doc(db, 'users', result.user.uid)
        const userSnap = await getDoc(userRef)
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            id: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || 'Admin',
            role: finalRole
          })
        } else {
          const currentRole = userSnap.data().role || 'user';
          await setDoc(userRef, {
            email: result.user.email,
            displayName: result.user.displayName || userSnap.data().displayName,
            role: finalRole === 'admin' ? 'admin' : currentRole
          }, { merge: true })
        }
      }
      
      router.push('/admin/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      setError('Gagal login dengan Google. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-slate-800/50 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8 text-cyan-400">Login Admin</h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              {isLoading ? (
                <span className="animate-spin">🔄</span>
              ) : (
                <span>📝</span>
              )}
              Login dengan Google
            </button>

            <div className="text-center text-gray-400 text-sm">
              atau
            </div>

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input 
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Masukkan alamat email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input 
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Masukkan password"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Login
              </button>
            </form>

            <div className="text-center text-gray-400 text-sm">
              <a href="/lupa-password" className="text-cyan-400 hover:text-cyan-300">Lupa password?</a>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-700 text-center">
            <p className="text-gray-400 mb-4">Hanya admin yang berwenang yang dapat mengakses halaman ini.</p>
            <button 
              onClick={() => router.push('/')}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              ← Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}