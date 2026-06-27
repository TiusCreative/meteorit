import { getSiteHost } from '@/lib/siteUrl';

export default function KebijakanPrivasi() {
  const contactEmail = `info@${getSiteHost()}`;

  return (
    <main className="min-h-screen bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-cyan-400">Kebijakan Privasi</h1>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Pendahuluan</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Di Meteorit Indonesia, kami menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi Anda ketika Anda menggunakan website kami.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Dengan menggunakan website kami, Anda setuju dengan pengumpulan dan penggunaan informasi sesuai dengan Kebijakan Privasi ini.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Informasi yang Kami Kumpulkan</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">1. Informasi Pribadi</h3>
              <p className="text-gray-300 leading-relaxed">
                Kami dapat mengumpulkan informasi pribadi yang Anda berikan secara sukarela ketika Anda:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mt-2">
                <li>Membuat akun (nama, alamat email, dll.)</li>
                <li>Berpartisipasi di forum (postingan, komentar)</li>
                <li>Mengirim pesan melalui formulir kontak</li>
                <li>Melakukan donasi (informasi pembayaran)</li>
                <li>Berlangganan newsletter (alamat email)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">2. Informasi Non-Pribadi</h3>
              <p className="text-gray-300 leading-relaxed">
                Kami secara otomatis mengumpulkan informasi non-pribadi seperti:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mt-2">
                <li>Alamat IP dan informasi browser</li>
                <li>Halaman yang dikunjungi dan waktu kunjungan</li>
                <li>Informasi perangkat (tipe, OS, dll.)</li>
                <li>Data analitik penggunaan website</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">3. Cookie dan Teknologi Pelacakan</h3>
              <p className="text-gray-300 leading-relaxed">
                Kami menggunakan cookie dan teknologi serupa untuk:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mt-2">
                <li>Meningkatkan pengalaman pengguna</li>
                <li>Menganalisis penggunaan website</li>
                <li>Menyimpan preferensi pengguna</li>
                <li>Menargetkan iklan yang relevan</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-2">
                Anda dapat menonaktifkan cookie melalui pengaturan browser, tetapi ini mungkin mempengaruhi fungsionalitas website.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Cara Kami Menggunakan Informasi Anda</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Kami menggunakan informasi yang kami kumpulkan untuk tujuan berikut:
            </p>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li>Menyediakan dan memelihara layanan kami</li>
              <li>Meningkatkan pengalaman pengguna</li>
              <li>Berkomunikasi dengan Anda (email, notifikasi)</li>
              <li>Memproses transaksi donasi</li>
              <li>Menganalisis penggunaan website</li>
              <li>Mencegah penipuan dan penyalahgunaan</li>
              <li>Memenuhi kewajiban hukum</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Bagaimana Kami Melindungi Informasi Anda</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran, termasuk:
            </p>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li>Enkripsi data sensitif</li>
              <li>Kontrol akses yang ketat</li>
              <li>Pemantauan keamanan secara teratur</li>
              <li>Pembaruan keamanan berkala</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Meskipun kami berusaha melindungi informasi Anda, tidak ada metode transmisi atau penyimpanan elektronik yang 100% aman. Kami tidak dapat menjamin keamanan absolut.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Berbagi Informasi dengan Pihak Ketiga</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Namun, kami dapat berbagi informasi dengan:
            </p>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li><strong>Penyedia layanan:</strong> Pihak ketiga yang membantu kami mengoperasikan website (hosting, analitik, pembayaran)</li>
              <li><strong>Kewajiban hukum:</strong> Jika diperlukan oleh hukum atau untuk melindungi hak kami</li>
              <li><strong>Transaksi bisnis:</strong> Jika terjadi penggabungan, akuisisi, atau penjualan aset</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-2">
              Kami hanya berbagi informasi yang diperlukan dan memastikan pihak ketiga tersebut mematuhi standar privasi yang ketat.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Hak Anda</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Anda memiliki hak-hak berikut terkait dengan informasi pribadi Anda:
            </p>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li><strong>Akses:</strong> Meminta salinan informasi pribadi yang kami simpan</li>
              <li><strong>Perbaikan:</strong> Meminta koreksi informasi yang tidak akurat</li>
              <li><strong>Penghapusan:</strong> Meminta penghapusan informasi dalam kondisi tertentu</li>
              <li><strong>Penolakan:</strong> Menolak pemrosesan informasi Anda dalam kondisi tertentu</li>
              <li><strong>Portabilitas:</strong> Meminta transfer informasi Anda ke layanan lain</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-2">
              Untuk mengekspresikan hak-hak Anda, silakan hubungi kami melalui email: <a href="mailto:privacy@meteorit-indonesia.com" className="text-cyan-400 hover:text-cyan-300">privacy@meteorit-indonesia.com</a>
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Retensi Data</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Kami akan menyimpan informasi pribadi Anda hanya selama diperlukan untuk tujuan yang dijelaskan dalam Kebijakan Privasi ini, kecuali diperlukan oleh hukum.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Kriteria yang kami gunakan untuk menentukan periode retensi termasuk:
            </p>
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li>Apakah informasi masih diperlukan untuk menyediakan layanan</li>
              <li>Apakah ada kewajiban hukum untuk menyimpan data</li>
              <li>Apakah ada permintaan penghapusan dari Anda</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Kebijakan Privasi Anak</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Layanan kami tidak ditujukan untuk anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan informasi pribadi dari anak di bawah usia 13 tahun. Jika kami mengetahui bahwa kami telah mengumpulkan informasi pribadi dari anak di bawah usia 13 tahun tanpa verifikasi izin orang tua, kami akan mengambil langkah untuk menghapus informasi tersebut secepat mungkin.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Jika Anda adalah orang tua atau wali dan Anda mengetahui bahwa anak Anda telah memberikan kami dengan informasi pribadi, silakan hubungi kami sehingga kami dapat mengambil tindakan yang diperlukan.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Perubahan pada Kebijakan Privasi</h2>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberitahukan Anda tentang perubahan dengan mempublikasikan Kebijakan Privasi yang baru di halaman ini.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Kami menyarankan Anda untuk meninjau Kebijakan Privasi ini secara berkala untuk perubahan apa pun. Perubahan pada Kebijakan Privasi ini efektif ketika diposting di halaman ini.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Hubungi Kami</h2>

          <p className="text-gray-300 leading-relaxed mb-4">
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
          </p>

          <div className="space-y-2">
            <p className="text-gray-300">Email: <a href={`mailto:${contactEmail}`} className="text-cyan-400 hover:text-cyan-300">{contactEmail}</a></p>
            <p className="text-gray-300">Alamat: Jl. Astronomi , Bekasi, Jawa Barat 40115, Indonesia</p>
          </div>

          <p className="text-gray-300 leading-relaxed mt-6">
            Terakhir diperbarui: 23 Juni 2026
          </p>
        </div>
      </div>
    </main>
  )
}
