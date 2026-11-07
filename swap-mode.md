

* Ubah tampilan hanya responsive mobile halaman daftar artikel blog

* - artikel ensiklopedia / jenis meteorit, artikel komet, artikel planet mars, laporan fireball, artikel apod, artikel peristiwa alam, glosarium, blog, astronot

* buatkan opengraph ketika di share ke sosial media whatsapp, flipboard dan lainnya gambar banner ikut terkirim 
* di tengah banner di beri logo,
*  judul artikel, resume / descriprion artikel
* gambar banner disimpan di R2 langsung di kompres menjadi webp 80% untuk hemat R2 tapi gambar banner teap bagus
sekarang opengrahph mayoritas menggunaan logo
* untuk view desktop di pertahankan

* buat  pengalaman swab seperti membuka majalah dengan mengulung swab keatas
* untuk swap model card artikel buat dengan borders sehingga enak di liat
* (Dual Mode)**: Menyediakan tombol switcher ikon di mobile (misal: 📱 *Mode Swipe* vs 📰 *Mode Scroll Grid*) agar pengguna bebas memilih gaya membaca favorit mereka.
* tegrasi Bar Navigasi Menu (Pengguna Tidak Terjebak)**:
*    - Pada bagian atas Flipboard Reader telah ditambahkan **Navigation Menu Bar**:
*      - `🏠 Beranda`
*      - `📰 Grid View` (Tombol kembali ke mode grid) - letakan di atas
*    - Pengguna kini dapat langsung berpindah ke menu atau halaman lain kapan saja tanpa merasa tertutup atau terjebak.
* 
menjadi modern dengan gaya Flipboard/Google Discover/Apple News.

Animasi Kartu Fisik Meluncur ke Atas (Real Vertical Page Slide)
   - Gerakan usap layar mengikuti gerakan jempol secara langsung (*real-time touch tracking*)**.
   - Saat di-swipe ke atas atau menekan `⬇️ Berikutnya`, kartu aktif akan fisik **meluncur naik ke atas layar (`translateY(-140vh)`)** dengan rotasi 3D 40 derajat, dan kartu baru akan meluncur naik dari bawah ke tengah layar. Pergerakan usap majalah kini terasa sangat jelas dan nyata.



PENTING:
- Jangan mengubah struktur database, API, D1, Firebase, R2, RSS, Podcast, atau logika backend.
- Jangan mengubah URL, routing, metadata SEO, sitemap, robots, schema.org, canonical, Open Graph, atau JSON-LD.
- Jangan mengubah halaman detail artikel.
- Hanya ubah UI/UX daftar artikel.

DESAIN

1. Gunakan layout Magazine Style.
2. Setiap artikel menjadi Card besar.
3. Banner memenuhi lebar card.
4. Rasio banner 16:9.
5. Border radius 18px.
6. Shadow lembut.
7. Spasi antar card 24px.
8. Background putih.
9. Hover:
   - shadow sedikit bertambah
   - scale 1.01
10. Mobile-first.

ISI CARD

Urutan:

Banner, Kategori, Judul

Ringkasan maksimal 3 baris

Tanggal

Estimasi waktu baca
Tombol:
- Baca
- Share

Jangan tampilkan teks terlalu panjang.

RESPONSIVE


Mobile:
- 1 kolom

ANIMASI

Tambahkan animasi ringan:
- fade in
- slide up
- smooth transition

Scroll tetap vertikal.

INFINITE SCROLL

Gunakan Infinite Scroll atau Load More.

Jangan memakai pagination klasik jika memungkinkan.

PERFORMANCE

Gunakan Next/Image.
Lazy loading. Tidak boleh ada CLS.Optimalkan LCP.ACCESSIBILITY

Semua tombol memiliki aria-label.Kontras warna memenuhi WCAG.

SEO
warna banner di halaman renungan buat dinamic setiap hari ganti warna berotasi, dengan 10 warna pilihan yang harus ada, putih, biru facebook, hijau spotify, ungu gradasi metalik dan warna warna cerah gradasi lainnya yang kontras dengan warna text - dan warna text di buat hitam bold agar lebih jelas
Semua SEO tetap sama.

Tidak mengubah:
- metadata
- sitemap
- RSS
- structured data

STYLE

Inspirasi:
- Flipboard
- Google Discover
- Apple News

Namun tetap memiliki identitas GraceDaily.

HASIL

Refactor seminimal mungkin.

Gunakan komponen yang sudah ada.

Jangan membuat ulang project.

Jangan mengubah backend.

Hanya ubah tampilan daftar artikel  dan renungan versi mobile menjadi modern seperti aplikasi berita premium.


Fitur **Vertical Flip / Swipe Snap** (seperti di aplikasi Flipboard asli, TikTok, atau Instagram Reels) adalah konsep yang sangat menarik dan elegan untuk pengguna ponsel (mobile).

---



1. **Mobile Fullscreen Snap Feed**:
   - Di layar handphone (mobile), setiap Card Renungan/Artikel akan tampil **layar penuh (full height/viewport)**.
   - Container menggunakan teknologi **CSS Native Scroll Snap** (`snap-y snap-mandatory overflow-y-auto`).
   - Saat pengguna melakukan swipe (usap) layar ke atas atau ke bawah, tampilan akan otomatis *snap* (terkunci mulus) ke artikel/renungan berikutnya dengan animasi peralihan halaman majalah (*magazine page flip*).

2. **Pengalaman Pengguna (UX) Premium**:
   - Pembaca di handphone mendapat fokus 100% pada satu renungan/artikel per usapan layar (tanpa distraksi artikel lain terpotong di tengah layar).
   - Dilengkapi dengan *indicator swipe* (petunjuk visual usap ke atas ⬆️) dan counter halaman (misal: *Renungan 3 dari 30*).

3. **Responsive Hybrid**:
   - **Mobile (Handphone)**: Menggunakan mode **Flipboard Fullscreen Vertical Swipe Feed**.
   - **Desktop & Tablet**: Tetap menggunakan layout **3 Kolom Grid** yang telah kita buat agar nyaman dipandu dengan mouse.

---

### 🛠️ Opsi Pengimplementasian:

(Dual Mode)**: Menyediakan tombol switcher ikon di mobile (misal: 📱 *Mode Flipboard Swipe* vs 📰 *Mode Scroll Grid*) agar pengguna bebas memilih gaya membaca favorit mereka.


Tolong implementasikan fitur Dynamic OpenGraph Image & Mobile Flipboard Swipe Reader dengan spesifikasi berikut:

1. DYNAMIC OPENGRAPH BANNER GENERATOR:
   - Buat API Route `/api/og` menggunakan `next/og` (`ImageResponse`) yang menghasilkan banner OpenGraph berukuran 1200x630px.
   - Banner harus berisi: Logo Brand (dari public folder), Judul Artikel/Konten, Deskripsi/Excerpt singkat, serta Watermark Domain Website.
   - Sediakan 10 Preset Skema Warna Gradient Premium yang berganti secara otomatis/dinamis.
   - Output gambar wajib berformat PNG (`image/png`) dengan header `Content-Type`, `Content-Length`, dan CORS `Access-Control-Allow-Origin: *` agar 100% kompatibel dengan preview WhatsApp, Facebook, X, dan Flipboard.
   - Simpan/cache hasil render banner ke Cloudflare R2 / S3 Storage agar pembacaan berikutnya instan tanpa re-render.
   - Integrasikan ke Metadata OpenGraph (`og:image`, `og:image:type`, `og:title`, `og:description`) dan JSON-LD Structured Data (`Article` schema).

2. MOBILE FULLSCREEN FLIPBOARD / TIKTOK STYLE FEED (DUAL-MODE READER):
   - Tambahkan UI Switcher Toggle di Mobile untuk berpindah antara "Mode Grid" dan "Mode Swipe Feed".
   - Pada Mode Swipe: Tampilkan kartu artikel layar penuh (fullscreen viewport) khusus layar mobile.
   - Layout Kartu: Gunakan rasio banner 16:9 di bagian atas, dan area konten (Judul, Ringkasan 4 baris, Meta Tanggal/Waktu Baca, serta Tombol Aksi "Baca" & "Share") di bagian bawah dengan latar gelap solid agar tidak tumpang tindih.
   - Posisi Tombol Navigasi: Tempatkan indikator/tombol melayang Next & Prev di sisi kanan tengah layar agar tidak pernah menutupi tombol Share / Baca Artikel di bagian bawah.
   - Animasi & Performa:
     * Gunakan Framer Motion 3D Page Flip (`rotateX`, `perspective: 1200px`) yang menyerupai efek menggulung majalah fisik.
     * Jalankan perpindahan kartu secara instan (*zero black-screen delay*) dan tambahkan preloading gambar artikel berikutnya/sebelumnya.
     * Dukung gesture Touch Swipe, Tombol Keyboard (Panah/PageDown), serta Scroll Trackpad/Mouse Wheel.

3. PRINSIP PENGEMBANGAN:
   - Jangan merusak struktur database, API backend, atau fitur utama yang sudah ada.
   - Pastikan halaman detail artikel tetap mendukung pencarian berdasarkan ID maupun Slug.

