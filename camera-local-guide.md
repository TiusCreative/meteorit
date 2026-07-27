# Panduan Uji Coba Kamera Lokal dengan HP

## Masalah Umum

Browser modern **melarang akses kamera** di halaman HTTP biasa (bukan HTTPS), kecuali untuk `localhost`. Ketika Anda menguji menggunakan HP yang terhubung ke komputer lokal, HP tidak melihat `localhost` — ia melihat alamat IP lokal seperti `192.168.x.x`, yang dianggap tidak aman.

---

## Solusi 1: Jalankan dengan HTTPS Lokal (Mkcert) — Paling Disarankan

### Langkah-langkah:

**1. Install `mkcert`:**
```bash
brew install mkcert      # macOS
# atau: sudo apt install libnss3-tools && curl -L ... (Linux)
mkcert -install          # Trust CA ke sistem
```

**2. Buat sertifikat untuk IP lokal:**
```bash
# Jalankan di root project
mkcert localhost 127.0.0.1 192.168.x.x   # ganti x.x dengan IP WiFi Anda
# Menghasilkan: localhost+2.pem dan localhost+2-key.pem
```

**3. Temukan IP WiFi Anda:**
```bash
ipconfig getifaddr en0   # macOS
# contoh output: 192.168.1.100
```

**4. Jalankan Next.js dengan HTTPS:**

Tambahkan `server.js` di root project:
```javascript
// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const app = next({ dev: true });
const handle = app.getRequestHandler();

const options = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
};

app.prepare().then(() => {
  createServer(options, (req, res) => {
    handle(req, parse(req.url, true), res);
  }).listen(3000, '0.0.0.0', () => {
    console.log('✅ HTTPS dev server: https://192.168.1.100:3000');
  });
});
```

Tambahkan script ke `package.json`:
```json
"scripts": {
  "dev:https": "node server.js"
}
```

Jalankan:
```bash
npm run dev:https
```

Akses dari HP: **`https://192.168.1.100:3000`** ✅

---

## Solusi 2: Gunakan ngrok (Tercepat, Tanpa Konfigurasi)

```bash
# Install ngrok
brew install ngrok/ngrok/ngrok   # macOS

# Jalankan dev server biasa dulu
npm run dev

# Di terminal lain, tunnel ke port 3000
ngrok http 3000
```

Ngrok akan memberi URL seperti:
```
https://abc123.ngrok-free.app
```

Buka URL tersebut dari HP — HTTPS otomatis, kamera langsung berfungsi ✅

---

## Solusi 3: Chrome Flag (Untuk Testing Cepat)

1. Di HP Android, buka `chrome://flags`
2. Cari `Insecure origins treated as secure`
3. Tambahkan: `http://192.168.1.100:3000`
4. Aktifkan → Restart Chrome

⚠️ Hanya untuk development, jangan dipakai di produksi.

---

## Izin Kamera di Aplikasi

Kode kamera sudah ada di `WeatherMiniApp.tsx` dengan penanganan error lengkap:

```typescript
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // kamera belakang HP
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }
    });
    // ✅ Berhasil — stream siap digunakan
  } catch (e: any) {
    if (e.name === 'NotAllowedError') {
      // ❌ User tolak izin atau HTTP (non-HTTPS)
    } else if (e.name === 'NotFoundError') {
      // ❌ HP tidak punya kamera
    }
  }
};
```

### Pesan Error yang Muncul di UI:

| Error | Penyebab | Solusi |
|-------|---------|--------|
| `NotAllowedError` | Izin ditolak atau halaman HTTP | Gunakan HTTPS (solusi 1/2 di atas) |
| `NotFoundError` | Kamera tidak tersedia | Cek kamera HP |
| Halaman via Telegram/WhatsApp | In-app browser membatasi kamera | Buka link di Chrome/Safari langsung |

---

## Catatan Penting

- Kamera **HANYA berfungsi di HTTPS** atau `localhost`
- Halaman yang dibuka via Telegram in-app browser sering **memblokir kamera** — sarankan user buka di browser bawaan HP
- Untuk produksi (Vercel), kamera otomatis bekerja karena sudah HTTPS ✅
- Komponen sudah menampilkan pesan error + instruksi kepada user secara otomatis

---

## Perintah Ringkas (Copy-Paste)

```bash
# 1. Install mkcert + buat sertifikat
brew install mkcert && mkcert -install
IP=$(ipconfig getifaddr en0)
mkcert localhost 127.0.0.1 $IP

# 2. Rename ke nama yang diharapkan server.js
mv "localhost+2.pem" localhost.pem
mv "localhost+2-key.pem" localhost-key.pem

# 3. Jalankan (pastikan server.js sudah ada)
npm run dev:https

# Atau gunakan ngrok (lebih mudah):
ngrok http 3000
```
