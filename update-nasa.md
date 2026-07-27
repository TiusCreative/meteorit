analisa dan perbaiki mengapa di miniapp menu - kamus - profile astronot ketika pilih bahasas inggris tidak semua profiile berubah sesdangkan bahasa lainnya sudah berubah
——————————————
pasngkan kode google analitycs = G-X4F6EB07D4 - agar stantisktik dahsbord di admin berjalan

tolong analisa untuk AI AGEN GENERATE ARTIKEL apakah sudah groq - backupgroq - openrouter - backupopenrouter
———————————————
tambahkan fitur fitur ini dan tuliskan key var di .env.local

fitur ini muncul di landing pages utama dan di cuaca

info gempa ineraktif lengkap
https://earthquake.usgs.gov/fdsnws/event/1/

* info gempa terbaru di indonesia
* Peta gempa dunia interaktif.
* Daftar gempa terbaru Indonesia.
* Statistik jumlah gempa hari ini.
* Notifikasi otomatis untuk gempa dengan magnitudo tertentu. >5sr ke telegraml cahnnel dan pwa
* Riwayat gempa berdasarkan tanggal, tempat, kota, negara
* rentang tanggal, magnitudo, kedalaman, wilayah, jumlah hasil
* statistik gempa harian, mingguan, bulanan
* tingkat signifikan, jumlah laporan dari masryakat
* url, peta dan info tambahan
* tanggal, tempat kejadian, koordinat, mag, kedlaman, status stunami


https://www.usgs.gov/

Beberapa data yang disediakan USGS antara lain:
🌍 Gempa bumi (real-time dan historis) 
🌋 Gunung api (aktivitas dan pemantauan tertentu) 
💧 Data air (debit sungai, tinggi muka air, kualitas air). API ini mendukung API Key opsional untuk mendapatkan batas permintaan (rate limit) yang lebih tinggi, tetapi tetap dapat diakses tanpa API Key dalam banyak kasus. 
api.waterdata.usgs.gov
🗺️ Peta geospasial (The National Map).
🛰️ Citra satelit (EROS).
🪨 Data mineral dan geologi.
🧲 Data geomagnetik.
📚 Publikasi ilmiah USGS. 
peta interaktip
USGS
Report lengkap

* ————————————
info titik api lengkap

https://firms.modaps.eosdis.nasa.gov/api/map_key/
apikey = 928afc4f93ec07708c5c46bd4d3db1e3

Dengan MAP_KEY Anda bisa mengambil data:
🔥 Titik api (hotspot) seluruh dunia.
🇮🇩 Titik api di Indonesia.
📍 Koordinat hotspot.
🛰️ Satelit yang mendeteksi (MODIS, VIIRS).
📅 Tanggal dan waktu deteksi.
🌡️ Tingkat kepercayaan (confidence).
🌙 Siang atau malam.
⚡ Fire Radiative Power (FRP), yang menunjukkan intensitas kebakaran
system repot yang lengkap, tanggal, lokasi, map,dll

—————————————


gunakan NASA GPM (Global Precipitation Measurement) untuk membuat dan menampilkan 

NASA GPM Mission + 1
Data yang bisa diambil:
🌧️ Curah hujan real-time dan historis.
🌩️ Intensitas hujan.
🗺️ Distribusi hujan global.
📈 Akumulasi hujan harian/bulanan.
🌍 Data hujan untuk Indonesia dan seluruh dunia. 

NASA GPM Mission
2. NASA GFMS (Global Flood Monitoring System)

NASA Open Data Portal + 1
Data yang bisa diambil:
🌊 Wilayah yang berpotensi banjir.
⚠️ Tingkat keparahan banjir.
📍 Lokasi banjir.
🕒 Waktu kejadian.
🌧️ Curah hujan yang memicu banjir.
🗺️ Peta banjir global. 
NASA Open Data Portal

lengkap denan repot

———————————
buatkan data elnino dan laa nina lengkap
https://www.ncei.noaa.gov/access/monitoring/enso/

Data yang bisa diambil dari NOAA terkait ENSO
🌡️ Status ENSO saat ini (El Niño, La Niña, atau Netral).
📊 Nilai indeks Oceanic Niño Index (ONI).
🌊 Anomali suhu permukaan laut (Sea Surface Temperature/SST).
🌧️ Prediksi peluang El Niño, La Niña, dan Netral untuk beberapa bulan ke depan.
📅 Riwayat ENSO selama puluhan tahun.
🌪️ Dampak ENSO terhadap curah hujan dan suhu di berbagai wilayah dunia.
📈 Grafik dan data historis ENSO. 
Laboratorium Ilmu Fisika NOAA + 1
Jika memakai NOAA Climate Data API (dengan token)
Anda juga bisa mengambil:
🌡️ Suhu maksimum dan minimum.
🌧️ Curah hujan.
💨 Kecepatan angin.
💧 Kelembapan (tergantung dataset).
❄️ Salju (untuk wilayah yang relevan).
📊 Data iklim harian, bulanan, dan tahunan.
🗺️ Data dari stasiun cuaca di seluruh dunia. 
Pusat Informasi Lingkungan Nasional + 1


————————————————
* Laporan Aktivitas Gunung Api (VAR): https://esdm.go.id
* Informasi Gempa Bumi: https://esdm.go.id
* Status Gunung Api: https://esdm.go.id
Data ini menampilkan informasi terkait status gunung berapi aktif serta potensi ancaman kebencanaan secara real-time. Untuk informasi dan panduan lebih lanjut, Anda dapat merujuk ke Situs Resmi MAGMA Indonesia.

sehingga web menjadi lengkap dan interaktip
semua notip kejadian di kirim ke telegram channel

———————————
lakukukan uji coba dengan npx playwright codegen untuk akurasi tranlate dan performa

—————————————
tolong analisa saya ingin tingkatkan berdasarkan pengujian https://pagespeed.web.dev/ performa hanya 42% saya ingin menajdi 90% warna hijau, dan praktik terbaik menjadi 90%

tuliskan resume report dalam bahasa indonesia
———————————————————
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_D1_DATABASE_ID=c0ad9039-d1e4-4c01-856d-5d5971514255

saya ingin mengubah migrasi arsitektur aplikasi dari Firebase ke Cloudflare D1 + R2. tujuan untuk melepas dari bayang

ubah semua pengambilan data dari firebase ke r2 web utama dan minp app


ubah juga system di admin console yang berhubungan dengan databse firebase
Saya membutuhkan bantuan untuk membuat sistem baru dengan alur sebagai berikut:
Struktur Database (Cloudflare D1):
Buatkan desain skema SQL untuk tabel articles yang efisien untuk menyimpan metadata: id, title, category, r2_path, created_at, dan tags.
Pastikan skema ini optimal untuk fitur pencarian (pencarian kata kunci per kategori).

Integrasi Cron Job:
 Upload file konten (JSON & WebP) ke R2.
 Insert metadata artikel ke tabel articles di D1.
API Logic (Search & Fetch):
pencarian artikel berdasarkan kata kunci atau kategori.

Utamakan efisiensi agar penggunaan read rows di D1 tetap rendah.
buat  migrasi ini tanpa membuat aplikasi saya down."
Tips Sebelum Anda Menggunakan Prompt Ini:


jadikan R2 tetap sebagai backup fallback - data di R2 jangan di pindahkan ke D1 - user tetep baca dari R2 dan R2 menjadi penyimpanan yang utama

D1 hanya di gunakan menyimpan informasi yang diperlukan untuk pencarian dan daftar artikel / ensiklopedia

Yang tetap disimpan di R2
JSON lengkap artikel.
Thumbnail atau gambar jika ukurannya besar. / webp
Lampiran seperti PDF atau file lainnya.
Backup ekspor metadata (misalnya backup/articles.json) untuk pemulihan.
Dengan pola ini:
D1 menjadi "daftar isi" yang cepat dicari.
R2 menjadi "gudang data" dan cadangan.
Jika suatu saat D1 rusak atau terhapus, Anda cukup membaca kembali file JSON di R2 dan mengisi ulang D1 melalui skrip migrasi

gunakan cloudflare wrangler untik mengelola D1 sehingg semua berjlana otomatis,, migrasi tabel, biding, deploymend

buat tombol bcakup databse di admin dapat di unduh

