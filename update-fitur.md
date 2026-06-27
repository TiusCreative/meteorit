Masterplan Pengembangan Website yang telah disederhanakan dan disusun ke dalam format Project Management Canvas (Lean Canvas Proyek). Format ini dirancang khusus agar terstruktur, padat, dan bisa langsung Anda salin (*copy-paste*) ke dalam catatan proyek atau repositori kode Anda.

# 🌌 PROJECT CANVAS: METEORIT INDONESIA V2
Daftar Perubahan Layout & Integrasi Data API NASA + Pihak Ketiga
### 1. TUJUAN UTAMA & VALUE PROPOSITION
 * Visi: Menjadi portal *Live Space Dashboard* berbahasa Indonesia pertama yang memadukan edukasi meteorit dengan data antariksa *real-time*.
 * Solusi UX: Menyajikan data kompleks NASA ke dalam komponen UI yang bersih (*clean*), minim tekstur, cepat, dan tidak membuat halaman utama menjadi terlalu panjang (*anti-cluttered*).

### 2. ARSITEKTUR DATA (BACKEND CONTROL)
 * Sistem Otomasi: Vercel Cron berjalan 2x sehari (pukul 00:00 dan 12:00 WIB).
 * Alur Data: Fetch API Luar → Translasi Otomatis ke Bahasa Indonesia → Simpan sebagai objek tunggal di Cloudflare R2 JSON (space-dashboard-data.json).
 * Dampak Kecepatan: *Frontend* (Next.js/Vercel) hanya membaca 1 file JSON statis dari R2, menjamin performa web tetap berada di angka 90–100 pada *Lighthouse Score*.

### 3. STRUKTUR NAVIGASI (HEADER BAR PROPOSIONAL)
Ubah susunan menu atas agar lebih universal namun tetap ramping:
[LOGO METEORIT ID] ──── Home ──── Meteorit & Komet ──── Langit Malam ──── Misi Antariksa ──── Blog*Note: Menu "Meteorit & Komet" akan menggabungkan fitur Ensiklopedia lama dengan data Komet baru lewat sistem Sub-menu/Tabs.*

### 4. REVISI TATA LETAK LANDING PAGE (SKELETON LAYOUT)
#### [SECTION 1: HERO SECTION - REFRESH]
 * Visual: Pertahankan aset visual meteorit yang sudah Anda miliki sekarang.
 * Penambahan (Mikro-Data Ticker): Tepat di bawah tombol CTA utama, tambahkan baris teks berjalan/statis berukuran kecil yang bersumber dari R2 JSON.
   * *Copywriting:* 📊 STATUS HARI INI: Ada 11 manusia di luar angkasa | 🛰️ Satelit ISS sedang melintas di atas Samudra Hindia.
#### [SECTION 2: DAILY VISUAL (APOD & EPIC)]
 * Visual: Pertahankan section APOD yang sudah Anda buat, namun buat layoutnya menjadi Grid 2 Kolom yang sejajar secara horizontal di desktop:
   * *Kolom Kiri:* Gambar APOD hari ini + Teks Narasi Terjemahan.
   * *Kolom Kanan:* Monitor Satelit EPIC (Foto Bumi Terbaru) + Metadata Koordinat.
#### [SECTION 3: SPACE MISSION CONTROL (NEW FEATURE GRID)]
*Diletakkan tepat setelah APOD dan sebelum Ensiklopedia. Menggunakan Grid 3 Kolom setinggi 1 layar laptop untuk menghemat ruang.*
+------------------------------------+------------------------------------+------------------------------------+
|       KOLOM 1: JADWAL ROKET        |        KOLOM 2: LIVE ISS           |      KOLOM 3: DATA ASTRONOT        |
|                                    |                                    |                                    |
| * Teks: "Peluncuran Terdekat"      | * Peta Mini (Leaflet.js - Dark)    | * Angka Besar: "11 Orang"          |
| * Countdown Timer (Live)           | * Titik Koordinat Real-time        | * List Nama Astronot (Scrollable)  |
| * Badge Agensi (SpaceX/NASA/ISRO)  | * Menampilkan jalur lintasan       | * Nama Wahana (ISS/Tiangong)       |
+------------------------------------+------------------------------------+------------------------------------+#### [SECTION 4: UPGRADE ENSIKLOPEDIA (METEORIT & KOMET)]
 * Perubahan: Tambahkan komponen *Tab Toggle* di atas list ensiklopedia Anda yang sekarang.
   * [ Tab 1: Jenis Meteorit (Data Lama) ] | [ Tab 2: Komet & Asteroid Melintas (Data Baru NASA NeoWs) ]
 * Jika Tab 2 diklik, tampilkan daftar batuan luar angkasa yang akan melintas dekat Bumi minggu ini beserta estimasi ukuran dan jarak amannya dalam bahasa Indonesia.

#### [SECTION 5, 6, 7: DONASI, BLOG, SUBSCRIBER]
 * Visual: Pertahankan struktur yang sudah ada di web lama Anda karena posisinya di bagian bawah *landing page* sudah ideal untuk retensi pengguna.
### 5. HALAMAN ROUTE BARU: PETA LANGIT MALAM (/langit-malam)
 * Jangan memuat fitur peta bintang di halaman utama agar *loading-time* tidak drop.
 * Buat halaman khusus yang bersih. Isinya berupa modul peta bintang interaktif (menggunakan API eksternal seperti *AstronomyAPI*). Pengunjung cukup mengizinkan akses lokasi (GPS) atau mengetik nama kota mereka di Indonesia untuk memunculkan konstelasi bintang malam itu.

### 6. ATURAN LISENSI & ATRIBUSI (FOOTER)
Tambahkan teks kecil di bagian footer website untuk mematuhi aturan penggunaan API gratis:
 * Data provided by NASA Open APIs, The Space Devs, and Open Notify.
 * Khusus untuk APOD, pastikan kode Anda mengekstrak kolom copyright dari JSON NASA untuk memunculkan nama fotografer di bawah gambar secara otomatis.

* Buatkan halaman visi dan misi dari web ini

* Perbarui syarat dan ketentuan berlalu dan sebutkan menggunakan lisence nasa / jika di aturannya Harus seperti itu
