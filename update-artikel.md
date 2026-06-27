* buatkan di admin console daftar artikel komet - setiap artikel yang dibuat terkirim ke  telegram channel id dan repot ke telegram id

perbaiiki tombol picu artikel komet  popup berhasil sucses tapi artikel tidak ada / tidak terbit di halaman komet

————————————————————————————————
* * tambahakn apikey groq dan openrouter untuk backup jika apikey utama tidak jalan / limit habis
* apikey openrouter=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
* apikey groq= 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
Tuliskan apikey backup di .env.local
*——————————————————————————————————————
* buatkan di admin console daftar artikel plane mars dan tombol picu manualnya
* atur jadwal penerbitannya di vercel.json agar teratur dan rapih
* buatkan halaman khusus untuk membuat cron tentang planet mars - lengkap dengan fitur voice to text, share media sosial, save pdf - seo dengan optimal - setiap terbit kirim ke telegram channel dan report ke telegram id

Tugas Anda adalah menulis artikel edukasi sains tentang Planet Mars sebanyak 300-500 kata dalam Bahasa Indonesia yang santai tapi berbobot untuk web Meteorit Indonesia.dengan paragrap yang rapih

Topiknya harus berganti-ganti setiap hari, pilih salah satu secara acak: contoh :
1. Fakta Unik Mars (Contoh: Mengapa Mars berwarna merah, ukuran Olympus Mons gunung terbesar di tata surya).
2. Kabar Penjelahan (Mengulas misi robot Curiosity, Perseverance, atau helikopter Ingenuity milik NASA).
3. Cuaca & Geologi Mars (Bahas badai debu raksasa, suhu ekstrem Mars, atau kandungan air es di kutub Mars).
4. Masa Depan Manusia (Bahas tantangan astronot jika suatu saat tinggal di Mars).

Gunakan Open Graph untuk SEO, format artikel dengan rapi (gunakan tag HTML seperti <h2>, <p>), dan sertakan URL gambar resmi dari NASA Mars Rover API


—————————————————————————————————————————


* halaman astronot

buatkan di admin console daftar astronot - buat juga agar tombol picu membuat daftar astronot yang perna ke iss dan yang akan datang - keterangan ada di bawah

buat di landing pages info astronot - bagian bawah hero sesioan sebelah ASTEROID DEKAT BUMI HARI INI


Mengenai cakupan datanya, pilihan terbaik untuk struktur database dan pengalaman pengguna (*user experience*) website Anda adalah menggabungkan ketiganya, namun memisahkan mereka berdasarkan status/kategori (tab yang berbeda).

Berikut adalah rekomendasi arsitektur halaman profil astronot agar informasi di website Meteorit Indonesia menjadi super lengkap, rapi, dan tidak membingungkan pengunjung:

### 🗂️ Rekomendasi Struktur Halaman (Sistem Tab / Filter)
Jangan mencampur semua astronot ke dalam satu daftar panjang. Buatlah menu navigasi kecil (*Sub-Tab*) di bawah teks deskripsi utama Anda menggunakan pembagian seperti ini:
#### Tab 1: 🛰️ Sedang di Antariksa (Halaman Utama / *Default*)
 * Fungsi: Ini adalah halaman yang sekarang sedang Anda buka di gambar (menampilkan teks *(9 Kru)*).
 * Isi: Hanya menampilkan astronot, kosmonot, atau taikonaut yang detik ini juga benar-benar sedang melayang di orbit Bumi (berdasarkan *real-time match* dari API Open Notify atau The Space Devs yang kita bahas kemarin).


#### Tab 2: 🚀 Misi Mendatang (*Upcoming*)
 * Fungsi: Menampilkan astronot yang sudah terpilih dan dijadwalkan akan meluncur dalam waktu dekat (misalnya kru untuk misi SpaceX Crew berikutnya atau misi Artemis NASA ke Bulan).
 * Efek ke Pengunjung: Membuat website Anda terasa sangat visioner dan selalu memberikan informasi masa depan yang dinanti-nanti komunitas astronomi.
buat artikel astonot 3 paragrap dengan penjabaran lebih detail

#### Tab 3: 🏡 Pahlawan Antariksa (*Alumni / Returned*)
 * Fungsi: Memuat database astronot yang misinya baru saja selesai dan sudah berhasil mendarat kembali dengan selamat ke Bumi, atau tokoh-toktor legendaris terdahulu.

 * Efek ke Pengunjung: Pengunjung bisa membaca riwayat sejarah eksperimen apa saja yang sudah mereka lakukan selama di atas sana.
### 💡 Mengapa Menggabungkan Ketiganya Jauh Lebih Baik?

tab4: setiap artikel yang dibuat terkirim ke  telegram channel id dan repot ke telegram id

 1. Efisiensi Penggunaan AI & *Cron Job* Anda: Jika Anda hanya menampilkan astronot yang ada di angkasa saja, maka setiap kali mereka pulang ke Bumi (misalnya setelah 6 bulan), Anda harus menghapus data artikel/profil mereka dari database R2. Sayang sekali, bukan? Padahal AI Anda sudah bekerja keras menyusun biografinya. Dengan adanya sistem arsip (*Returned*), Anda cukup mengubah status di database dari status: "active" menjadi status: "returned". Konten tersebut akan tersimpan abadi dan terus menyumbang *traffic* SEO dari Google.

ubah kata di sesion manusai di angkasa
 2. Edukasi Istilah Sains yang Akurat (Sesuai Teks Anda): Di teks deskripsi Anda, Anda sudah menuliskan kata "kosmonot" (sebutan Rusia) dan "taikonaut" (sebutan Tiongkok) dengan sangat tepat. Jika Anda membuka database untuk misi masa lalu dan masa depan, Anda bisa memberikan filter tambahan berdasarkan asal negara (AS, Rusia, Tiongkok, Eropa, Jepang) sehingga database Anda menjadi ensiklopedia luar angkasa terlengkap di Indonesia.
### 🛠️ Langkah Teknis Selanjutnya

Anda bisa menggunakan properti status dari API *The Space Devs* untuk otomatis mengelompokkan ini ke dalam database R2 Anda:
 * status: 1 ➡️ Masuk ke Tab Sedang di Antariksa
 * status: 2 ➡️ Masuk ke Tab Misi Mendatang
 * status: 3 atau 4 ➡️ Masuk ke Tab Sudah Kembali/Pensiun
Dengan cara ini, halaman "Manusia di Antariksa" Anda tidak akan pernah sepi konten, melainkan menjadi pusat data profil astronot paling dinamis!

* semua tersimpan di R2 json

---------------------------------------------------------

Target: Ubah seksi "Dukung Eksplorasi Sains / Donasi" di Landing Page menjadi layout 2 kolom yang responsif. Kolom kiri tetap mempertahankan komponen Donasi yang sudah ada, sementara Kolom Kanan akan diubah menjadi komponen interaktif "Earth Monitoring Simulator & Live Data" menggunakan data JSON dari BMKG dan RE-Atlas.

Tech Stack: React/Next.js, Tailwind CSS, Lucide React (untuk ikon), dan Fetching Client-side (atau SWR jika ada).

Spesifikasi Komponen Baru (Kolom Kanan):
1. Desain UI: Gunakan tema Dark Space (latar belakang abu-abu sangat gelap/hitam, teks putih/abu-abu terang, dengan aksen efek glassmorphism backdrop-blur-md bg-white/5 border border-white/10).
2. Tab Sistem Interaktif (Simulator): Buat navigasi mini-tab di dalam komponen ini untuk berganti tampilan tanpa pindah halaman:
   - Tab 1: 🌋 Gempa Terkini (Live dari JSON BMKG: https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json). Tampilkan parameter: Magnitudo, Kedalaman, Wilayah, Potensi Tsunami (beri warna merah/hijau dinamis), dan waktu update.
   - Tab 2: 🌧️ Info Cuaca & Hujan. Tampilkan visualisasi kartu cuaca kota besar (bisa di-mock atau membaca koordinat setempat) lengkap dengan status visual intensitas hujan (Rendah/Sedang/Tinggi).
   - Tab 3: ☀️ Energi Angin & Surya. Tampilkan simulator angka potensi (misal: "Radiasi Matahari: 4.8 kWh/m²/hari - Sangat Baik untuk Panel Surya").
3. Aturan Keamanan & Legalitas:
   - Jangan memuat library peta yang berat seperti Leaflet langsung di Landing Page agar performa web tetap kilat. Gunakan visualisasi berbasis teks, indikator bar (Tailwind progress bar), dan ikon-ikon interaktif sebagai "Simulator".
   - Cantumkan teks kredit/atribusi kecil di pojok bawah komponen: "Data live disediakan oleh BMKG & ESDM RE-Atlas".
4. Hubungan dengan API NASA: Pastikan kode pemanggilan (fetch) JSON BMKG ini dilakukan secara independen (client-side) atau membaca dari API route lokal Vercel yang membaca Cloudflare R2, sehingga sama sekali tidak mengganggu atau memakai kuota rate-limit NASA_API_KEY.

Gunakan Thermometer Progress Bar: Jangan hanya menampilkan teks angka. Gunakan Tailwind CSS untuk membuat visual batang termometer mini yang warnanya berubah dinamis: 
​Suhu < 22°C ➡️ Batang berwarna Biru (Dingin/Sejuk).
​Suhu 23°C – 30°C ➡️ Batang berwarna Hijau/Kuning (Normal).
​Suhu > 31°C ➡️ Batang berwarna Oranye/Merah (Panas).

Agar data suhu ini selaras dengan tema utama website Anda (Meteorit & Antariksa), Anda bisa meminta AI untuk membuat logika korelasi otomatis pada komponen simulator Anda.
Contoh visualisasi teks yang dihasilkan pada widget Landing Page:
Suhu Udara Yogyakarta Malam Ini: 21°C (Cerah & Dingin)
💡 Tips Astronomi: Suhu dingin dan langit cerah malam ini sangat ideal untuk pengamatan bintang (stargazing) karena distorsi atmosfer cenderung lebih rendah. Siapkan jaket Anda!
​

Tuliskan kode perubahannya secara modular, rapi, dan pastikan layout donasi di sebelah kirinya tetap proporsional serta tidak rusak di layar HP (otomatis menjadi 1 kolom vertikal saat dibuka di mobile).

——————————————————————————
Notifikasi Instan / Real-Time (Wajib Langsung Dikirim) via telegram channel 

​Gempa Bumi Magnitudo \ge 5.0: Ini adalah standar keselamatan. Setiap ada baris data baru dari autogempa.json yang mencatat kekuatan di atas atau sama dengan M 5.0, bot langsung mengirim pesan darurat.
​Gempa Berpotensi Tsunami: Apapun nilai magnitudonya, jika status Potensi pada JSON bertuliskan "Berpotensi tsunami", notifikasi harus langsung meluncur saat itu juga.
​Peringatan Dini Cuaca Ekstrem (Badai/Siklon): Jika BMKG merilis data nowcast tentang cuaca buruk skala besar, Anda bisa memicu notifikasi push ke PWA agar pengguna yang ingin melihat bintang tahu bahwa malam itu langit total tertutup badai.

​2. Notifikasi Berkala (Cukup 1 Kali Sehari / Terjadwal) via telegram channel
​Rangkuman Kondisi Langit Indonesia (Setiap Sore, Misal Jam 17.00): Daripada mengirim cuaca per jam, buat cron sore hari yang merangkum wilayah mana saja yang diprediksi "Cerah/Cerah Berawan" di malam hari. 
​Contoh Pesan: "🌌 Prediksi Langit Malam Ini: Wilayah Jawa Tengah dan DIY terpantau cerah berdasarkan radar BMKG. Waktu terbaik untuk mengamati konstelasi bintang dan pergerakan ISS! Cek simulator peta cuaca lengkapnya di PWA kita: [Link PWA]"


​#### 3. Notifikasi Mingguan (Cukup 1 Kali Seminggu, Misal Hari Sabtu) via telegaam channel
​Rangkuman Potensi Energi Hijau Nasional: Gunakan AI untuk membaca data tren dari RE-Atlas ESDM selama seminggu terakhir. 
​Contoh Pesan: "☀️ Update Energi Mingguan: Pekan ini Nusa Tenggara Barat (NTB) mencatat indeks radiasi matahari tertinggi mencapai 5.2 kWh/m²/hari. Sangat optimal untuk aktivasi panel surya..."
"
​💡 Tips Eksekusi untuk Anda:
​Saat menyuruh AI membuat skrip cron untuk Telegram, berikan logika pembanding (conditional statement).

-----------------------------------------------

*buatkan di halaman admin console untuk memantau google analityc
* buatkan file robot.txt
agar bisa di akses oleh google analitity dan perayapan tidak di firebase agar hemat kuota firebase tapi perayapan di R2
* buatkan file sitemap.xlm dan masukkan ke dalam folder public
* buatkan di halaman admin console, halaman untuk mengisi kode google tag, google
* buatkan editor untuk mengisi head dan body kode google console, google tag, google analytic dan lainnya sehingga editor muat banayk kode tag - intergrasikan

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X4F6EB07D4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-X4F6EB07D4');
</script>

 -----------------------------------------------'
 * buatkan agar ketika ada donasi dan berhasil kirim notipikasi ke telegram ID

 -------------------------------------------------

 
ubah iklo link sosial media dengan gambar ikon sebenernya