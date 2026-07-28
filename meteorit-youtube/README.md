# YouTube Shorts Automation — meteorit.my.id

Otomatisasi pembuatan YouTube Shorts harian dari artikel astronomi di [meteorit.my.id](https://www.meteorit.my.id) menggunakan **FFmpeg + Groq AI + YouTube Data API v3**.

## ✨ Fitur

- 🎬 **Auto-render video Shorts** 1080×1920 (vertikal) setiap hari pukul 07:00 WIB
- 🤖 **Narasi AI Bahasa Indonesia** via Groq (8 kalimat per video, 55 detik)
- 📅 **Rotasi 9 kategori** konten otomatis (Meteorit, Komet, EONET, Mars, APOD, Fireball, Astronot, Trivia, Bumi)
- 🏷️ **Hashtag SEO** otomatis per kategori
- 🔗 **Link website** `meteorit.my.id` di setiap deskripsi
- ☁️ **R2 transit** — video dihapus otomatis dari R2 setelah upload YouTube sukses
- 🔔 **Notifikasi Telegram** sukses/gagal
- 📊 **Tracking D1** — riwayat semua video yang diupload

## 🆓 Biaya: $0/bulan

| Komponen | Tool | Biaya |
|----------|------|-------|
| Render video | FFmpeg | Gratis |
| Cron executor | GitHub Actions | Gratis (repo public) |
| Narasi AI | Groq Llama | Gratis |
| Storage transit | Cloudflare R2 | Gratis (<10GB) |
| Upload YouTube | YouTube Data API | Gratis (10k unit/hari) |
| Tracking | Cloudflare D1 | Gratis |

## 📦 Persyaratan

- Node.js ≥ 20
- FFmpeg (install: `brew install ffmpeg` di Mac)
- Akun Google dengan channel YouTube `@Meteorit-h7d`
- Akun Cloudflare dengan R2 bucket `meteorit-indonesia`
- Groq API key (gratis di console.groq.com)
- Telegram Bot token

## 🚀 Setup Pertama (Lakukan Sekali)

### 1. Clone & Install

```bash
git clone https://github.com/TiusCreative/meteorit.git
cd meteorit
npm install
```

### 2. Setup .env

```bash
cp .env.example .env
# Edit .env dengan nilai yang sesuai
```

### 3. Dapatkan YouTube OAuth Token (WAJIB)

```bash
node scripts/youtube-auth.js
```

Browser akan terbuka → login Google → izinkan akses YouTube.  
`token.json` tersimpan otomatis. **Salin isi JSON ke GitHub Secret `YOUTUBE_TOKEN_JSON`.**

### 4. Tambahkan GitHub Secrets

Di repository Settings → Secrets → Actions → New repository secret:

| Secret Name | Nilai |
|-------------|-------|
| `R2_ACCESS_KEY_ID` | Dari Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Dari Cloudflare R2 |
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_BUCKET_NAME` | `meteorit-indonesia` |
| `R2_PUBLIC_URL` | URL publik R2 |
| `NASA_API_KEY` | api.nasa.gov |
| `GROQ_API_KEY` | console.groq.com |
| `GROQ_BACKUP_API_KEY` | Groq backup |
| `YOUTUBE_CLIENT_ID` | Google Cloud Console |
| `YOUTUBE_CLIENT_SECRET` | Google Cloud Console |
| `YOUTUBE_TOKEN_JSON` | Hasil `youtube-auth.js` |
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `TELEGRAM_CHAT_ID` | Admin chat ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 database ID |

## 🧪 Test Lokal

```bash
# Test render video (tanpa upload)
node scripts/test-render.js

# Test kategori spesifik
node scripts/test-render.js --category=komet

# Test dengan output kustom
node scripts/test-render.js --category=apod --output=out/test-apod.mp4

# Dry run (baca R2 + narasi AI, skip render & upload)
node main.js --dry-run
```

## 📅 Jadwal Rotasi Kategori

| Hari | Kategori |
|------|---------|
| Ke-1 | ☄️ Ensiklopedia Meteorit |
| Ke-2 | 🪐 Komet & Asteroid |
| Ke-3 | 🌍 Peristiwa Alam (EONET) |
| Ke-4 | 🔴 Planet Mars |
| Ke-5 | 🌌 Foto Astronomi (APOD) |
| Ke-6 | 🔥 Bola Api (Fireball) |
| Ke-7 | 👨‍🚀 Astronot & Misi |
| Ke-8 | 🌠 Trivia Luar Angkasa |
| Ke-9 | 🛰️ Pusat Kontrol Bumi |

Rotasi berulang setiap 9 hari (deterministik berdasarkan `dayOfYear % 9`).

## 🎬 Manual Trigger

Buka GitHub → Actions → `YouTube Shorts Daily Automation` → `Run workflow`

Opsi tersedia:
- `category` — override kategori (kosong = otomatis)
- `dry_run` — true = test tanpa upload ke YouTube
- `max_videos` — jumlah video hari ini (default: 2)

## 🗂️ Struktur Project

```
meteorit/
├── .github/workflows/
│   └── youtube-shorts-daily.yml
├── src/
│   ├── lib/
│   │   ├── categoryRotation.js
│   │   ├── r2Client.js
│   │   ├── groqNarration.js
│   │   ├── ffmpegRenderer.js
│   │   ├── youtubeClient.js
│   │   ├── telegramNotifier.js
│   │   └── d1Tracker.js
│   └── assets/
│       ├── music/          ← File .mp3 ambient space
│       ├── fonts/          ← NotoSans font Indonesia
│       └── logo/           ← Logo meteorit.my.id
├── scripts/
│   ├── youtube-auth.js     ← Setup OAuth (sekali)
│   └── test-render.js      ← Test render lokal
├── out/                    ← Output video lokal (gitignored)
├── main.js
├── package.json
└── .env.example
```

## 🔗 Links

- **Channel YouTube**: [youtube.com/@Meteorit-h7d](https://www.youtube.com/@Meteorit-h7d)
- **Website**: [meteorit.my.id](https://www.meteorit.my.id)
- **Sumber Data**: [NASA Open Data APIs](https://api.nasa.gov)

---

Made with ❤️ by [TiusCreative](https://github.com/TiusCreative)
