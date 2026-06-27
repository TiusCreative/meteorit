
di hero sesion ada ticker berjalan, mengapa tidak bisa di klik atau hanya info saja?
—-----------------------------------------------------------------------------
perbaiki header yang double ketika landing pages di scrool
buatkan tombol scrool to top

—-----------------------------------------------------------------------------
card / sesion peluncuran terdekat
perbaiki agar data / info peluncuran akan datang muncul
saat menembak API The Space Devs (Launch Library 2), pastikan Anda menggunakan endpoint untuk Upcoming Launches, bukan Previous/All Launches.
Batasi hasilnya cukup mengambil 1 data teratas (limit=1) agar otomatis menampilkan roket yang paling dekat jadwal meluncurnya di masa depan.
Endpoint yang benar: https://ll.thespacedevs.com/2.2.0/launch/upcoming/

—-----------------------------------------------------------------------------
sesion / card Monitor Satelit EPIC

buatkan  halaman route internal baru di web Anda (misalnya /monitoring-epic).

Cantumkan Sumber Data (Kredit): Di bagian bawah halaman, cukup tuliskan teks kecil seperti: "Sumber data dan gambar: NASA Earth Polychromatic Imaging Camera (EPIC)".
Cantumkan Sumber Data (Kredit): Di bagian bawah halaman, cukup tuliskan teks kecil seperti: "Sumber data dan gambar: NASA Earth Polychromatic Imaging Camera (EPIC)"

sehingga foto bumi selalu muncul dan live
tujuannya agar monitor berada di dalam halaman web sehingga user tidak meninggal web


—-------------------------------------------------------------------------------------------



card / sesion live is tracker perbaiki agar memunculkan peta digital

 Mengapa "Live ISS Tracker" Menampilkan "Peta tidak tersedia"?
Fitur pelacak satelit (ISS) membutuhkan komponen peta digital yang berjalan di sisi browser pengunjung (client-side) untuk merender visual petanya secara real-time.

Penyebab: Anda mungkin belum memasang pustaka (library) peta di dalam kode frontend Anda, atau kode JavaScript yang mengambil koordinat lintang/bujur (Latitude/Longitude) dari API belum terhubung ke peta tersebut.

Solusinya: Gunakan Leaflet.js (pustaka peta gratis, sangat ringan, dan open-source). Anda tidak perlu melempar pengguna ke link luar. Cukup masukkan skrip Leaflet ke dalam kotak hitam tersebut.
Hubungkan fungsi fetch dari API ISS (seperti https://api.wheretheiss.at/v1/satellites/25544) yang berjalan setiap 5 detik (seperti keterangan di web Anda).
Setiap kali API mengirim koordinat baru, perbarui posisi ikon satelit di atas peta Leaflet tersebut.

Tugas Anda:
1. Buat komponen peta menggunakan Leaflet.js (atau react-leaflet jika menggunakan React) dengan tema peta gelap (Dark Mode tile layer, misalnya dari CartoDB Positron Dark Matter atau sejenisnya).
2. Buat fungsi fetch ke API koordinat ISS gratis: https://api.wheretheiss.at/v1/satellites/25544 atau http://api.opennotify.org/iss-now.json
3. Gunakan useEffect/setInterval agar fungsi fetch ini berjalan otomatis memanggil koordinat terbaru setiap 5 detik.
4. Ambil data "latitude" dan "longitude" dari respons JSON, lalu update posisi marker (gunakan ikon satelit custom jika memungkinkan) di atas peta tanpa me-refresh seluruh halaman web.
5. Pastikan peta pas di dalam ukuran container kotak (responsive width/height) yang sudah ada di UI saya.

Tuliskan kode integrasi peta Leaflet.js dan fetch koordinatnya secara mendetail.


—-----------------------------------------------------------------------------












card / sesion Manusia di Antariksai agar memunculkan data real time


3. Mengapa Data "Manusia di Antariksa" Kosong?

Memperbaiki Fitur Data Manusia di Antariksa
Target: Perbaiki fungsi pemetaan data (data mapping) untuk memunculkan jumlah dan nama astronot aktif di luar angkasa.

Kondisi Sekarang: Komponen teks/list kosong karena kemungkinan salah membaca struktur properti dari objek JSON API.

Tugas Anda:
1. Ambil data dari API Open Notify: http://api.opennotify.org/astros.json
2. Buat fungsi untuk mengekstrak properti "number" untuk menampilkan total jumlah manusia (misal: 11) ke dalam elemen teks utama.
3. Buat fungsi perulangan (looping/map) untuk membaca array "people". Ambil properti "name" (nama astronot) dan "craft" (nama wahana, seperti ISS atau Tiangong).
4. Tampilkan daftar nama tersebut ke dalam komponen daftar (list/cards) kecil yang rapi di bawah teks jumlah utama. Jika daftar nama terlalu panjang, berikan fitur overflow-y-auto (scroll vertikal) agar tidak merusak tinggi kotak komponen UI.
—-----------------------------------------------------------------------------


perbaiki kode halaman peta langit malam Anda, agar tombol-tombol pilihan kota (Semarang, Yogyakarta, Palembang, dll.) berfungsi secara dinamis untuk menggeser koordinat peta Stellarium:

Target: Buat komponen peta langit malam menggunakan iframe Stellarium Web agar bergeser koordinatnya secara dinamis berdasarkan tombol kota yang diklik oleh pengguna.

Kondisi Sekarang: Tombol-tombol pilihan kota (seperti Yogyakarta, Semarang, Palembang) sudah ada di UI, tetapi peta Stellarium di bawahnya masih memuat lokasi acak (random) dan tidak merespons klik dari tombol-tombol tersebut.

Tugas Anda:
1. Buat arsitektur state di [Sebutkan Framework Anda, misal: React/Next.js] untuk menyimpan data "latitude" dan "longitude" kota yang aktif. Berikan nilai default awal untuk kota Jakarta (lat: -6.2088, lng: 106.8456).
2. Hubungkan tombol-tombol kota yang ada di UI dengan fungsi onClick yang akan mengubah state koordinat tersebut. Berikut adalah daftar koordinat kota untuk dimasukkan ke dalam fungsi:
   - Jakarta: lat: -6.2088, lng: 106.8456
   - Semarang: lat: -6.9667, lng: 110.4167
   - Yogyakarta: lat: -7.7956, lng: 110.3695
   - Palembang: lat: -2.9909, lng: 104.7567
3. Atur atribut "src" pada tag <iframe> agar membaca URL Parameter secara dinamis menggunakan literal string seperti ini: `https://stellarium-web.org/skysource/current?lat=${lat}&lng=${lng}`
4. Pastikan ketika tombol diklik, iframe akan memperbarui dirinya (re-render) secara halus dan mengunci posisi langit di kota tersebut tanpa merusak tata letak CSS bertema dark space yang sudah ada.

Tuliskan kode frontend-nya secara lengkap, bersih, dan mudah diintegrasikan ke dalam file halaman web saya.
—-----------------------------------------------------------------------------


Buatkan satu artikel edukasi astronomi yang menarik dan santai dalam Bahasa Indonesia mengenai objek luar angkasa yang akan melintas dekat Bumi minggu ini berdasarkan data berikut:
lengkap dengan fitur, voice to text, share sosial media, save pdf
tombol picu di admin console
SEO lengkap
setiap cron terkirim ke channel telegram dan report terkirim ke telegram ID

- Nama Objek: [Ambil dari JSON: name, misal: 1997 NC1]
- Tanggal Melintas: [Ambil dari JSON: close_approach_date]
- Ukuran Estimasi: [Ambil dari JSON: estimated_diameter, misal: 709-1585 meter]
- Kecepatan: [Ambil dari JSON: velocity, misal: 32.0 ribu km/jam]
- Status Bahaya: [Ambil dari JSON: is_potentially_hazardous_asteroid, misal: Berpotensi Berbahaya]

Ketentuan Artikel:
1. Buat judul yang menarik dan ramah SEO (Contoh: "Mengenal Asteroid 1997 NC1 yang Melintas Dekat Bumi Minggu Ini").
2. Jelaskan secara ramah kepada orang awam apakah jarak melintas tersebut aman atau tidak bagi Bumi.
3. Berikan edukasi singkat tentang asal-usul penamaan atau asal batuan ini.
4. Panjang artikel cukup 300-400 kata yang terbagi dalam beberapa paragraf pendek agar mudah dibaca di mobile.
5. Output harus dalam format Markdown yang siap disimpan ke database artikel.

Alur Kerja Cron Job Artikel Komet Otomatis
Ambil Data dari Loop API: Saat cron berjalan, skrip akan membaca data batuan yang melintas minggu ini (seperti objek 1997 NC1 atau 2019 YS3 yang ada di gambar Anda).
Filter & Cek Database: Buat logika agar cron memeriksa database R2 Anda terlebih dahulu. Jika artikel dengan judul nama komet/asteroid tersebut belum pernah dibuat, maka skrip akan melanjutkan ke tahap pembuatan artikel.
Kirim Data Teknis ke AI (Prompting): Skrip akan mengirimkan data mentah ke AI untuk dirangkai menjadi artikel utuh berbahasa Indonesia.

Dilengkapi dengan save pdf, voice to text, share media sosial

Struktur Metadata JSON di R2 (Supaya Mudah Difilter)
Jangan hanya menyimpan artikel dalam bentuk teks panjang. Pastikan setiap kali cron membuat artikel baru, ia juga menyimpan data teknisnya ke dalam database artikel Anda dengan struktur seperti ini:

{
  "id": "1997-nc1",
  "judul": "Mengenal Asteroid 1997 NC1 yang Melintas Dekat Bumi",
  "tanggal_rilis": "2026-06-25",
  "kategori": "Komet & Asteroid",
  "status_bahaya": "Berpotensi Berbahaya",
  "konten_markdown": "...",
  "review_status": "Otomatis" 
}
Tambahkan Fitur "Status Review" di Admin Console
Karena artikel ini dibuat otomatis oleh AI via cron, sangat bagus jika Anda menambahkan sistem moderasi atau penanda di halaman admin Anda:
Status: Otomatis (Belum Direview): Artikel langsung tayang begitu cron selesai bekerja agar website selalu up-to-date.
Status: Terverifikasi (Sudah Direview): Jika Anda selaku pemilik web sempat membaca artikel tersebut dan menambahkan catatan manual atau opini tambahan, Anda bisa mengubah statusnya di admin panel menjadi "Terverifikasi". Ini akan meningkatkan tingkat kepercayaan (kredibilitas) website Anda di mata akademisi atau pemerintah.
3. Keunggulan Database yang Dapat Di-review untuk SEO Google

Tips Tambahan untuk UX Admin:
Tampilkan Status Pemrosesan (Loading State): Karena proses memanggil API NASA, menerjemahkan, dan menyusun artikel lewat AI membutuhkan waktu sekitar 5–10 detik, pastikan tombol tersebut menampilkan efek loading (misal: tulisan berubah menjadi "Memproses data luar angkasa...") setelah diklik agar Anda tahu sistem sedang bekerja di latar belakang.
Log Hasil: Setelah proses selesai, tampilkan pesan sukses yang memberi tahu nama komet apa yang baru saja berhasil diulas dan dimasukkan ke database Anda (misal: “Sukses merilis artikel untuk Asteroid 1997 NC1”).

—--------------------------------------------------------------------------------------------

Memperbaiki Hitung Mundur Roket (Upcoming Launch)
Target: Perbaiki fungsi fetch API untuk jadwal peluncuran roket agar menampilkan jadwal yang AKAN DATANG (Upcoming), bukan yang sudah selesai.

Kondisi Sekarang: Kode mengambil data peluncuran yang sudah lewat (status "Successful"), sehingga hitung mundur (countdown) menampilkan angka 00.

Tugas Anda:
1. Ubah URL endpoint API The Space Devs (Launch Library 2) ke url khusus peluncuran mendatang: https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1
2. Buat fungsi Javascript/React untuk menghitung selisih waktu antara waktu sekarang (waktu lokal browser user) dengan variabel "net" atau "window_start" dari data JSON NASA/The Space Devs.
3. Pastikan waktu hitung mundur (Jam, Menit, Detik) berkurang secara real-time setiap detik menggunakan setInterval.
4. Jika data sedang dimuat (loading), tampilkan placeholder yang rapi dengan Tailwind CSS agar senada dengan UI bertema dark space.

Tuliskan kode frontend dan fungsi fetch-nya secara lengkap dan bersih.

