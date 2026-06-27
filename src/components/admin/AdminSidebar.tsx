"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto w-64 bg-slate-800 text-white h-screen flex flex-col transition-transform duration-300 transform shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-400">Admin Panel</h1>
            <p className="text-xs text-gray-400">Meteorit Indonesia</p>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={onClose} 
            className="md:hidden text-gray-400 hover:text-white focus:outline-none"
            aria-label="Tutup sidebar"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>
        
        <nav className="p-4 flex-grow overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/"
                className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-sm font-semibold text-cyan-400 hover:bg-slate-700/50 hover:text-cyan-300 border border-cyan-500/20 mb-4 bg-slate-900/40"
              >
                <span className="text-base">🏠</span> Kembali ke Beranda
              </Link>
            </li>
            {[
              { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
              { href: '/admin/artikel', icon: '📝', label: 'Manajemen Artikel' },
              { href: '/admin/astronot', icon: '👨‍🚀', label: 'Daftar Astronot' },
              { href: '/admin/ensiklopedia', icon: '🌠', label: 'Ensiklopedia' },
              { href: '/admin/forum', icon: '💬', label: 'Forum Komunitas' },
              { href: '/admin/donasi', icon: '💰', label: 'Donasi & Langganan' },
              { href: '/admin/iklan', icon: '📢', label: 'Manajemen Iklan' },
              { href: '/admin/pengaturan', icon: '⚙️', label: 'Pengaturan' },
              { href: '/admin/pengguna', icon: '👥', label: 'Manajemen Pengguna' },
            ].map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                    isActive(item.href) 
                      ? 'bg-slate-700 text-amber-400 shadow-md shadow-slate-900/50' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
