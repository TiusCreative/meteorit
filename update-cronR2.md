# Migrasi Cron Artikel ke Cloudflare R2 dan Pembuatan Mini App Cuaca

Mengubah arsitektur penulisan artikel otomatis dari Firebase Firestore langsung ke Cloudflare R2 untuk menghindari limitasi kuota (RESOURCE_EXHAUSTED), memperbarui pembacaan frontend agar efisien, menambahkan fitur-fitur canggih pada panel simulator cuaca di beranda, serta membuat Mini App Cuaca terpisah dengan penyimpanan metadata di R2.

## Peninjauan Pengguna Diperlukan
Buatkan PWA SENDIRI UNTUK MINAPP CUACA


> [!IMPORTANT]
> - **Variabel Lingkungan (Environment Variables)**: Seluruh API Key (OpenWeather, NASA, dan R2) akan diambil dari variabel lingkungan Vercel. Kredensial Cloudflare R2 di `.env.local` sudah lengkap, sehingga tidak memerlukan pengaturan tambahan dari Anda.
> - **Penghapusan Dependensi Firestore untuk Artikel**: Firestore tidak akan lagi digunakan untuk menulis artikel baru dari cron job. Seluruh artikel baru akan langsung disimpan ke R2 dan cache list artikel (`posts.json`) juga diperbarui secara in-memory. Artikel lama yang ada di Firestore masih didukung sebagai fallback di frontend jika R2 gagal diakses.

## Pertanyaan Terbuka

* artikel lama yang tersimpan di firebase buat syncron  tersimpan di R2, , buatkan kode izin camera untuk unji coba local menggunakan hp, untuk aut login, web push dan lainnya selain database tetep menggunakan firebase

> 2. **Peta Cuaca Interaktif**: Kami akan menggunakan Leaflet untuk menampilkan peta cuaca interaktif dengan layer radar awan/hujan dan suhu.


semua notip cuaca di kirm ke channel telegram
tambahkan link url gambar setiap artikel di rss.xml
## Rencana Perubahan

---

### 1. Backend: Cron Jobs & RSS (`src/app/api/cron/...`)

Kita akan mengubah semua cron job yang menghasilkan artikel otomatis agar menulis langsung ke Cloudflare R2 tanpa menyentuh Firestore.

#### [MODIFY] [blog/route.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/cron/blog/route.ts)
- Hapus ketergantungan Firestore (`adminDb.collection('articles').doc(docId).set(...)`).
- Ambil berkas indeks artikel saat ini dari R2 `data/blog/posts.json`. Jika belum ada, baca dari public URL atau gunakan array kosong `[]`.
- Simpan konten detail artikel utuh sebagai file JSON mandiri di `data/blog/articles/${docId}.json`.
- Tambahkan metadata artikel baru ke awal array daftar artikel (in-memory) dan simpan kembali ke `data/blog/posts.json` di R2.
- Panggil rebuild RSS feed yang baru.

#### [MODIFY] [komet/route.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/cron/komet/route.ts)
- Lakukan penyesuaian yang sama seperti di atas agar komet/asteroid baru ditulis ke `data/blog/articles/${docId}.json` dan di-prepend ke cache `data/blog/posts.json` di R2 tanpa Firestore.

#### [MODIFY] [eonet/route.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/cron/eonet/route.ts)
- Sesuaikan agar artikel kejadian alam EONET baru disimpan ke R2.

#### [MODIFY] [mars/route.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/cron/mars/route.ts)
- Sesuaikan agar artikel planet Mars baru disimpan ke R2.

#### [MODIFY] [fireball/route.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/cron/fireball/route.ts)
- Sesuaikan agar artikel laporan fireball baru disimpan ke R2.

#### [MODIFY] [rss.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/lib/rss.ts)
- Ubah `rebuildRSSFeedHelper` agar membaca data artikel dari cache R2 (`data/blog/posts.json`) alih-alih melakukan query ke Firestore `articles`.
- **Fitur Baru**: Tambahkan tag `<enclosure url="${imageUrl}" type="image/jpeg" length="0" />` pada setiap `<item>` di RSS untuk menyertakan gambar artikel.

---

### 2. Frontend: Halaman & Komponen Artikel (`src/app/(main)/blog/...`)

#### [MODIFY] [page.tsx (Detail Artikel)](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/(main)/blog/[id]/page.tsx)
- Ubah pencarian artikel tunggal. Alih-alih mengunduh seluruh `posts.json` catalog dan mencari di dalamnya, sistem akan langsung melakukan fetch ke file JSON detail R2: `${R2_URL}/data/blog/articles/${id}.json`.
- Jika gagal/tidak ditemukan di R2, sistem akan melakukan fallback ke Firestore `articles` untuk kompatibilitas ke belakang (backwards compatibility).

#### [MODIFY] [translate/route.ts (API Translate)](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/articles/translate/route.ts)
- Ubah sistem penyimpanan cache terjemahan. Alih-alih memperbarui Firestore (`docRef.update(...)`), sistem akan membaca JSON artikel dari R2 `data/blog/articles/${id}.json`, menambahkan/memperbarui objek translasi di dalam JSON tersebut, lalu mengunggah kembali berkas JSON tersebut ke R2.
- Sistem juga akan memperbarui item di dalam list `data/blog/posts.json` agar terjemahannya konsisten.

#### [MODIFY] [i18n.ts](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/lib/i18n.ts)
- Tambahkan terjemahan untuk tautan navigasi baru: `navMiniApp` dan `navWeather` di seluruh bahasa pendukung.

---

### 3. Simulator Cuaca & Mini App Baru

#### [MODIFY] [EarthMonitoringSimulator.tsx](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/components/EarthMonitoringSimulator.tsx)
- Tambahkan prakiraan cuaca 7 hari ke depan dengan mengambil data harian dari Open-Meteo API.
- Tambahkan formulir input kustom untuk nama daerah & koordinat manual.
- Sediakan pilihan tanggal untuk melihat detail perkiraan cuaca di hari tersebut.
- Implementasikan estimasi ancaman/bencana (badai, erupsi gunung, tsunami) berbasis cuaca dan data gempa BMKG.
- **Efek Visual Dinamis**: Buat animasi berbasis HTML5 Canvas untuk mensimulasikan kondisi cuaca secara dinamis (awan berarak, hujan jatuh, dan sambaran petir real-time).
- **Mode AR Cuaca**: Buat tombol mode AR yang membuka overlay kamera real-time dengan teks melayang (suhu, angin, koordinat, dan kompas) di layar setelah meminta izin akses kamera.
- **Push Notification / Peringatan Cuaca Ekstrem**: Tampilkan modal/alert peringatan otomatis jika mendeteksi anomali cuaca ekstrem (suhu > 36°C, angin kencang, curah hujan tinggi).

#### [NEW] [page.tsx (Weather Route)](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/cuaca/page.tsx)
- Daftarkan route baru `/cuaca` yang merender komponen utama `WeatherMiniApp`.

#### [NEW] [WeatherMiniApp.tsx (Komponen Cuaca Premium)](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/components/cuaca/WeatherMiniApp.tsx)
- Merupakan mini app cuaca lengkap dengan desain premium (glassmorphic dark mode).
- Memiliki tab Peta Cuaca Interaktif menggunakan Leaflet dengan layer OpenWeatherMap/Open-Meteo.
- Memiliki fitur **AI Cuaca Prediktif**: Prediksi tren suhu 3-5 hari ke depan menggunakan pola historis data cuaca.
- Memiliki fitur **Asisten Suara**: Penerimaan pertanyaan suara (Speech-to-Text) dan respons ucapan suara natural (Text-to-Speech) menggunakan Web Speech API.
- Memiliki fitur **Gamifikasi**: Input pelaporan kondisi cuaca dari komunitas (misal "Hujan deras di Bekasi") yang memberikan poin kepada pengguna.
- Memiliki fitur **Integrasi Kalender & Rekomendasi Aktivitas**: Integrasikan daftar kegiatan harian user dengan saran aktivitas sesuai perkiraan cuaca aktual.
- Memiliki fitur **Laporan Komunitas**: Menampilkan feed postingan laporan cuaca terbaru beserta unggahan foto langit/kondisi sekitar dari pengguna lain.
- Hubungkan metadata gamifikasi dan laporan komunitas ke Cloudflare R2 agar persisten tanpa Firestore.

#### [NEW] [route.ts (API Metadata Cuaca)](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/app/api/cuaca/r2-metadata/route.ts)
- Endpoint API serverless untuk membaca dan menyimpan data gamifikasi, laporan komunitas, dan riwayat cuaca secara in-memory langsung ke bucket Cloudflare R2 (`data/weather/metadata.json`).

#### [MODIFY] [Footer.tsx](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/src/components/Footer.tsx)
- Tambahkan link navigasi "Mini App" (`/miniapp`) dan "Cuaca & Langit" (`/cuaca`) di kolom menu utama footer.

---

### 4. Dokumentasi Tambahan

#### [NEW] [cors-r2-guide.md](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/cors-r2-guide.md)
- Panduan CORS R2 terbaru yang harus disalin ke Cloudflare dashboard untuk mengizinkan fetch langsung dari browser user.

#### [NEW] [firebase-rules-ref.json](file:///Users/tius/Documents/Data Tius/Meteorit/meteorit-indonesia/firebase-rules-ref.json)
- Referensi rules Firebase jika ada perubahan/penurunan penggunaan koleksi `articles`.

## Rencana Verifikasi

### Pengujian Otomatis (Lokal)
- Jalankan `npm run dev` untuk memastikan aplikasi Next.js berhasil dikompilasi secara lokal.
- Lakukan fetch mandiri pada API cron `/api/cron/blog` menggunakan parameter bypass untuk melihat apakah artikel dan file JSON sukses dibuat di R2.

### Pengujian Manual
1. Buka halaman `/blog` dan periksa apakah daftar artikel sukses dimuat dari R2.
2. Buka salah satu artikel di `/blog/[id]` untuk menguji fetch file detail JSON secara langsung dari R2.
3. Ubah bahasa situs dan pastikan translation berjalan on-the-fly serta menyimpan cache terjemahan di R2.
4. Buka halaman `/cuaca` (Weather Mini App) di browser mobile/desktop:
   - Tes pencarian koordinat dan daerah.
   - Uji asisten suara cuaca dan pastikan Speech API berfungsi.
   - Tes pelaporan cuaca komunitas dan gamifikasi, pastikan data tersimpan di R2.
   - Uji mode AR cuaca dan pastikan kamera terbuka dengan overlay data cuaca.
   - Periksa keindahan animasi cuaca dinamis di Canvas.


Live Data Bumi untuk Komunitas Langit Malam landing pages dan miniapp tambahkan fitur
- untuk melihat data cuaca satu minggu kedepan dan di lengkapi dengan custom input nama daerah dan titik koordinate
- dapat memilih tanggal tertentu untuk melihat kondisi cuaca
- dapat melihat estimasi dan simulasi seperti adanya ancaman badai, gunung meletus, stunami dan bencana lainnya dari api key wheather nasa
- buatkan animasi  efek visual dinamis (awan bergerak, hujan turun, petri menyabar)

Animasi Cuaca Real-Time
Gunakan efek visual dinamis (awan bergerak, hujan turun, petir menyambar) sesuai kondisi aktual. Bisa pakai WebGL atau Lottie agar ringan di web dan mobile.Mode AR Cuaca
Pengguna arahkan kamera ke langit, lalu muncul overlay info suhu, arah angin, dan prakiraan hujan langsung di layar 
pastika izin camera aktip di hp

— mirip “cuaca di dunia nyata”.Peringatan Cuaca Ekstrem
Push notification otomatis kalau suhu ekstrem, hujan lebat, atau potensi banjir terdeteksi di radius tertentu.Gamifikasi Cuaca

Pengguna dapat poin setiap kali melaporkan kondisi cuaca aktual (misalnya “hujan ringan di Bekasi”). Data ini bisa memperkaya akurasi crowdsourced.

Statistik Harian Personal
Tampilkan grafik suhu, kelembapan, dan aktivitas pengguna (misalnya “hari paling panas minggu ini” atau “hari paling berangin”).


Peta Cuaca Interaktif
Gunakan layer peta dengan radar hujan, arah angin, dan suhu per wilayah. Bisa zoom dan klik area untuk detail.Laporan Komunitas
Pengguna bisa kirim foto langit atau kondisi sekitar, lalu muncul di feed lokal. Ini bikin aplikasi terasa seperti “komunitas pengamat cuaca”.Integrasi Kalender & Aktivitas
Misalnya, kalau pengguna punya jadwal olahraga sore, aplikasi otomatis kasih saran: “Cuaca panas, siapkan air minum lebih.”


AI Cuaca Prediktif  
  Gunakan model machine learning untuk memprediksi tren suhu dan hujan 3–5 hari ke depan berdasarkan pola historis.

- Asisten Suara Cuaca  
  Pengguna bisa tanya “Bagaimana cuaca di Cikarang sore ini?” dan aplikasi menjawab dengan suara natural.

- Saran Aktivitas Berdasarkan Cuaca  
  Misalnya: “Cuaca cerah, cocok untuk jogging” atau “Hujan ringan, waktu ideal untuk baca renungan di rumah.”

- semua medatada di simpan di R2
——————————————————
buatkan miniapp cuaca terpisah dengan  fitur lengkap
* buatkan link appmini di footer
* buatkan link cuaca di footer
tulis planning dna repot dalam bahasa indonesia

