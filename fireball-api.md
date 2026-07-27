
tolong implementasikan ke tiga api ini untuk mempeluas fitur dan wawasan
buatkan halaman khusus untuk artikel cron
masing - masing artikel di buat 1 kali dalam sehari - setiap artikel minimal 500 karakter format artiekl di samakan dengan artikel blog yang sudah ada
lengkapi dengan fitur voice to text, save pdf, share media sosial, watermark, translate 5 bahasa - seperti artikel yang sudah ada
buatkan info ke 3 ini di landing pages dengan pengaturan di sesion artikel blog - dengan simulator dan live
buatkan juga di halaman admin console tombol picu manualnya dan catalog artikel - dengan action edit dan delete
kirim notifikasi setiap ada even ke telegram channel dan repot ke telegram id
simpan di R2 - dan caches user

url poin fireaball.api - nasa
https://ssd-api.jpl.nasa.gov/fireball.api
Example Queries
https://ssd-api.jpl.nasa.gov/fireball.api (return all available data in reverse-chronologic order)
https://ssd-api.jpl.nasa.gov/fireball.api?limit=20 (return the most recent 20 records)
https://ssd-api.jpl.nasa.gov/fireball.api?date-min=2014-01-01&req-alt=true (return data on or after 2014-01-01 and only records with the altitude defined)
sample json
{
  "signature":{"version":"1.2","source":"NASA/JPL Fireball Data API"},
  "count":3,
  "fields":["date","lat","lat-dir","lon","lon-dir","alt","energy","impact-e"],
  "data":[
    ["2015-10-13 12:23:08","8.0","S","52.5","W",null,"2.3","0.082"],
    ["2015-10-11 00:07:46","55.4","S","18.8","W",null,"3.0","0.1"],
    ["2015-10-10 09:57:51","51.0","S","21.1","W",null,"3.6","0.12"]
  ]
}
————————————————————————————————
url enonet nasa v3
https://eonet.gsfc.nasa.gov/api/v3/events
—————————————————————
api key https://home.openweathermap.org/api_keys
c5d9548ca431c734f6a6f9beda41a9a1

url enonet nasa v3
https://eonet.gsfc.nasa.gov/api/v3/events

CNEOS Fireball API (NASA)
 NASA EONET (Earth Observatory Natural Event Tracker)
Status: Bebas Lisensi / Domain Publik (Gratis Total)
Penjelasan: Sama seperti CNEOS, EONET dikembangkan oleh NASA (khususnya EOSDIS). pastikan untuk tidak melakukan spamming request (disarankan melakukan caching data di server Anda sendiri agar tidak terus-menerus menembak API NASA setiap kali ada pengunjung baru).

Tips Penting Menggunakan EONET untuk Website Anda:
Karena EONET melacak semua bencana alam di Bumi (seperti gunung meletus, kebakaran hutan, banjir, hingga badai), datanya akan sangat menumpuk jika Anda tidak memfilternya. Agar tetap relevan dengan tema website meteorit dan astronomi Anda, gunakan trik berikut:

Gunakan Parameter Status (Hanya Ambil Kejadian yang Masih Aktif):
Secara bawaan (default), API ini hanya mengembalikan kejadian yang berstatus aktif (open). Ini sangat bagus untuk fitur real-time Anda. URL-nya:

https://eonet.gsfc.nasa.gov/api/v3/events
Batasi Jumlah Data (Limit):
Agar loading web atau proses Cron Job ringan, batasi misalnya hanya mengambil 10 atau 20 kejadian terbaru yang sedang berlangsung di Bumi:

https://eonet.gsfc.nasa.gov/api/v3/events?limit=20
Cara Menghubungkan ke OpenWeather dan Peta:
Respon JSON dari EONET akan memberikan array bernama geometry. Di dalamnya terdapat koordinat (coordinates) berupa [longitude, latitude].
Anda bisa langsung plot koordinat tersebut ke peta interaktif website Anda.
Masukkan koordinat itu ke OpenWeather API jika Anda ingin menampilkan kondisi cuaca atau tutupan awan di sekitar lokasi bencana alam tersebut secara otomatis.


3. OpenWeather API
Status: Freemium (Ada Versi Gratis, Tapi Terikat Lisensi Kepemilikan)
Penjelasan: Berbeda dengan NASA yang merupakan lembaga pemerintah, OpenWeather adalah perusahaan komersial. Mereka menyediakan "Free Plan" (Paket Gratis) yang sangat cukup untuk developer pemula atau website skala kecil-menengah.
Detail Paket Gratis (Free Plan):
Anda mendapatkan kuota 60 request per menit atau 1.000 request per hari (untuk One Call API 3.0) secara gratis.
Anda wajib menyertakan atribusi (misalnya teks atau logo kecil bertuliskan "Powered by OpenWeather") di website Anda sebagai syarat lisensi gratis mereka.

Kesimpulan & Saran untuk Website Anda:
Untuk CNEOS dan EONET, Anda bisa menggunakannya dengan sangat tenang tanpa khawatir melanggar hak cipta atau ditagih biaya.
Untuk OpenWeather, agar kuota gratisan Anda tidak cepat habis oleh pengunjung website, gunakan teknik Caching. Caranya: buat server/backend Anda mengambil data cuaca dari OpenWeather setiap 10 atau 15 menit sekali saja, lalu simpan di database Anda. Ketika ada user membuka website, tampilkan data dari database tersebut, bukan langsung menembak API OpenWeather.



Alur Kerja Cron Job Notifikasi (Real-Time Alerts)
Cron ini bertugas mendeteksi jika ada aktivitas ekstrem di langit (misal: bola api besar atau asteroid yang melintas sangat dekat) lalu mengirimkan peringatan ke pengguna (bisa lewat Web Push Notification, Telegram Bot, Discord Webhook, atau Email).
Jadwal Eksekusi (Interval): Setiap 15–30 menit sekali.
Cara Kerja Sistem:
Cron memanggil CNEOS Fireball API atau NASA EONET.
Sistem mengecek apakah ada data kejadian baru berdasarkan timestamp (waktu kejadian) dalam 30 menit terakhir.
Jika ditemukan kejadian dengan skala besar (misal: energi ledakan meteor tinggi):
Sistem mengambil koordinat lokasi kejadian.
Sistem menembak OpenWeather API untuk mengecek kondisi cuaca di koordinat bumi tersebut (apakah cerah/bisa dilihat visual).
Sistem otomatis menyiarkan notifikasi ke user: "Peringatan! Bola api (fireball) baru saja terdeteksi di atas langit [Nama Lokasi]. Kondisi cuaca saat ini: [Cerah/Berawan].”


Alur Kerja Cron Artikel Otomatis (Auto-Generated Content)
Cron ini bertujuan untuk mengisi blog atau seksi berita di website Anda secara otomatis agar SEO website Anda terus meningkat tanpa perlu menulis manual setiap hari.
Jadwal Eksekusi (Interval): 1 kali sehari (misal setiap jam 01.00 malam).
Cara Kerja Sistem:
Cron menarik rangkuman data selama 24 jam terakhir dari CNEOS (jumlah meteor yang masuk atmosfer) dan EONET (peristiwa alam global).
Data mentah tersebut (berupa angka, koordinat, dan kecepatan) dikirim ke API AI pembuat teks (seperti OpenAI GPT-4 atau Gemini API) melalui prompt khusus.
Contoh prompt: "Buatlah artikel berita santai dan informatif berdasarkan data mentah NASA berikut: Kemarin terjadi 3 aktivitas fireball besar di lokasi X, Y, Z. Gunakan bahasa Indonesia yang menarik."
Sistem menerima teks artikel jadi dari AI, lalu otomatis menyimpannya ke database website Anda dengan status Published (Terbit).

Strategi Menghemat Kuota API (Penting!)
Jangan gunakan OpenWeather untuk artikel otomatis: Data cuaca hanya relevan untuk notifikasi instan/detik itu juga. Untuk artikel harian, Anda cukup meringkas data dari NASA saja agar hemat kuota.
Gunakan Basis Data (Database) sebagai Filter: Setiap kali Cron berjalan, simpan ID kejadian unik dari NASA ke database Anda. Sebelum memproses data, cek apakah ID tersebut sudah ada. Jika sudah ada, lewati (skip). Ini mencegah sistem mengirim notifikasi duplikat ke pengguna atau membuat artikel yang sama berulang kali.


