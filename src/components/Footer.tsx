import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'

const socialLinks = [
  {
    name: 'WhatsApp Channel',
    href: 'https://whatsapp.com/channel/meteorit',
    icon: FaWhatsapp,
    hoverColor: 'hover:text-green-400',
  },
  {
    name: 'Telegram Channel',
    href: 'https://t.me/meteoritindonesia',
    icon: FaTelegramPlane,
    hoverColor: 'hover:text-sky-400',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/meteorit.indonesia/',
    icon: FaInstagram,
    hoverColor: 'hover:text-pink-400',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61591469427891',
    icon: FaFacebookF,
    hoverColor: 'hover:text-blue-400',
  },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-400">Meteorit Indonesia</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Pusat data astronomi, edukasi sains, forum komunitas, dan jembatan transaksi meteorit terpercaya di Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-cyan-400">Menu Utama</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-cyan-400 transition-colors">Beranda</Link></li>
              <li><Link href="/ensiklopedia" className="hover:text-cyan-400 transition-colors">Meteorit &amp; Komet</Link></li>
              <li><Link href="/langit-malam" className="hover:text-cyan-400 transition-colors">🌠 Langit Malam</Link></li>
              <li><Link href="/monitoring" className="hover:text-cyan-400 transition-colors">🚀 Misi Antariksa</Link></li>
              <li><Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog</Link></li>
              <li><Link href="/apod" className="hover:text-cyan-400 transition-colors">Galeri APOD</Link></li>
              <li><Link href="/forum" className="hover:text-cyan-400 transition-colors">Forum</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-cyan-400">Tentang Kami</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/tentang" className="hover:text-cyan-400 transition-colors">Tentang Kami</Link></li>
              <li><Link href="/visi-misi" className="hover:text-cyan-400 transition-colors">Visi &amp; Misi</Link></li>
              <li><Link href="/kontak" className="hover:text-cyan-400 transition-colors">Kontak</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-cyan-400 transition-colors">Syarat &amp; Ketentuan</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-cyan-400 transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-cyan-400">Ikuti Kami</h4>
            <div className="flex space-x-4 mb-4">
              {socialLinks.map(({ name, href, icon: Icon, hoverColor }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 ${hoverColor} transition-colors`}
                  title={name}
                  aria-label={name}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Bergabunglah di <a href="https://t.me/meteoritindonesia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold">Saluran Telegram</a> untuk info sains terupdate harian!
            </p>
          </div>
        </div>

        {/* NASA Attribution */}
        <div className="border-t border-slate-800 pt-6 mb-6">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-gray-400 font-semibold">🛰️ Atribusi Data:</span>{' '}
              Data di situs ini disediakan oleh{' '}
              <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 underline font-semibold">NASA Open APIs</a>
              {' '}(APOD, EPIC, NeoWs — bebas digunakan sesuai{' '}
              <a href="https://www.nasa.gov/about/highlights/HP_Privacy.html" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 underline">kebijakan NASA</a>
              ),{' '}
              <a href="https://thespacedevs.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 underline font-semibold">The Space Devs</a>
              {' '}(Launch Library 2), dan{' '}
              <a href="http://open-notify.org/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 underline font-semibold">Open Notify</a>
              {' '}(ISS Tracker &amp; Astronaut Data). Hak cipta foto APOD tercantum pada masing-masing gambar sesuai ketentuan NASA.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Meteorit Indonesia. All rights reserved.</p>
          <p className="mt-2">
            Dibuat dengan ❤️ untuk komunitas astronomi Indonesia
          </p>
        </div>
      </div>
    </footer>
  )
}
