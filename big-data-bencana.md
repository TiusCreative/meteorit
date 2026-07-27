Berikut adalah rangkuman cetak biru (*blueprint*) arsitektur sistem dan data pipeline untuk **Meteorit.my.id** yang telah dirapikan, distrukturkan, dan dikelompokkan secara profesional. Rangkuman ini mengintegrasikan seluruh modul (termasuk fitur baru *Publish Queue, Rate Limiter, Event Correlation Engine,* dan *Rules Engine*) agar Anda dapat langsung menyalinnya (*copy-paste*) ke dalam dokumentasi proyek dan menyelesaikannya poin demi poin.

---

## 🌐 1. Arsitektur Utama Sistem

Meteorit.my.id beroperasi sebagai pusat data kebencanaan global yang *event-driven*, otomatis 24 jam tanpa ketergantungan pada pihak ketiga (seperti Make.com atau Vercel Cron), serta sepenuhnya berjalan di infrastruktur Cloudflare + Next.js.

```
[API Providers: NASA/NOAA/BMKG/etc.] 
       │
       ▼ (Every 5-30 Mins via Cloudflare Cron Triggers)
[Cloudflare Workers: Data Pipeline] ───► [Rules Engine / Correlation]
       │
       ├───► Metadata & SQL Structured Data ───► [Cloudflare D1 Database]
       ├───► Raw Data & Large Files (WebP/PDF) ───► [Cloudflare R2 Storage]
       └───► Edge Cache Invalidation ──────────► [Cloudflare KV]
       │
       ▼ (Internal Worker Queue)
[Social Media & Notification Queue] ───► [Telegram, Discord, FB Page, Bluesky, RSS, etc.]
       │
       ▼ (Edge API Serving)
[Next.js Website (Vercel)] ───► End Users (Realtime Dashboard, Search, Multi-Language, PDF Export)

```

### Komponen Arsitektur:

* **Frontend (Next.js & PWA):** Aplikasi responsif dengan dukungan *Offline Cache*, tema *Dark/Light Mode*, serta **Full Content Multi-Bahasa (7 Bahasa)**.
* **Backend (Cloudflare Workers & Cron Triggers):** Bertanggung jawab penuh atas penarikan data (*fetching*), normalisasi, pemrosesan gambar, manajemen antrean (*queue*), dan otomatisasi publikasi.
* **Database (Cloudflare D1):** Menyimpan data terstruktur (metadata, URL file, koordinat, stempel waktu (*timestamp*), ukuran file, dan informasi relasional).
* **Penyimpanan Objek (Cloudflare R2):** Menyimpan file berukuran besar seperti berkas mentah `JSON`, `CSV`, `GeoJSON`, `Excel`, dokumen `PDF`, citra satelit, serta gambar berformat `WebP`.
* **Akselerasi (Cloudflare KV):** Digunakan untuk manajemen *caching* tepi (*edge*) dan status token API pihak ketiga (disimpan aman via *Cloudflare Secrets*).

---

## 🗂 2. Skema Pembagian Data & Penyimpanan

### 2.1 Database Terstruktur (Cloudflare D1)

Menampung tabel metadata inti dengan kolom seragam:
`id`, `source`, `category`, `title`, `description`, `timestamp`, `latitude`, `longitude`, `province`, `country`, `status`, `severity`, `tags`, `file_url`, `thumbnail_url`, `created_at`, `updated_at`.

**Daftar Tabel Utama:**

* `weather` | `earthquake` | `volcano` | `tsunami` | `flood` | `cyclone` | `wildfire`
* `satellite` | `news` | `users` | `alerts` | `downloads` | `publish_logs`

### 2.2 Penyimpanan Blob/File (Cloudflare R2)

Seluruh gambar dari penyedia data luar otomatis dikonversi ke format **WebP** sebelum diunggah demi efisiensi ruang penyimpanan dan kecepatan muat halaman.

**Struktur Direktori R2:**

* `/weather/` , `/volcano/` , `/earthquake/` , `/satellite/` , `/himawari/` , `/firms/` , `/gpm/`
* `/geojson/` , `/csv/` , `/json/` , `/pdf/` , `/images/` , `/backup/`

---

## ⚙️ 3. Core Data Pipeline & Modules (Alur Otomatis)

Pipeline data berjalan otomatis melalui **Cloudflare Cron Triggers** tanpa intervensi manusia dengan pembagian jadwal eksekusi sebagai berikut:

* **Setiap 5 Menit:** Gempa Bumi, Aktivitas Gunung Api, Hotspot NASA FIRMS.
* **Setiap 10 Menit:** Data Cuaca Realtime, Citra Satelit JMA Himawari.
* **Setiap 30 Menit:** NASA GPM (Curah Hujan), NOAA.
* **Setiap 1 Jam:** NASA EONET, NASA POWER.
* **Setiap Malam (00:00):** Kompilasi Statistik & Backup Otomatis (Harian/Bulanan/Tahunan).

### Tahapan Alur Data:

1. **Fetch & Validate:** Mengambil data dari API penyedia $\rightarrow$ Memastikan skema data valid.
2. **Normalize & Deduplicate:** Mengubah struktur data yang berbeda menjadi satu format standar Meteorit $\rightarrow$ Memeriksa ID, *slug*, URL, atau *hash* agar tidak ada data ganda.
3. **Rules Engine (Modul Baru):** Memeriksa ambang batas aturan kustom tanpa mengubah kode (misal: Hanya mengirim notifikasi jika Gempa $\ge$ M5.0, atau menyaring Hotspot dengan *confidence* $<$ 50% untuk disimpan ke database saja tanpa dipublikasikan).
4. **Event Correlation Engine (Modul Baru):** Jika terjadi suatu bencana (misal: Erupsi Gunung), sistem otomatis mengaitkan data dari berbagai sumber berbeda (Status dari MAGMA, Hotspot dari FIRMS, arah angin dari BMKG, citra satelit dari Himawari) menjadi **satu halaman peristiwa terpadu**.
5. **AI Analysis:** Menghasilkan ringkasan otomatis, mendeteksi perubahan status, tren, tingkat keparahan (*severity*), dan menyusun narasi laporan.
6. **Asset Generation:** Otomatis membuat halaman artikel, metadata SEO (Schema.org, JSON-LD, OpenGraph), dan menghasilkan visual (Thumbnail, Banner, Social Card ukuran 1200x630, 1080x1080, 1080x1920) dalam format WebP.
7. **Persistence:** Menyimpan entri data ke Cloudflare D1 dan mengunggah aset visual/file mentah ke Cloudflare R2.
8. **Cache Management:** Melakukan *cache invalidation* pada Cloudflare KV agar data di Next.js langsung terbarui seketika.

---

## 📣 4. Social Media Automation & Notification Pipeline

Proses publikasi informasi dan peringatan dini ke media sosial dikelola mandiri oleh sistem internal menggunakan pendekatan berbasis antrean.

### 4.1 Publish Queue & Rate Limiter (Modul Baru)

* **Publish Queue:** Semua artikel atau peringatan yang siap terbit dimasukkan ke dalam antrean (*Queue*) terlebih dahulu dan diproses satu per satu secara berurutan. Hal ini mencegah kegagalan sistem akibat lonjakan data dalam waktu singkat (seperti rentetan gempa susulan).
* **Rate Limiter:** Mengatur ritme jeda pengiriman data keluar (*post requests*) disesuaikan dengan limitasi API masing-masing platform tujuan (Facebook, Telegram, Discord, dsb.) untuk menghindari pemblokiran (*rate limit/banned*).
* **Auto Retry:** Jika platform eksternal gagal menerima kiriman, sistem melakukan percobaan ulang otomatis hingga 3 kali (Retry 1, 2, 3). Jika tetap gagal, status diubah menjadi *Failed* dan dicatat dalam *Error Log* tanpa mengganggu antrean platform lainnya.

### 4.2 Komponen Sosial Media & Notifikasi:

* **Platform Didukung:** Website (Push Notification), RSS Feed, Telegram Channel/Bot, Discord, Facebook Page, Mastodon, Bluesky, LinkedIn, Pinterest, WhatsApp Channel, serta otomatisasi permintaan indeks ke Google & Bing Indexing API.
* **Caption AI & Hashtag:** Menghasilkan teks deskripsi yang disesuaikan secara unik untuk karakteristik masing-masing platform media sosial lengkap dengan tagar relevan secara otomatis (contoh: `#Gempa #Meteorit`).
* **Format Pesan:** Dilengkapi visual *Social Card* profesional berisi logo Meteorit, judul, kategori bencana, lokasi, waktu kejadian, stempel tingkat bahaya (*Severity Status*), radius bahaya, rekomendasi aksi, sumber data asli, serta tautan peta (*Google Maps / OpenStreetMap*).

---

## 🖥 5. Modul Fitur Pengguna & Antarmuka Aplikasi

### 5.1 Pusat Data, Filter, & Fitur Pencarian

* **Sistem Pencarian Tingkat Lanjut:** Pengguna dapat mencari data historis secara spesifik berdasarkan rentang tanggal/jam, kategori bencana, negara, provinsi, kabupaten, koordinat, tingkat magnitudo, status gunung, hingga kata kunci tertentu.
* **Smart Filter:** Menyediakan filter cepat (Hari Ini, Kemarin, 7 Hari Lalu, 30 Hari Lalu, Bulan Ini, Tahun Ini).
* **Pusat Unduhan:** Kemampuan mengekspor data dalam bentuk format berkas `JSON`, `CSV`, `GeoJSON`, `Excel (XLSX)`, `WebP`, `PNG (Snapshot Peta)`, dan **Dokumen PDF**.
* > 🎨 **Spesifikasi Desain PDF:** Cetakan dokumen laporan PDF menggunakan aksen warna identitas "Meteorit" yang halus, bersih, dan tampak profesional untuk kebutuhan riset, edukasi, maupun dokumentasi resmi.



### 5.2 Fitur Aksesibilitas Modern

* **Voice-to-Text (Input Suara):** Memanfaatkan **Web Speech API** bawaan peramban sehingga pengguna dapat melakukan pencarian data bencana atau navigasi menu cukup dengan mengucapkan perintah suara.
* **Dashboard Visual:** Menyediakan halaman analitik global dan lokal Indonesia yang dilengkapi dengan diagram interaktif, grafik statistik lini masa (*timeline*), peringkat aktivitas bencana, dan visualisasi peta panas (*Heatmap*).

---

## 📈 6. Matriks Tingkat Bahaya (Severity Engine)

Setiap peristiwa bencana yang masuk ke dalam pipeline diklasifikasikan secara ketat untuk menentukan respon visual pada peta, format dokumen PDF, dan prioritas antrean notifikasi:

| Level Severity | Indikator Warna | Target Notifikasi & Aksi |
| --- | --- | --- |
| **INFO / LOW** | Hijau / Biru Muda | Hanya disimpan ke database (D1/R2) & pembaruan senyap pada grafik dashboard. |
| **MODERATE** | Kuning | Pembaruan pada layer peta, masuk antrean standar media sosial & RSS Feed. |
| **HIGH** | Oranye | Pembaruan peta, masuk antrean prioritas tinggi sosial media, dan pengiriman bot berkala. |
| **EXTREME / CRITICAL** | Merah / Ungu | **Bypass Antrean (Instant Push):** Langsung dikirim ke Telegram Channel, Discord, WhatsApp Channel, PWA Push Notification, dan memicu *Smart Warning System* bagi pengguna di radius bahaya. |

---

### 📋 Lembar Ceklis Penyelesaian Fitur (*Development Checklist*)

* [ ] Mengonfigurasi Cloudflare Workers, KV, D1, dan R2 Bucket.
* [ ] Membangun *Data Pipeline Core* (Fetch, Validasi, Normalisasi, Konversi Gambar ke WebP).
* [ ] Mengimplementasikan *Rules Engine* dan *Event Correlation Engine*.
* [ ] Membuat sistem antrean publikasi (*Publish Queue*) dan pembatas laju data (*Rate Limiter*).
* [ ] Integrasi Next.js dengan Web Speech API untuk fitur *Voice-to-Text*.
* [ ] Membuat pustaka *export* file (khususnya desain tata letak PDF bertema warna Meteorit halus).
* [ ] Implementasi sistem lokalisasi konten untuk mendukung penuh 7 bahasa.