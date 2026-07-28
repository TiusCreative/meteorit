// scripts/youtube-auth.js
// ============================================================
// JALANKAN SEKALI DI MAC ANDA:  node scripts/youtube-auth.js
// Ini akan membuka browser untuk login Google dan menyimpan
// token OAuth ke file token.json
// ============================================================
import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(path.dirname(__dirname), 'token.json');

// Credentials WAJIB dari .env — jangan pernah hardcode ke kode!
const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ YOUTUBE_CLIENT_ID dan YOUTUBE_CLIENT_SECRET harus ada di file .env');
  console.error('   Copy dari .env.example dan isi dengan nilai yang sesuai');
  process.exit(1);
}
const REDIRECT_URI = 'http://localhost:3030';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Wajib agar selalu minta refresh_token
});

console.log('\n🚀 YouTube OAuth Setup');
console.log('='.repeat(50));
console.log('\n📋 Langkah-langkah:');
console.log('1. Browser akan membuka halaman login Google');
console.log('2. Login dengan akun Google yang memiliki channel @Meteorit-h7d');
console.log('3. Izinkan akses YouTube');
console.log('4. Token akan tersimpan otomatis ke token.json\n');
console.log('🔗 Auth URL:');
console.log(authUrl);
console.log('\n⏳ Menunggu callback di http://localhost:3030...\n');

// Buka browser otomatis
const { exec } = await import('child_process');
exec(`open "${authUrl}"`);

// Buat server sementara untuk tangkap callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Tangkap callback di root path
  const code = parsedUrl.query.code;

  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Simpan token ke file
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

      console.log('✅ Token berhasil disimpan ke:', TOKEN_PATH);
      console.log('\n📋 ISI token.json (copy ke GitHub Secret YOUTUBE_TOKEN_JSON):');
      console.log('─'.repeat(60));
      console.log(JSON.stringify(tokens));
      console.log('─'.repeat(60));
      console.log('\n⚠️  PENTING: Jangan commit token.json ke Git!');
      console.log('   Copy nilai JSON di atas ke GitHub Secrets:\n');
      console.log('   Settings → Secrets → New secret');
      console.log('   Name: YOUTUBE_TOKEN_JSON');
      console.log('   Value: [paste JSON di atas]\n');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: #fff;">
          <h1 style="color: #00ff88">✅ Berhasil!</h1>
          <p>Token YouTube OAuth berhasil disimpan.</p>
          <p>Silakan tutup tab ini dan kembali ke terminal.</p>
          <code style="background:#111;padding:10px;display:block;margin:20px;text-align:left;font-size:12px">
            ${JSON.stringify(tokens, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </code>
        </body>
        </html>
      `);
    } catch (err) {
      console.error('❌ Error mendapatkan token:', err.message);
      res.writeHead(500);
      res.end(`<h1>Error: ${err.message}</h1>`);
    }

    server.close();
    process.exit(0);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3030, () => {
  console.log('🌐 Server callback aktif di port 3030');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ Port 3030 sudah dipakai. Tutup aplikasi yang menggunakan port ini dan coba lagi.');
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
