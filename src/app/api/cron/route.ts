import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { getGlobalSettings } from '@/lib/settings';
import { getAbsoluteUrl } from '@/lib/siteUrl';

// NASA API Configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';

// AI Translation using Groq API
async function translateText(text: string, systemPrompt = 'Terjemahkan teks berikut ke bahasa Indonesia dengan gaya penulisan sains populer yang menarik.'): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || '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'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    const result = await response.json();
    if (result.choices && result.choices[0]?.message?.content) {
      return result.choices[0].message.content.trim();
    }
    return text;
  } catch (error) {
    console.error('Groq Translation error:', error);
    return text;
  }
}

async function rebuildR2MeteoritesCache() {
  try {
    const snapshot = await adminDb.collection('meteorites').get();
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      list.push({ id: doc.id, ...data });
    });
    await uploadToR2('data/meteorites/catalog.json', JSON.stringify(list, null, 2), 'application/json');
    console.log("Successfully rebuilt R2 meteorites catalog cache. Total items:", list.length);
  } catch (err) {
    console.error("Failed to rebuild R2 meteorites cache:", err);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const target = searchParams.get('target'); // 'apod' | 'meteorites' | undefined (both)
  const authHeader = request.headers.get('authorization');

  // Verify the cron secret (supports query param or Vercel authorization header)
  if (
    secret !== (process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=') &&
    authHeader !== `Bearer ${process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU='}`
  ) {
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
            console.log(`APOD for date ${apodDate} already exists. Skipping Groq translation and R2 rebuild.`);
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

            formattedApod = {
              id: apodData.date,
              title: {
                en: apodData.title,
                id: translatedTitle
              },
              explanation: {
                en: apodData.explanation,
                id: translatedExplanation
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
        // Fetch NASA API with a 6-second timeout signal
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const meteoriteRes = await fetch(`https://data.nasa.gov/resource/y77d-th95.json?$limit=${limit}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (meteoriteRes.ok) {
          meteorites = await meteoriteRes.json();
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
                id: f.properties.id,
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
        meteorites = FALLBACK_METEORITES;
      }

      let processedMeteorites = [];
      let newMeteoritesCount = 0;
      let latestNewMeteoriteName = "";
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
      const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

      for (const met of meteorites) {
        // Formulate descriptive detail via Groq AI based on class and properties
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
        const promptSeed = encodeURIComponent(promptText);
        const imageUrl = `https://image.pollinations.ai/prompt/${promptSeed}?width=600&height=400&nologo=true&seed=${met.id}`;

        const metData = {
          id: met.id,
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

        // Check if this is a new meteorite
        const docRef = adminDb.collection('meteorites').doc(met.id);
        const docSnap = await docRef.get();
        const isNew = !docSnap.exists;

        if (isNew) {
          newMeteoritesCount++;
          latestNewMeteoriteName = name;

          // Send auto-link to Telegram channel
          const postUrl = getAbsoluteUrl(`/ensiklopedia/${met.id}`);
          const channelMsg = `☄️ <b>Meteorit Baru Terdaftar di Ensiklopedia!</b>\n\n` +
            `<b>Nama:</b> ${name}\n` +
            `<b>Tipe / Kelas:</b> ${type}\n` +
            `<b>Massa:</b> ${mass}\n` +
            `<b>Tahun:</b> ${year}\n\n` +
            `🔗 Baca detail & analisis sains lengkapnya di sini:\n${postUrl}`;
          await sendTelegramMessage(TELEGRAM_CHANNEL_ID, channelMsg);
        }

        // Save to Firestore center backups
        await docRef.set(metData);
      }

      processedMeteoritesCount = processedMeteorites.length;

      // Rebuild the complete consolidated catalog cache in R2 from all Firestore meteorites!
      await rebuildR2MeteoritesCache();

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
