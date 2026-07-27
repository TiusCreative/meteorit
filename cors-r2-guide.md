# Panduan CORS Cloudflare R2

## Apa itu CORS R2?

Agar browser pengguna bisa langsung membaca file JSON artikel dari Cloudflare R2 (`fetch()` dari sisi client), bucket R2 harus mengizinkan CORS dari domain Anda.

---

## Konfigurasi CORS yang Harus Diterapkan

Salin konfigurasi JSON berikut ke **Cloudflare Dashboard → R2 → meteorit-indonesia → Settings → CORS Policy**:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  },
  {
    "AllowedOrigins": [
      "https://meteorit-indonesia.vercel.app",
      "https://www.meteoritindonesia.com",
      "https://meteoritindonesia.com",
      "https://*.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Cara Menerapkan di Cloudflare Dashboard

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Buka **R2** → pilih bucket **meteorit-indonesia**
3. Klik tab **Settings**
4. Scroll ke bagian **CORS Policy**
5. Klik **Edit CORS Policy**
6. Paste JSON di atas → **Save**

---

## Cara Menerapkan via Wrangler CLI

```bash
# Install Wrangler jika belum ada
npm install -g wrangler

# Login ke Cloudflare
wrangler login

# Terapkan CORS policy
wrangler r2 bucket cors put meteorit-indonesia --file cors-r2-config.json
```

Simpan JSON CORS di `cors-r2-config.json` terlebih dahulu.

---

## Verifikasi CORS

Buka browser developer tools → Network → pilih request ke R2 → cek header response:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
```

Atau test dengan curl:
```bash
curl -I -H "Origin: https://meteoritindonesia.com" \
  "https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/data/blog/posts.json"
```

---

## File yang Dibaca Langsung dari R2 (Butuh CORS)

| File | Keterangan |
|------|-----------|
| `data/blog/posts.json` | Daftar semua artikel (index) |
| `data/blog/articles/{id}.json` | Detail artikel individual |
| `data/weather/metadata.json` | Laporan komunitas cuaca |
| `rss.xml` | RSS Feed artikel |

---

## Catatan

- **Public URL R2**: `https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev`
- **S3 Endpoint**: `https://5f29e48300ae379ebe15c20185d15ac8.r2.cloudflarestorage.com`
- Konfigurasi CORS hanya berlaku untuk akses **dari browser (client-side)**. Akses server-side (Next.js API routes) via S3 SDK tidak memerlukan CORS.
