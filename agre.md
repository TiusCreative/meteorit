* tolong ubah warna text meteorit indonesia adi header menjadi warna putih terang

* Podcast Bahasa Indonesia
Artikel dan podcast baru terus dibuat.
RSS hanya menampilkan 300 hari terakhir.
Podcast yang lebih lama dari 300 hari dihapus dari R2 dan tidak muncul lagi di RSS.
Penyimpanan tetap terkendali.

Podcast Bahasa InggrisPodcast dibuat hanya selama 60 hari pertama untuk membangun koleksi.
Setelah 60 hari:
Tidak ada lagi podcast MP3 baru berbahasa Inggris.
Artikel bahasa Inggris, tetap diterbitkan.
File MP3 yang sudah dibuat tetap disimpan selamanya di R2.
RSS podcast bahasa Inggris tetap menampilkan seluruh episode yang sudah ada (atau hanya 60 hari terakhir jika diinginkan), tetapi tidak bertambah episode baru.

RSS podcast bahasa Inggris,bahasa mandarin dan spanyol tetap aktif, tetapi tidak ada episode podcast baru setelah hari ke-60.
Contohnya:
Hari 1–60: setiap hari ada podcast baru.
Hari ke-61 dan seterusnya: RSS tetap bisa dibuka, tetapi hanya berisi 120 episode (jika 2 episode/hari). Daftarnya tidak bertambah lagi.




————————————————————

* Saya sedang membangun aplikasi Web Agregator terpisah. Saya meminta Anda untuk membuatkan satu file API Route Next.js yang bertugas sebagai "pintu keluar" (export API) data artikel & statistik dari database Cloudflare D1/ R2
* semua isi artikel blog, apod artikel, ensiklopedia, artikel mars, artikel firebase, artikel peristiwa, artikel komet alam, dan artikel lainnya yang ada di D1/r2
* 

Berikut detail konfigurasi & kriteria teknisnya:

1. Stack & Framework:
   - Framework: Next.js (Gunakan App Router: app/api/agregator-data/route.js ATAU route.ts)
   - Database: Cloudflare D1 yang diakses via Cloudflare D1/ R2 REST API (menggunakan fetch).

2. Keamanan (Secret Key Check):
   - Wajib mengecek header request bernama "x-agregator-secret".
   - Bandingkan nilainya dengan Environment Variable: process.env.AGREGATOR_SECRET_KEY
   - Jika header tidak ada atau nilainya tidak cocok, kembalikan response JSON dengan status 401 (Unauthorized): { "error": "Akses Ditolak: Secret Key Salah" }.

3. Operasi Database Cloudflare D1:
   - Lakukan HTTP POST ke Cloudflare D1/R2 REST API endpoint:
     https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_ID}/query
   - Bawa header "Authorization: Bearer ${process.env.CLOUDFLARE_API_TOKEN}" dan "Content-Type: application/json".
   - Jalankan SQL query untuk:
     a) Mengambil 30 artikel terbaru dari tabel artikel (urutkan berdasarkan tanggal publikasi DESC).
     b) Menghitung total jumlah seluruh artikel yang ada di database.
* semua isi artikel blog

4. Detail Spesifik Aplikasi Ini:
   - Nama Sumber: "[NAMA APLIKASI: misal Theta indigo
   - Nama Tabel Artikel di D1: "[NAMA TABEL: misal articles]"
   - Kolom-kolom di Tabel: [Sebutkan kolom, misal: id, title, category, published_at, url, image_url]

5. Format Response JSON yang Diharapkan (jika berhasil/200 OK):
   {
     "source": "[NAMA APLIKASI]",
     "total_articles": 120,
     "articles": [
       {
         "id": "123",
         "title": "Judul Artikel...",
         "category": "Kategori...",
         "published_at": "2026-07-25T08:00:00Z",
         "url": "https://domain-aplikasi.com/artikel-123",
         "image_url": "https://pub-r2.domain.com/image.jpg"
       }
     ]
   }

6. Error Handling:
   - Bungkus seluruh operasi dalam try-catch block. Jika ada kegagalan query atau fetch ke D1, kembalikan status 500 dengan pesan error JSON yang jelas.

perubahan tolong di push ke github
resume tolong dijawab dengan bahasa indonesia
tuliskan variable baru untuk agretor dan link agretor

——————————————————————
jangan ubah lokasi git
untuk deploy aplikasi menggunakana deploy —prod tidak lewt github
untuk podcast melewawti github action https://github.com/TiusCreative/meteorit.git
