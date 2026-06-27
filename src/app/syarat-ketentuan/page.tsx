import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSiteHost } from '@/lib/siteUrl';

export const metadata = {
  title: 'Syarat & Ketentuan - Meteorit Indonesia',
  description: 'Syarat dan ketentuan penggunaan Meteorit Indonesia, termasuk lisensi data NASA Open APIs, The Space Devs, Open Notify, dan aturan forum komunitas.',
};

export default function SyaratKetentuan() {
  const contactEmail = `info@${getSiteHost()}`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-cyan-400 mb-3">Syarat &amp; Ketentuan</h1>
            <p className="text-gray-400 text-sm">Terakhir diperbarui: 25 Juni 2026</p>
          </div>

          {/* NASA License Section - PROMINENT */}
          <div className="bg-gradient-to-br from-blue-950/60 to-slate-900/60 border border-blue-500/30 rounded-2xl p-8 mb-8 shadow-lg shadow-blue-950/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl flex-shrink-0">🛰️</div>
              <div>
                <h2 className="text-xl font-bold text-blue-300 mb-3">Lisensi & Atribusi Data NASA dan Pihak Ketiga</h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  Website ini menggunakan data dari lembaga antariksa resmi dan penyedia API publik. Semua data digunakan sesuai ketentuan lisensi masing-masing penyedia:
                </p>
                <div className="space-y-4">

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <span>🌌</span> NASA Open APIs (api.nasa.gov)
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      <li><strong>APOD (Astronomy Picture of the Day)</strong>: Gambar bebas digunakan untuk tujuan edukasi dan non-komersial. Hak cipta fotografer ditampilkan sesuai data JSON NASA.</li>
                      <li><strong>NASA EPIC</strong>: Foto Bumi dari satelit DSCOVR dalam domain publik (Public Domain) sesuai kebijakan NASA.</li>
                      <li><strong>NASA NeoWs</strong>: Data Near Earth Objects tersedia untuk penggunaan bebas sesuai syarat API NASA.</li>
                      <li>Semua data NASA digunakan sesuai <a href="https://www.nasa.gov/about/highlights/HP_Privacy.html" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">kebijakan penggunaan NASA</a>.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                      <span>🚀</span> The Space Devs — Launch Library 2
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      <li>Data jadwal peluncuran roket diperoleh dari <a href="https://thespacedevs.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">The Space Devs Launch Library 2 API</a>.</li>
                      <li>Digunakan sesuai <a href="https://ll.thespacedevs.com/2.2.0/config/list/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">ketentuan The Space Devs</a> untuk penggunaan non-komersial dan edukasi.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                      <span>🛰️</span> Open Notify API
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      <li>Data posisi ISS real-time dan daftar astronot diperoleh dari <a href="http://open-notify.org/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Open Notify</a> (api.open-notify.org).</li>
                      <li>API ini bersifat open dan bebas digunakan untuk tujuan edukasi dan non-komersial.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                      <span>🌠</span> Stellarium Web
                    </h3>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside">
                      <li>Fitur Langit Malam menggunakan embed dari <a href="https://stellarium-web.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Stellarium Web</a> yang berlisensi open-source (GNU GPLv2+).</li>
                    </ul>
                  </div>

                </div>
                <p className="text-xs text-gray-500 mt-4">
                  <strong>Catatan:</strong> Meteorit Indonesia bukan afiliasi resmi NASA, The Space Devs, atau Open Notify. Data disajikan untuk tujuan edukasi dan literasi sains bagi masyarakat Indonesia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Pendahuluan</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Selamat datang di Meteorit Indonesia. Dengan mengakses dan menggunakan website kami, Anda setuju untuk terikat oleh syarat dan ketentuan berikut. Jika Anda tidak setuju dengan syarat dan ketentuan ini, harap jangan menggunakan website kami.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Syarat dan ketentuan ini dapat berubah kapan saja tanpa pemberitahuan sebelumnya. Penggunaan Anda yang berkelanjutan terhadap website setelah perubahan tersebut berarti Anda menerima perubahan tersebut.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Penggunaan Website</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">1. Kelayakan</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Anda harus berusia minimal 13 tahun untuk menggunakan layanan kami. Jika Anda berusia di bawah 18 tahun, Anda harus mendapatkan izin dari orang tua atau wali.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">2. Akun Pengguna</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Untuk mengakses fitur tertentu, Anda mungkin perlu membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda dan semua aktivitas yang terjadi di bawah akun Anda.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">3. Konten Pengguna</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Anda bertanggung jawab penuh atas konten yang Anda unggah atau bagikan. Anda setuju untuk tidak mengunggah konten yang:
                </p>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside mt-2">
                  <li>Melanggar hukum atau peraturan yang berlaku</li>
                  <li>Mengandung materi yang menyinggung, cabul, atau kekerasan</li>
                  <li>Melanggar hak kekayaan intelektual orang lain</li>
                  <li>Mengandung virus atau malware</li>
                  <li>Digunakan untuk spam atau iklan yang tidak diinginkan</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">4. Hak Kami</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Kami berhak untuk menghapus konten atau menonaktifkan akun yang melanggar syarat dan ketentuan ini tanpa pemberitahuan sebelumnya.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Hak Kekayaan Intelektual</h2>
            <p className="text-gray-300 leading-relaxed text-sm mb-4">
              Semua konten di website Meteorit Indonesia yang dibuat secara original, termasuk teks editorial, logo, dan desain website, adalah properti kami atau dilisensikan kepada kami dan dilindungi oleh hukum hak cipta.
            </p>
            <p className="text-gray-300 leading-relaxed text-sm mb-3">Data dari NASA dan pihak ketiga digunakan sesuai lisensi masing-masing (lihat bagian Lisensi & Atribusi di atas). Anda tidak diperbolehkan untuk:</p>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>Menggunakan konten original kami untuk tujuan komersial tanpa izin tertulis</li>
              <li>Mengubah atau mendistribusikan konten original kami tanpa izin</li>
              <li>Menggunakan logo atau merek dagang kami tanpa izin</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Forum Komunitas</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Dengan berpartisipasi di forum komunitas kami, Anda setuju untuk:
            </p>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>Menghormati pendapat dan privasi anggota lain</li>
              <li>Tidak mengunggah konten yang melanggar hukum atau menyinggung</li>
              <li>Tidak melakukan spam atau promosi yang tidak relevan</li>
              <li>Tidak menggunakan bahasa kasar atau menghina</li>
              <li>Mematuhi semua aturan forum yang ditetapkan oleh admin</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Donasi dan Langganan</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Donasi yang Anda berikan adalah sukarela dan tidak dapat dikembalikan. Dengan berdonasi, Anda membantu kami mempertahankan dan mengembangkan layanan kami.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Untuk langganan premium, pembayaran akan diproses melalui sistem pembayaran yang aman. Langganan dapat dibatalkan kapan saja, tetapi tidak ada pengembalian dana untuk periode yang sudah berlalu.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Pembatasan Tanggung Jawab</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Meteorit Indonesia tidak bertanggung jawab atas:
            </p>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>Kerugian atau kerusakan yang timbul dari penggunaan website kami</li>
              <li>Konten yang diunggah oleh pengguna lain</li>
              <li>Kesalahan atau ketidakakuratan dalam data pihak ketiga (NASA, dll.)</li>
              <li>Gangguan atau kegagalan teknis pada layanan kami atau API pihak ketiga</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-400">Hubungi Kami</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">Email: <a href={`mailto:${contactEmail}`} className="text-cyan-400 hover:text-cyan-300">{contactEmail}</a></p>
              <p className="text-gray-300">Telegram: <a href="https://t.me/meteoritindonesia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">t.me/meteoritindonesia</a></p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
