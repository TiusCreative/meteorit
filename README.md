# Meteorit Indonesia - Website Astronomi & Komunitas

## Deskripsi Proyek

Meteorit Indonesia adalah platform komprehensif untuk penggemar astronomi dan meteorit di Indonesia. Website ini menyediakan ensiklopedia meteorit, forum komunitas, blog astronomi, dan sistem manajemen konten yang canggih.

## Fitur Utama

### Frontend (Pengguna)
- **Landing Page** dengan desain modern dan informatif
- **Ensiklopedia Meteorit** dengan data otomatis dari NASA API
- **Blog Astronomi** dengan artikel yang dibuat oleh AI
- **Forum Komunitas** dengan sistem login Firebase
- **Sistem Langganan** untuk newsletter dan notifikasi
- **Integrasi Media Sosial** (WhatsApp, Telegram, Instagram, Facebook)
- **PWA (Progressive Web App)** untuk pengalaman seperti aplikasi native

### Backend (Admin)
- **Dashboard Admin** dengan statistik real-time
- **Manajemen Artikel** dengan pemicu AI manual
- **Manajemen Ensiklopedia** dengan pembaruan otomatis dari NASA
- **Manajemen Donasi** dengan integrasi Midtrans
- **Manajemen Iklan** dengan kontrol Google Adsense
- **Manajemen Pengguna** dan moderasi forum
- **Sistem Backup & Restore** database
- **Pengaturan Sistem** yang komprehensif

### Sistem Otomatis
- **Cron Job** untuk pembaruan data NASA setiap hari
- **AI Content Generation** untuk artikel blog
- **Cache User** untuk menghemat kuota Firebase
- **Cloudflare R2 Storage** untuk penyimpanan gambar dan JSON

## Teknologi yang Digunakan

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore

### Backend
- Next.js API Routes
- Cloudflare R2 (S3-compatible storage)
- NASA API
- Groq/Mistral AI API
- Midtrans Payment Gateway

### Database
- Firebase Firestore (untuk data sensitif)
- Cloudflare R2 (untuk cache JSON dan gambar)

### DevOps
- Vercel (Hosting & Deployment)
- GitHub (Version Control)

## Konfigurasi

### Firebase
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCgxsEmC4G-5n9VSl7uRhSRIOebReN7-BU",
  authDomain: "meteorit-indonesia.firebaseapp.com",
  projectId: "meteorit-indonesia",
  storageBucket: "meteorit-indonesia.firebasestorage.app",
  messagingSenderId: "83461705969",
  appId: "1:83461705969:web:778621d5f596662357d950"
};
```

### Cloudflare R2
```javascript
const R2_CONFIG = {
  accountId: "5f29e48300ae379ebe15c20185d15ac8",
  accessKeyId: "cd3b2f027722b69c38f2f9ebf3663228",
  secretAccessKey: "5e2207a33647f195c2616ebb6f2ad4b8c421c629756c9459186b8988af1a8073",
  bucketName: "meteorit-indonesia",
  publicUrl: "https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev",
  s3Endpoint: "https://5f29e48300ae379ebe15c20185d15ac8.r2.cloudflarestorage.com"
};
```

### API Keys
- **NASA API**: `hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN`
- **Groq API**: `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`
- **OpenRouter API**: `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`
- **Midtrans**: 
  - Client Key: `Mid-client-W0vPic8NOjBtZxUa`
  - Server Key: `Mid-server-GU5Ff23DEAiUyc16xmu2egkr`

## Struktur Proyek

```
meteorit-indonesia/
├── src/
│   ├── app/
│   │   ├── (main)/              # Halaman utama
│   │   ├── (admin)/             # Halaman admin
│   │   ├── (auth)/              # Halaman autentikasi
│   │   ├── api/                 # API routes
│   │   └── ...
│   ├── components/             # Komponen React
│   │   ├── admin/               # Komponen admin
│   │   └── ...
│   ├── lib/                    # Library dan konfigurasi
│   │   ├── firebaseConfig.ts    # Konfigurasi Firebase
│   │   └── cloudflareR2Config.ts # Konfigurasi R2
│   └── ...
├── public/                     # Aset statis
│   ├── logo.jpg                # Logo website
│   └── ...
├── package.json
├── README.md
└── ...
```

## Cara Menjalankan Proyek

### Prasyarat
- Node.js v18+
- npm atau yarn
- Akun Firebase
- Akun Cloudflare R2
- Akun Vercel

### Instalasi
```bash
# Clone repository
git clone https://github.com/your-repo/meteorit-indonesia.git
cd meteorit-indonesia

# Install dependencies
npm install

# Jalankan di mode development
npm run dev

# Build untuk production
npm run build
npm run start
```

### Deployment ke Vercel
1. Buat proyek baru di Vercel
2. Hubungkan dengan repository GitHub
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_FIREBASE_CONFIG` (konfigurasi Firebase)
   - `R2_CONFIG` (konfigurasi Cloudflare R2)
   - `NASA_API_KEY`
   - `GROQ_API_KEY`
   - `MIDTRANS_CLIENT_KEY`
   - `MIDTRANS_SERVER_KEY`
4. Deploy!

## Cron Job

Website ini menggunakan cron job untuk:
1. **Pembaruan Data NASA** - Setiap hari pukul 00:00 WIB
2. **Pembuatan Artikel AI** - Setiap Senin pukul 06:00 WIB

Endpoint cron: `/api/cron?secret=UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=`

## Strategi Hemat Biaya

1. **Cache User**: Data diambil dari Cloudflare R2 JSON (gratis) alih-alih Firebase
2. **Cron Job**: Pembaruan data hanya sekali sehari untuk menghemat API calls
3. **Kompresi Gambar**: Semua gambar dikonversi ke WebP untuk menghemat bandwidth
4. **Firebase Free Tier**: Hanya data sensitif yang disimpan di Firebase

## Kontribusi

Kami menyambut kontribusi dari komunitas! Silakan buka issue atau pull request untuk:
- Perbaikan bug
- Fitur baru
- Peningkatan dokumentasi
- Peningkatan performa

## Lisensi

MIT License

## Kontak

- Email: info@meteorit-indonesia.com
- Website: `NEXT_PUBLIC_SITE_URL`
- WhatsApp: https://whatsapp.com/channel/meteorit
- Telegram: https://t.me/meteoritindonesia

© 2026 Meteorit Indonesia. All rights reserved.
