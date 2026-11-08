export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendBroadcastNotification } from '@/lib/notifications';
import { getGlobalSettings } from '@/lib/settings';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';
export const maxDuration = 80;

// NASA API Configuration
const NASA_API_KEY = process.env.NASA_API_KEY || '';

async function rebuildR2MeteoritesCache() {
  try {
    let list: any[] = [];

    // 1. Prioritas: baca catalog.json yang sudah ada di R2 (berisi image_url AI yang valid)
    //    Ini WAJIB diutamakan karena Firestore di Edge Runtime selalu return empty (dummyFirestore)
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
    try {
      const r2Res = await fetch(`${R2_PUBLIC_URL}/data/meteorites/catalog.json?_t=${Date.now()}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (r2Res.ok) {
        const existing = await r2Res.json() as any[];
        if (Array.isArray(existing) && existing.length > 0) {
          list = existing;
          console.log(`[Cron] rebuildR2MeteoritesCache: loaded ${list.length} from existing R2 catalog (image_url preserved)`);
        }
      }
    } catch (r2Err) {
      console.warn('[Cron] Failed to load existing R2 catalog, trying D1:', r2Err);
    }

    // 2. Fallback ke D1 jika R2 kosong/gagal
    if (list.length === 0) {
      try {
        const { queryD1 } = await import('@/lib/d1Client');
        const d1Res = await queryD1('SELECT * FROM meteorites');
        if (d1Res?.results?.length) {
          list = d1Res.results as any[];
          console.log(`[Cron] rebuildR2MeteoritesCache: loaded ${list.length} from D1`);
        }
      } catch (d1Err) {
        console.warn('Failed to load meteorites from D1:', d1Err);
      }
    }

    // 3. Merge newly processed meteorites (from processedMeteorites arg) — dilakukan oleh caller
    //    Di sini hanya rebuild ulang dari sumber yang sudah ada + merge yang baru
    if (list.length === 0) {
      console.warn('[Cron] rebuildR2MeteoritesCache: no data found in R2 or D1, skipping rebuild');
      return;
    }

    await uploadToR2('data/meteorites/catalog.json', JSON.stringify(list, null, 2), 'application/json');
    console.log("Successfully rebuilt R2 meteorites catalog cache. Total items:", list.length);

    // Sync ke Cloudflare D1 (PRESERVE image_url yang sudah ada)
    try {
      const { queryD1 } = await import('@/lib/d1Client');
      for (const item of list) {
        await queryD1(
          `INSERT OR REPLACE INTO meteorites (
            id, name, translated_name, mass, year, recclass, lat, long, description, translated_description, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            String(item.id),
            item.name || '',
            item.translated_name || item.name || '',
            item.mass || '',
            item.year || '',
            item.recclass || '',
            item.lat || '0',
            item.long || '0',
            item.description || '',
            item.translated_description || item.description || '',
            item.image_url || '' // JANGAN kosongkan: preserve URL gambar AI yang sudah ada
          ]
        );
      }
    } catch (d1Err) {
      console.warn("Failed to sync meteorites to D1:", d1Err);
    }
  } catch (err) {
    console.error("Failed to rebuild R2 meteorites cache:", err);
  }
}

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target'); // 'apod' | 'meteorites' | undefined (both)

  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try deleting the bad APOD entry 2026-06-23 if it exists (one-time cleanup)
  try {
    await adminDb.collection('apod_history').doc('2026-06-23').delete();
    console.log("Cleanup: Deleted bad APOD entry 2026-06-23 from Firestore.");
  } catch (cleanupErr) {
    console.warn("Cleanup: Failed to delete bad APOD entry 2026-06-23:", cleanupErr);
  }

  const runApod = !target || target === 'apod';
  const runMeteorites = !target || target === 'meteorites';

  try {
    // === 1. NASA APOD Harvester ("Benda Langit Hari Ini") ===
    let formattedApod = {
      id: new Date().toISOString().split('T')[0],
      title: {
        en: "Meteor Shower over Indonesia",
        id: "Hujan Meteor di Langit Indonesia"
      },
      explanation: {
        en: "A beautiful display of shooting stars captured in the night skies of Indonesia, highlighting celestial beauty.",
        id: "Tampilan indah bintang jatuh yang ditangkap di langit malam Indonesia, menyoroti keindahan benda angkasa luar biasa."
      },
      image_url: "https://placehold.co/800x500/020617/f59e0b?text=Hujan+Meteor",
      copyright: "Kolektor Astronomi",
      media_type: "image"
    };

async function rebuildR2ApodHistoryCache() {
  try {
    const { queryD1 } = await import('@/lib/d1Client');
    const d1Res = await queryD1('SELECT id, date, title, explanation, image_url, copyright FROM apod_history ORDER BY id DESC LIMIT 150');
    if (d1Res?.results?.length) {
      const historyList = d1Res.results.map((r: any) => ({
        id: r.id,
        title: typeof r.title === 'string' && r.title.startsWith('{') ? JSON.parse(r.title) : { en: r.title, id: r.title },
        explanation: typeof r.explanation === 'string' && r.explanation.startsWith('{') ? JSON.parse(r.explanation) : { en: r.explanation, id: r.explanation },
        image_url: r.image_url,
        copyright: r.copyright || 'NASA Public Domain',
        media_type: 'image'
      }));
      await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
      console.log('[Cron Route] Successfully rebuilt APOD history cache in R2 from D1. Total:', historyList.length);
    }
  } catch (err) {
    console.error('[Cron Route] Failed to rebuild APOD history cache:', err);
  }
}

    if (runApod) {
      try {
        const apodRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
        if (apodRes.ok) {
          const apodData = await apodRes.json();
          const apodDate = apodData.date || new Date().toISOString().split('T')[0];

          // Check if today's APOD already exists in Firestore to avoid duplicate translation and R2 uploads
          const docRef = adminDb.collection('apod_history').doc(apodDate);
          const docSnap = await docRef.get();

          if (docSnap.exists) {
            console.log(`APOD for date ${apodDate} already exists. Skipping Groq translation.`);
            formattedApod = docSnap.data() as typeof formattedApod;
          } else {
            // Translate APOD details with strict system instructions to avoid conversation prefixes
            const translatedTitle = await translateText(
              apodData.title, 
              'Terjemahkan judul astronomi berikut ke Bahasa Indonesia secara singkat dan menarik. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA penjelasan, pengantar, tanda kutip, atau kalimat pembuka seperti "Terjemahan judul adalah:".'
            );
            const translatedExplanation = await translateText(
              apodData.explanation, 
              'Terjemahkan deskripsi ilmiah astronomi berikut ke Bahasa Indonesia yang mudah dipahami oleh pembaca umum. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA pengantar atau kalimat pembuka.'
            );

            // Download and cache the APOD image to R2 directly to prevent NASA rate limits
            let finalImageUrl = apodData.hdurl || apodData.url;
            try {
              if (apodData.media_type === 'video') {
                // Keep original video embed URL
                finalImageUrl = apodData.url;
              } else {
                const imgFetch = await fetch(finalImageUrl);
                if (imgFetch.ok) {
                  const buffer = Buffer.from(await imgFetch.arrayBuffer());
                  const ext = finalImageUrl.split('.').pop()?.split('?')[0] || 'jpg';
                  const imgKey = `data/encyclopedia/images/${apodData.date}.${ext}`;
                  const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
                  finalImageUrl = await uploadToR2(imgKey, buffer, contentType);
                }
              }
            } catch (imgErr) {
              console.error("Failed to cache NASA image to R2:", imgErr);
            }

            const attribution = "\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa";
            formattedApod = {
              id: apodData.date,
              title: {
                en: apodData.title,
                id: translatedTitle
              },
              explanation: {
                en: apodData.explanation + attribution,
                id: translatedExplanation + attribution
              },
              image_url: finalImageUrl,
              copyright: apodData.copyright || 'NASA Public Domain',
              media_type: apodData.media_type || 'image'
            };

            // Upload APOD as latest.json to Cloudflare R2
            await uploadToR2('data/encyclopedia/latest.json', JSON.stringify(formattedApod, null, 2), 'application/json');

            // Also backup APOD to Firestore
            await adminDb.collection('apod_history').doc(formattedApod.id).set(formattedApod);
          }

          // Always ensure R2 history.json is rebuilt with the latest Firestore APOD collection
          await rebuildR2ApodHistoryCache();
        }
      } catch (e) {
        console.warn("NASA APOD rate limited or unavailable, using fallback:", e);
      }
    }

    // === 2. NASA Meteorite Catalog Harvester (y77d-th95) ===
    const FALLBACK_METEORITES = [
      {
        id: "1",
        name: "Alais",
        recclass: "CI1",
        mass: "6000",
        year: "1806-01-01T00:00:00.000",
        reclat: "44.116670",
        reclong: "4.083330"
      },
      {
        id: "2",
        name: "Allende",
        recclass: "CV3",
        mass: "2000000",
        year: "1969-01-01T00:00:00.000",
        reclat: "26.966670",
        reclong: "-105.316670"
      },
      {
        id: "3",
        name: "Cape York",
        recclass: "IIIAB",
        mass: "58200000",
        year: "1818-01-01T00:00:00.000",
        reclat: "76.133330",
        reclong: "-64.933330"
      },
      {
        id: "4",
        name: "Chelyabinsk",
        recclass: "LL5",
        mass: "100000",
        year: "2013-01-01T00:00:00.000",
        reclat: "54.816670",
        reclong: "61.116670"
      },
      {
        id: "5",
        name: "Hoba",
        recclass: "Iron, IVB",
        mass: "60000000",
        year: "1920-01-01T00:00:00.000",
        reclat: "-19.592500",
        reclong: "17.937500"
      },
      {
        id: "6",
        name: "Murchison",
        recclass: "CM2",
        mass: "100000",
        year: "1969-01-01T00:00:00.000",
        reclat: "-36.616670",
        reclong: "145.200000"
      },
      {
        id: "7",
        name: "Sikhote-Alin",
        recclass: "Iron, IIAB",
        mass: "23000000",
        year: "1947-01-01T00:00:00.000",
        reclat: "46.160000",
        reclong: "134.653330"
      },
      {
        id: "8",
        name: "Willamette",
        recclass: "Iron, IIIAB",
        mass: "14150000",
        year: "1902-01-01T00:00:00.000",
        reclat: "45.370000",
        reclong: "-122.700000"
      },
      {
        id: "9",
        name: "Banten",
        recclass: "CM2",
        mass: "629",
        year: "1933-01-01T00:00:00.000",
        reclat: "-6.330000",
        reclong: "106.000000"
      },
      {
        id: "10",
        name: "Pasamonte",
        recclass: "Howardite",
        mass: "2400",
        year: "1937-01-01T00:00:00.000",
        reclat: "34.800000",
        reclong: "-103.400000"
      },
      {
        id: "11",
        name: "Jilin",
        recclass: "H5",
        mass: "4000000",
        year: "1976-01-01T00:00:00.000",
        reclat: "44.050000",
        reclong: "126.216670"
      },
      {
        id: "12",
        name: "Shergotty",
        recclass: "Martian (shergottite)",
        mass: "5000",
        year: "1865-01-01T00:00:00.000",
        reclat: "24.550000",
        reclong: "84.833330"
      }
    ];

    let meteorites: any[] = [];
    let processedMeteoritesCount = 0;
    
    if (runMeteorites) {
      const settings = await getGlobalSettings();
      const limit = settings.encyclopediaCronLimit || 20;

      try {
        // Fetch NASA API with random offset (0 to 30000) and a 6-second timeout signal
        const randomOffset = Math.floor(Math.random() * 30000);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const meteoriteRes = await fetch(`https://data.nasa.gov/resource/y77d-th95.json?$limit=${limit}&$offset=${randomOffset}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (meteoriteRes.ok) {
          const rawData = await meteoriteRes.json();
          meteorites = rawData.map((f: any) => ({
            ...f,
            id: String(f.id)
          }));
        } else {
          throw new Error(`NASA API returned status ${meteoriteRes.status}`);
        }
      } catch (err) {
        console.warn("Failed to fetch NASA Meteorite API, trying freeCodeCamp mirror fallback. Error:", err);
        try {
          const mirrorRes = await fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json');
          if (mirrorRes.ok) {
            const fccData = await mirrorRes.json();
            if (fccData.features && fccData.features.length > 0) {
              // Take random items from mirror
              const maxStart = Math.max(0, fccData.features.length - limit);
              const startIndex = Math.floor(Math.random() * maxStart);
              const slicedFeatures = fccData.features.slice(startIndex, startIndex + limit);
              
              meteorites = slicedFeatures.map((f: any) => ({
                id: String(f.properties.id),
                name: f.properties.name,
                recclass: f.properties.recclass,
                mass: f.properties.mass,
                year: f.properties.year,
                reclat: f.properties.reclat,
                reclong: f.properties.reclong
              }));
              console.log(`Successfully fetched ${limit} randomized meteorites from freeCodeCamp mirror (start index: ${startIndex}).`);
            }
          }
        } catch (mirrorErr) {
          console.error("freeCodeCamp mirror fallback failed:", mirrorErr);
        }
      }

      if (!meteorites || meteorites.length === 0) {
        meteorites = FALLBACK_METEORITES.map(m => ({ ...m, id: String(m.id) }));
      }

      let processedMeteorites = [];
      let newMeteoritesCount = 0;
      let latestNewMeteoriteName = "";
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
      const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

      for (const met of meteorites) {
        // Formulate descriptive detail via Groq AI based on class and properties
        const metId = String(met.id);
        const name = met.name || 'Unknown';
        const type = met.recclass || 'Meteorit';
        const mass = met.mass ? `${(parseFloat(met.mass) / 1000).toFixed(2)} kg` : 'Tidak diketahui';
        const year = met.year ? new Date(met.year).getFullYear() : 'Tidak diketahui';

        // 3 Paragraph AI Prompt including Research and References
        const aiPrompt = `Tulis penjelasan mendalam dalam Bahasa Indonesia tentang meteorit bernama "${name}" yang merupakan tipe/kelas "${type}" dengan berat "${mass}" yang jatuh/ditemukan pada tahun "${year}".
Penjelasan harus sangat detail dan memenuhi kriteria berikut:
1. Terdiri dari minimal 3 paragraf panjang yang menjelaskan sejarah pendaratan/penemuan, ciri-ciri fisik khasnya, dan pentingnya bagi sains.
2. Memiliki bagian "Hasil Penelitian" yang menjelaskan hasil analisis laboratorium atau studi geologis terhadap meteorit ini.
3. Memiliki bagian "Referensi" yang mencantumkan setidaknya 1-2 sumber referensi ilmiah populer.
Tuliskan langsung dalam format markdown yang rapi tanpa kata pengantar tambahan.`;

        let descriptionId = await translateText(aiPrompt, 'Kamu adalah asisten astronomi pintar berbahasa Indonesia.');

        // Fallback jika API Groq gagal/rate limit sehingga mengembalikan teks prompt aslinya
        if (!descriptionId || descriptionId === aiPrompt || descriptionId.includes('Tulis penjelasan mendalam')) {
          descriptionId = `**${name}** adalah meteorit berjenis **${type}** dengan massa sekitar **${mass}** yang ditemukan atau jatuh pada tahun **${year}**.\n\n` +
            `### Deskripsi\nMeteorit ini merupakan salah satu spesimen penting dalam studi keplanetan dan klasifikasi meteorit. Klasifikasi kelas ${type} menunjukkan karakteristik komposisi mineral dan sejarah pembentukan batuan ruang angkasa ini.\n\n` +
            `### Hasil Penelitian\nAnalisis laboratorium lebih lanjut diperlukan untuk mengungkap detail mineralogi spesifik dari spesimen ini.\n\n` +
            `### Referensi\n- NASA Meteorite Landings Database\n- The Meteoritical Society Database`;
        }

        // Dynamic illustration prompt based on class
        let classDescription = "stony meteorite rock";
        const lowerType = type.toLowerCase();
        if (lowerType.includes('iron') || lowerType.includes('iiiab') || lowerType.includes('ivb') || lowerType.includes('iiab')) {
          classDescription = "metallic iron-nickel meteorite, silver metallic fusion crust, crystalline Widmanstätten pattern";
        } else if (lowerType.includes('pallasite')) {
          classDescription = "pallasite meteorite slice, translucent golden-green olivine crystals embedded in a shiny iron-nickel metal matrix";
        } else if (lowerType.includes('martian') || lowerType.includes('shergottite') || lowerType.includes('nakhlite')) {
          classDescription = "martian meteorite, basaltic reddish-brown volcanic space rock from Mars";
        } else if (lowerType.includes('chondrite') || lowerType.includes('h5') || lowerType.includes('ll5') || lowerType.includes('cm2') || lowerType.includes('cv3')) {
          classDescription = "chondrite stony meteorite, dark fusion crust with tiny visible glass-like spherical silicate chondrules inside";
        }

        const promptText = `A high-quality realistic close-up photo of the famous ${name} meteorite, classified as ${type}. Showing its unique characteristics: ${classDescription}. Detailed texture, dark space background, scientific display.`;
        const imagePath = `data/meteorites/images/${metId}.jpg`;
        const { generateImageWithFallback } = await import('@/lib/imageGenerator');
        const imageUrl = await generateImageWithFallback(promptText, imagePath);

        const metData = {
          id: metId,
          name: name,
          translated_name: name,
          mass: mass,
          year: year.toString(),
          recclass: type,
          lat: met.lat || met.reclat || '0',
          long: met.long || met.reclong || '0',
          description: `Meteorite landing named ${name} categorized as class ${type}.`,
          translated_description: descriptionId,
          image_url: imageUrl
        };

        processedMeteorites.push(metData);

        // Simpan ke D1 segera (dengan image_url yang baru di-generate)
        try {
          const { queryD1 } = await import('@/lib/d1Client');
          await queryD1(
            `INSERT OR REPLACE INTO meteorites (
              id, name, translated_name, mass, year, recclass, lat, long, description, translated_description, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              String(metData.id), metData.name, metData.translated_name,
              metData.mass, metData.year, metData.recclass,
              metData.lat, metData.long, metData.description,
              metData.translated_description, metData.image_url || ''
            ]
          );
        } catch (d1SaveErr) {
          console.warn('[Cron] Gagal simpan meteorit ke D1:', d1SaveErr);
        }

        // Check if this is a new meteorite
        const docRef = adminDb.collection('meteorites').doc(metId);
        const docSnap = await docRef.get();
        const isNew = !docSnap.exists;

        if (isNew) {
          newMeteoritesCount++;
          latestNewMeteoriteName = name;

          // Send auto-link to Telegram channel, Facebook, and Web Push
          const postUrl = getAbsoluteUrl(`/ensiklopedia/${metId}`);
          const channelMsg = `☄️ <b>Meteorit Baru Terdaftar di Ensiklopedia!</b>\n\n` +
            `<b>Nama:</b> ${name}\n` +
            `<b>Tipe / Kelas:</b> ${type}\n` +
            `<b>Massa:</b> ${mass}\n` +
            `<b>Tahun:</b> ${year}\n\n` +
            `🔗 Baca detail & analisis sains lengkapnya di sini:\n${postUrl}`;
          
          await sendBroadcastNotification({
            title: `☄️ Meteorit Baru: ${name}`,
            body: `Meteorit Baru Terdaftar di Ensiklopedia!\nNama: ${name}\nTipe / Kelas: ${type}\nMassa: ${mass}\nTahun: ${year}`,
            telegramHtml: channelMsg,
            link: `/ensiklopedia/${metId}`,
            imageUrl: metData.image_url
          });
        }

        // Save to Firestore center backups
        await docRef.set(metData);
      }

      processedMeteoritesCount = processedMeteorites.length;

      // Merge meteorit yang baru diproses dengan R2 catalog yang sudah ada (preserve image_url lama)
      // rebuildR2MeteoritesCache() kini baca R2 existing dulu → merge → update R2 & D1
      if (processedMeteorites.length > 0) {
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
        try {
          const catalogRes = await fetch(`${R2_PUBLIC_URL}/data/meteorites/catalog.json?_t=${Date.now()}`, {
            signal: AbortSignal.timeout(5000)
          });
          if (catalogRes.ok) {
            const existing = await catalogRes.json() as any[];
            const existingMap = new Map(existing.map((m: any) => [String(m.id), m]));
            // Merge: data baru override data lama (tapi image_url baru LEBIH PRIORITAS)
            for (const met of processedMeteorites) {
              existingMap.set(String(met.id), met);
            }
            const merged = Array.from(existingMap.values());
            await uploadToR2('data/meteorites/catalog.json', JSON.stringify(merged, null, 2), 'application/json');
            console.log(`[Cron] Merged catalog: ${merged.length} total meteorites in R2`);
          } else {
            // Jika R2 catalog belum ada, buat baru dari processedMeteorites
            await uploadToR2('data/meteorites/catalog.json', JSON.stringify(processedMeteorites, null, 2), 'application/json');
          }
        } catch (mergeErr) {
          console.warn('[Cron] Gagal merge catalog R2, rebuild ulang:', mergeErr);
          await rebuildR2MeteoritesCache();
        }
      } else {
        // Tidak ada meteorit baru: rebuild dari R2/D1 existing (preserve semua image_url)
        await rebuildR2MeteoritesCache();
      }

      // Get total statistics for report
      const totalArticles = await adminDb.collection('articles').get().then((snap: any) => snap.size);
      const totalMeteorites = await adminDb.collection('meteorites').get().then((snap: any) => snap.size);

      // Send success report to Admin Chat
      const successMsg = `📢 <b>LAPORAN CRON JOB ENSiklopedia METEORIT</b>\n\n` +
        `🟢 <b>Status:</b> Sukses (Success)\n` +
        `📊 <b>Statistik Sistem:</b>\n` +
        `   • Total Artikel: ${totalArticles}\n` +
        `   • Total Ensiklopedia: ${totalMeteorites}\n` +
        `   • Data Baru Ditambahkan: ${newMeteoritesCount} meteorit\n` +
        (newMeteoritesCount > 0 ? `   • Judul Terkini: ${latestNewMeteoriteName}\n` : '') +
        `   • APOD Benda Langit: "${formattedApod.title.id}"\n\n` +
        `🛠 <i>Sistem berjalan otomatis, semua cache R2 telah di-refresh.</i>`;
      await sendTelegramMessage(TELEGRAM_CHAT_ID, successMsg);
    }

    return NextResponse.json({
      success: true,
      message: 'NASA APOD and/or Meteorite data processed successfully.',
      apod: runApod ? formattedApod.title.id : 'skipped',
      meteoritesCount: processedMeteoritesCount
    });

  } catch (error) {
    console.error('Error in cron job:', error);
    
    // Send fail report to Admin Chat
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg = `⚠️ <b>LAPORAN CRON JOB GAGAL (Ensiklopedia)</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}\n` +
      `🛠 <b>Status:</b> Failed`;
    try {
      await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg);
    } catch {}

    return NextResponse.json(
      { error: 'Failed to process NASA API synchronization', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
