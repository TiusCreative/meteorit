#!/usr/bin/env node

/**
 * Site Cron Worker
 * Eksekutor Cron Jobs independen untuk Meteorit Indonesia.
 * Dijalankan via GitHub Actions scheduler atau Cloudflare Worker.
 */

const https = require('https');
const http = require('http');

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://meteorit.my.id').replace(/\/+$/, '');
const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

// Daftar seluruh endpoint cron beserta jadwal jam (UTC) aslinya
const CRON_SCHEDULE = [
  { id: 'cleanup', path: '/api/cron/cleanup-telegram-reports', hourUTC: 0, desc: 'Cleanup Laporan Telegram' },
  { id: 'blog', path: '/api/cron/blog', hourUTC: 1, desc: 'Auto Update Blog Artikel' },
  { id: 'mars', path: '/api/cron/mars', hourUTC: 2, desc: 'Update Mars Weather & Photos' },
  { id: 'komet', path: '/api/cron/komet', hourUTC: 3, desc: 'Update Asteroid & Komet' },
  { id: 'fireball', path: '/api/cron/fireball', hourUTC: 4, desc: 'Update Fireball Tracker' },
  { id: 'eonet', path: '/api/cron/eonet', hourUTC: 5, desc: 'Update Kejadian Alam EONET' },
  { id: 'main-cron', path: '/api/cron', hourUTC: 5, desc: 'Rebuild R2 Catalog & D1 Sync' },
  { id: 'apod', path: '/api/cron/apod', hourUTC: 6, desc: 'NASA Astronomy Picture of the Day' },
  { id: 'astronot', path: '/api/cron/astronot', hourUTC: 6, desc: 'Update Data Astronaut' },
  { id: 'nasa-alert', path: '/api/cron/nasa-alert', hourUTC: 7, desc: 'NASA Alerts & Space Weather' },
  { id: 'earth-monitoring', path: '/api/cron/earth-monitoring', hourUTC: 9, desc: 'Earth Monitoring Realtime' },
  { id: 'earth-monitoring-daily', path: '/api/cron/earth-monitoring-daily', hourUTC: 10, desc: 'Earth Monitoring Harian' },
  { id: 'glossary', path: '/api/cron/glossary', hourUTC: 20, desc: 'Update Kamus Astronomi / Glosarium' },
];

function requestEndpoint(urlPath) {
  return new Promise((resolve) => {
    const fullUrl = `${SITE_URL}${urlPath}?secret=${encodeURIComponent(CRON_SECRET)}`;
    const urlObj = new URL(fullUrl);
    const client = urlObj.protocol === 'https:' ? https : http;

    console.log(`\n⏳ Mengirim request ke: ${urlObj.origin}${urlObj.pathname}`);

    const req = client.request(
      fullUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'User-Agent': 'Meteorit-Cron-Scheduler/1.0',
          'Accept': 'application/json',
        },
        timeout: 120000, // 2 menit timeout
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`);
          try {
            const parsed = JSON.parse(body);
            console.log(`📄 Response:`, JSON.stringify(parsed, null, 2).slice(0, 500));
          } catch (e) {
            console.log(`📄 Response (raw):`, body.slice(0, 500));
          }
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode });
        });
      }
    );

    req.on('error', (err) => {
      console.error(`❌ Request Error: ${err.message}`);
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`⏰ Request Timeout (120s)`);
      resolve({ ok: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function run() {
  const args = process.argv.slice(2);
  const taskArgIndex = args.indexOf('--task');
  const targetTask = taskArgIndex !== -1 ? args[taskArgIndex + 1] : null;
  const runAll = args.includes('--all');

  const currentHourUTC = new Date().getUTCHours();
  console.log(`🚀 [Meteorit Cron Scheduler] Memulai eksekusi.`);
  console.log(`📍 Site Target: ${SITE_URL}`);
  console.log(`🕒 Waktu saat ini (UTC): ${currentHourUTC}:00`);

  let tasksToRun = [];

  if (targetTask) {
    tasksToRun = CRON_SCHEDULE.filter(t => t.id === targetTask || t.path.endsWith(targetTask));
    if (tasksToRun.length === 0) {
      console.error(`❌ Tugas "${targetTask}" tidak ditemukan dalam daftar jadwal.`);
      process.exit(1);
    }
  } else if (runAll) {
    console.log(`⚠️ Mode: Menjalankan SEMUA tugas secara berurutan.`);
    tasksToRun = CRON_SCHEDULE;
  } else {
    tasksToRun = CRON_SCHEDULE.filter(t => t.hourUTC === currentHourUTC);
    console.log(`🕒 Mode Auto: Ditemukan ${tasksToRun.length} tugas yang terjadwal pada jam ${currentHourUTC}:00 UTC.`);
  }

  if (tasksToRun.length === 0) {
    console.log(`✨ Tidak ada tugas cron yang dijadwalkan pada jam ini. Selesai.`);
    return;
  }

  for (const task of tasksToRun) {
    console.log(`\n========================================`);
    console.log(`▶ Menjalankan: [${task.id}] ${task.desc}`);
    console.log(`========================================`);
    await requestEndpoint(task.path);
    // Beri jeda 3 detik antar request
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n🎉 Seluruh tugas cron selesai diproses.`);
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});

