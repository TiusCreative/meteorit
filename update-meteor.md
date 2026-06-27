Halo Antigravity, saya ingin kamu membantu saya melakukan refactoring pada aplikasi Next.js (App Router) yang terhubung dengan Firebase dan Cloudflare R2. Ada 2 tugas utama yang harus diselesaikan sekaligus agar aplikasi ini aman, efisien, dan bebas error.

TOLONG SELESAIKAN  TUGAS BERIKUT:

TUGAS 1: Mengubah Halaman Blog dan ensiklopedia Menjadi Server Component (Solusi Error Fetch & CORS)
Saat ini halaman detail blog memicu error "TypeError: Failed to fetch" karena menggunakan 'use client' (Client Component) dan mengambil data langsung dari Cloudflare R2 lewat browser, sehingga terkena blokir CORS dan boros kuota harian R2.
Ketentuan Tugas 1:
1. Ubah halaman utama blog (page.js) menjadi Server Component seutuhnya (hapus 'use client').
2. Lakukan proses fetch data dari Cloudflare R2 atau API endpoint di dalam fungsi async server sebelum komponen di-render agar bebas dari masalah CORS.
3. Gunakan fitur caching bawaan Next.js (misalnya menggunakan { next: { revalidate: 3600 } } atau cache: 'no-store') agar menghemat kuota request harian R2.
4. Jika ada bagian interaktif (seperti tombol click, useState, useEffect), pisahkan bagian itu ke dalam Client Component kecil terpisah lalu panggil di Server Component utama menggunakan props.

TUGAS 2: Mengubah Sistem Validasi Admin (Bukan Hardcoded Lagi)
Saat ini data email admin masih nempel (hardcoded) langsung di dalam kode aplikasi dan Firebase Security Rules dummy. Saya ingin mengubahnya agar berbasis data dinamis di Firestore.
Ketentuan Tugas 2:
1. Struktur Firestore: Sistem harus mengecek dokumen di dalam koleksi users dengan ID dokumen berupa UID pengguna (dari Firebase Auth). Di dalamnya terdapat field role: "admin".
2. Firebase Security Rules: Buatkan rancangan aturan (Rules) Firestore terbaru menggunakan fungsi bantuan isAdmin() yang membaca data dari: get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'.
3. Kode Dashboard Admin: Ubah kode pengecekan admin yang tadinya mencocokkan string email manual, menjadi proses getDoc ke koleksi users berdasarkan UID user setelah auth state terdeteksi. Jika field role bukan 'admin', tendang/redirect user ke '/unauthorized' atau tampilkan popup error akses.

di header admin muncul Admin
admin@meteorit-indonesia.com ini dari hardcode seharusnya email admin yang login
update firebase rules sesuai dengan kebutuhan app
————————————————————————————————————————————

* pastikan cron artikel dan cron ensiklopedia berjalan setiap hari
* olong di analisa mengapa gambar di ensiklopedia selalu sama tidak menggunakan gambar asli sesuai dengan nama jenis meteornya
untuk ensiklopedia  di tambah descrition lebih panjang minimal 3 paragrap, referensi, hasil penelitian
* untuk fitur pdf buat langsuung download pdf bukan print preview
* pada halaman admin ensiklopeda dan blog beri info jumlah artikel / ensiklopedia
* action edit dan delete
* buatkan agar card  banner ensiklopeda dan card artikel dapat di download vertical - tujuannya untuk di share di media sosial, yang di tersimpan ketika di download gambar dan keterngan di bawahnya, misalnya ensiklopedia nama, masa berat, tahun jatuh, koordinat

* periksa tombol picu artikel manual popup sukses tapi artikel tidak ada
——————————————————————————————————————

* buatkan setiap ada cron artikel baru dan ensiklopedia baru memberikan repot via telegram dengan 
TELEGRAM_BOT_TOKEN=8837048940:AAG5mGq0anX_EDJZgprmOJhwJIQWH02j2V4
TELEGRAM_CHAT_ID=5429818332
dengan rincian : jumalh totol artikel, jumlah total ensiklopedia, judul, Laporan error website
Notifikasi artikel gagal dibuat, Status cron job, Statistik harian

* buat setiap ada cron artikel dan ensiklopedia baru dikirim  Link otomatis ke channel dengan TELEGRAM_CHANNEL_ID=-1004429795655
* https://t.me/meteoritindonesia
* * link channel pasang di landing pages yang mudah di jangkau dan terapkan di footer 
—————————————————————————————————
 * pastikan semua data, ensiklopedia, artikel, gambar, forum.json, tentang kamim kontak tersimpan di R2
* sembunyikan semua PARIWARA GOOGLE, muncul nanti setelah ada persetujuan dari google
* sesiaon Benda Langit Hari Ini di landing pages pastikan selalu update