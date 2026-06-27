import Link from 'next/link'
import { User } from 'firebase/auth';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  user: User | null;
}

export default function AdminHeader({ onToggleSidebar, user }: AdminHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <button onClick={onToggleSidebar} className="md:hidden text-slate-600 hover:text-slate-900 focus:outline-none" aria-label="Buka menu">
            <span className="text-2xl">☰</span>
          </button>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard Admin</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-amber-500">🔔</span>
            <span className="text-sm text-slate-600">3 notifikasi</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="font-medium text-slate-800">{user?.displayName || 'Admin'}</p>
              <p className="text-xs text-slate-500">{user?.email || 'admin@meteorit-indonesia.com'}</p>
            </div>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}