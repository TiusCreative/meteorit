buatkan map seperti google map, tampil di landing pages sebelah sesion meteor atau bukan dan muncul di halaman cuaca
buat agar semua bagian dari map  support 7 bahasa, ind, en,malay, ch, ja, ch, ru, fr, system ini sudah ada dengan pytohn 3
pastikan semua fitur berjalan

Berikut adalah rangkuman terstruktur dan rapi dari seluruh fitur GIS & Map Engine untuk portal kebencanaan Anda (Meteorit.my.id). Dokumen ini sudah dikelompokkan berdasarkan modul implementasi agar Anda bisa menyelesaikannya (checklist) satu per satu dengan target utama: Menggunakan MapLibre GL JS + OpenStreetMap + Elevation Service (Non-Google Maps API).
Modul 1: Core Map Engine & Layers
Komponen dasar peta, kontrol interaksi, dan visualisasi data dasar/bencana.
1.1 Map Engine & Controls (MapLibre GL JS)
* [ ] Zoom & Pan: Navigasi dasar peta.
* [ ] Fullscreen: Mode peta layar penuh.
* [ ] Offline Cache: Penyimpanan peta lokal untuk efisiensi data.
* [ ] Drawing Tools: Fitur menggambar Polyline dan Polygon di peta.
* [ ] Map Interaction:
    * Klik Peta: Menampilkan Marker $\rightarrow$ Memunculkan Koordinat $\rightarrow$ Opsi Salin/Bagikan/Simpan/Navigasi.
    * Long Press Menu (Sentuh Lama): Muncul shortcut (Copy Coord/Lat/Lng, Bagikan, Navigasi, Simpan, Tambah Catatan).
1.2 Base Map Layers
* [ ] OpenStreetMap (Default)
* [ ] Satellite Map
* [ ] Terrain Map (Relief)
* [ ] Light Mode & Dark Mode
1.3 Disaster Layers (Overlays)
* [ ] Geologi: Gunung Api (Marker/Zona Bahaya), Gempa (Episentrum & Radius), Tsunami (Zona Rawan).
* [ ] Hidrometeorologi: Banjir, Longsor, Cuaca, Curah Hujan, Radar, Citra Satelit Himawari, Siklon, Petir.
* [ ] Lainnya: Hotspot NASA FIRMS (Kebakaran Hutan), Kualitas Udara (AQI), Jalur Evakuasi, Lokasi Shelter.
Modul 2: GPS & Elevation Engine
Fitur untuk melacak posisi pengguna dan analisis ketinggian tanah secara realtime.
2.1 GPS Tracking (Realtime)
* [ ] Lokasi Saya: Deteksi posisi pengguna saat ini.
* [ ] GPS Metadata: Akurasi GPS, Heading (Arah Hadap), Kompas, Ketinggian (Altitude), Kecepatan (Speed), dan Timestamp.
2.2 Elevation Service (Integrasi OpenTopoData / Open Elevation)
* [ ] Metadata Ketinggian: Menampilkan MDPL (Meter Di Atas Permukaan Laut).
* [ ] Analisis Medan (Terrain): Minimum/Maximum/Average Elevation, Elevation Profile, Elevation Difference, Slope (Kemiringan), dan Kontur tanah.
Modul 3: Measurement & Spatial Analysis
Fitur kalkulasi jarak dan deteksi ancaman bencana di sekitar pengguna.
3.1 Measurement Tools
* [ ] Ukur Jarak: Jarak antar titik (Polyline).
* [ ] Ukur Luas: Area dalam wilayah tertentu (Polygon).
* [ ] Radius & Buffer Area: Membuat lingkaran jangkauan dari satu titik pusat.
* [ ] Estimasi Navigasi: Hitung jarak dan estimasi waktu tempuh (ETA).
3.2 Smart Spatial Analysis (Jarak Terhadap Ancaman)
* [ ] Hitung otomatis jarak pengguna ke: Gunung Api, Episentrum Gempa, Hotspot, Sungai, Pantai, Zona Tsunami, dan Lokasi Evakuasi/Shelter terdekat.
* [ ] Disaster Analysis: Sistem otomatis mengecek apakah posisi pengguna berada di dalam radius bahaya gunung api, gempa, tsunami, banjir, longsor, hotspot, atau jalur siklon.
Modul 4: UX, Koordinat, & Sistem Salin (Copy)
Standar baku penampilan koordinat (Mode Profesional) dan kemudahan menyalin data.
4.1 Precise Coordinate System (UI/UX)
* ⚠️ Aturan Baku: Koordinat asli (Lat, Lng) wajib selalu terlihat di popup/marker, tidak boleh disembunyikan atau digantikan oleh nama lokasi. 
* [ ] Format Koordinat Didukung:
    * Decimal Degrees (Contoh: -7.540231, 110.446132)
    * DMS (Degrees Minutes Seconds) (Contoh: 7°32'24.8"S 110°26'46.1"E)
    * UTM (Opsional), GeoJSON, dan KML.
* [ ] Marker Popup Information: Harus menampilkan: Nama Lokasi, Kategori, Koordinat (Lat/Lng), Elevasi (MDPL), Jarak dari pengguna, Tanggal/Jam, Provider data, Status, Severity, dan Akurasi GPS.
4.2 Copy System (Satu Sentuhan)
* [ ] Tombol [Copy Semua] pada marker.
* [ ] Fitur salin terpisah untuk: Latitude saja, Longitude saja, Lat+Lng, Google Maps Format, OpenStreetMap Format, GeoJSON, KML, Alamat, dan Plus Code (Opsional).
Modul 5: Sharing & Smart Warning System
Fitur untuk membagikan informasi secara informatif dan memberikan peringatan dini.
5.1 Sharing Location & Format
* [ ] Jenis yang Bisa Dibagikan: Lokasi saya, titik pilihan, rute, atau lokasi spesifik bencana (Gunung, Gempa, Banjir, Hotspot, Evakuasi).
* [ ] Format Share: Google Maps Link, OpenStreetMap Link, Lat/Lng, GeoJSON, KML, dan QR Code.
* [ ] Target Share: WhatsApp, Telegram, Discord, Facebook, Messenger, Email, SMS, Copy Link, dan Native Share API (Android/iOS).
5.2 Smart Share & Warning (Kondisi Darurat)
* [ ] Pesan Pintar Bencana: Jika lokasi yang dibagikan adalah area bencana, format pesan otomatis menambahkan informasi: Jenis bencana, Status, Severity, Radius Bahaya, Rekomendasi, dan Sumber Data.
* [ ] Smart Warning: Jika GPS mendeteksi pengguna masuk dalam Radius Bahaya, aplikasi otomatis menampilkan peringatan khusus berisi: Jenis Bahaya, Jarak ke Pusat, Ketinggian, Rekomendasi Aksi, Jalur Evakuasi Terdekat, dan Shelter Terdekat.
Modul 6: Output & Integrasi Eksternal
* [ ] Navigasi Eksternal: Tombol pintas untuk melempar rute ke aplikasi pihak ketiga (Buka Google Maps, Buka OpenStreetMap, Buka Navigasi bawaan perangkat).
* [ ] Download Data: Eksport koordinat atau area bencana ke format: GeoJSON, KML, CSV, JSON, PDF, dan PNG (Snapshot Peta).
💡 Alur Kerja Fitur Pintar (Contoh Kasus Gempa/Gunung Api)
1. Pengguna membuka halaman bencana $\rightarrow$ 2. Peta memuat koordinat episentrum/marker $\rightarrow$ 3. GPS mendeteksi lokasi pengguna $\rightarrow$ 4. Sistem menggambar lingkaran radius bahaya $\rightarrow$ 5. Muncul info teks: "Jarak Anda ke lokasi: X km" $\rightarrow$ 6. Jika masuk radius bahaya, Smart Warning menyala $\rightarrow$ 7. Tombol navigasi ke shelter terdekat aktif.
Semua modul di atas dirancang untuk berjalan secara otomatis dan interoperable satu sama lain di dalam framework MapLibre.
