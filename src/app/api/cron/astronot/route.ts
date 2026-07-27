import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendBroadcastNotification } from '@/lib/notifications';
import { buildAstronautDataset, FALLBACK_ASTRONAUTS, type AstronautProfile } from '@/lib/astronautData';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const maxDuration = 80;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

const UPCOMING_AND_RETURNED_PRESETS = FALLBACK_ASTRONAUTS.filter((astronaut) => astronaut.status !== 'active');

function getSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

// Preset Premium Fallback untuk Astronot Aktif
const PRESET_ASTRONAUTS: Record<string, { name: string; country: string; agency: string; role: string; launchDate: string; biography: string }> = {
  'oleg-kononenko': { 
    name: 'Oleg Kononenko', 
    country: 'Rusia', 
    agency: 'Roscosmos', 
    role: 'Commander', 
    launchDate: '2023-09-15', 
    biography: 'Oleg Kononenko adalah kosmonot veteran Rusia dari Roscosmos. Ia adalah salah satu kosmonot paling berpengalaman di dunia dengan beberapa misi ke Stasiun Luar Angkasa Internasional (ISS). Dalam misi terbarunya, ia menjabat sebagai Commander di ISS, memimpin tim multinasional untuk menjalankan berbagai eksperimen ilmiah dan pemeliharaan stasiun. Kononenko lahir di Turkmenistan dan telah meraih gelar dari Kharkov Aviation Institute. Pengalamannya mencakup spacewalk (EVA) dan operasi lengan robot Canadarm.' 
  },
  'nikolai-chub': { 
    name: 'Nikolai Chub', 
    country: 'Rusia', 
    agency: 'Roscosmos', 
    role: 'Flight Engineer', 
    launchDate: '2023-09-15', 
    biography: 'Nikolai Chub adalah kosmonot Rusia yang terpilih dalam kelompok kosmonot Roscosmos angkatan 2018. Ini merupakan penerbangan luar angkasa perdananya, di mana ia bertugas sebagai Flight Engineer di ISS bersama Oleg Kononenko. Chub memiliki latar belakang teknik dan menjalani pelatihan intensif selama bertahun-tahun sebelum terpilih untuk misi ini. Selama di ISS, ia terlibat dalam berbagai eksperimen ilmiah bidang biologi dan fisika dalam kondisi gravitasi mikro.' 
  },
  'tracy-caldwell-dyson': { 
    name: 'Tracy Caldwell Dyson', 
    country: 'Amerika Serikat', 
    agency: 'NASA', 
    role: 'Flight Engineer', 
    launchDate: '2024-03-23', 
    biography: 'Tracy Caldwell Dyson adalah astronot NASA dengan gelar PhD di bidang kimia dari University of California, Davis. Ini adalah penerbangan ketiganya ke ISS. Dyson dikenal dengan kepribadiannya yang bersemangat dan seringkali berbagi pengalaman luar angkasanya melalui media sosial, termasuk foto-foto menakjubkan Bumi dari cupola ISS. Ia terlibat dalam penelitian kimia dan biologi di lingkungan gravitasi mikro serta melakukan pemeliharaan sistem ISS.' 
  },
  'butch-wilmore': { 
    name: 'Butch Wilmore', 
    country: 'Amerika Serikat', 
    agency: 'NASA', 
    role: 'Commander', 
    launchDate: '2024-06-05', 
    biography: 'Barry "Butch" Wilmore adalah kapten Angkatan Laut AS yang pensiun dan astronot NASA berpengalaman. Ia telah menerbangkan berbagai pesawat taktis dan merupakan instruktur penerbangan uji. Wilmore terbang ke ISS dengan wahana Boeing Starliner bersama Suni Williams dalam misi pengujian. Ia memiliki pengalaman EVA (spacewalk) dan pernah menjabat sebagai Commander ISS pada misi sebelumnya. Sebagai seorang Kristen yang taat, ia sering menyampaikan refleksi spiritual tentang pengalaman melihat Bumi dari angkasa.' 
  },
  'suni-williams': { 
    name: 'Suni Williams', 
    country: 'Amerika Serikat', 
    agency: 'NASA', 
    role: 'Flight Engineer', 
    launchDate: '2024-06-05', 
    biography: 'Sunita "Suni" Williams adalah astronot veteran NASA dengan rekam jejak luar biasa. Ia adalah mantan perwira Angkatan Laut AS dan pilot uji yang berpengalaman. Williams telah menghabiskan lebih dari 300 hari di luar angkasa dalam beberapa misi. Ia memegang rekor spacewalk terbanyak oleh astronot perempuan. Williams terbang ke ISS dengan wahana Boeing Starliner dalam misi pengujian. Ia dikenal karena semangat dan energinya yang tinggi, bahkan berlari maraton di treadmill ISS.' 
  },
  'matthew-dominick': { 
    name: 'Matthew Dominick', 
    country: 'Amerika Serikat', 
    agency: 'NASA', 
    role: 'Flight Engineer', 
    launchDate: '2024-03-04', 
    biography: 'Matthew Dominick adalah astronot NASA angkatan 2017. Sebelum bergabung dengan NASA, ia adalah pilot tempur Angkatan Laut dengan jam terbang lebih dari 1.500 jam. Ini adalah penerbangan luar angkasa perdananya sebagai bagian dari misi Crew-8 dengan kapsul SpaceX Crew Dragon. Di ISS, ia terlibat dalam penelitian ilmiah dan operasi pemeliharaan sistem stasiun.' 
  },
  'michael-barratt': { 
    name: 'Michael Barratt', 
    country: 'Amerika Serikat', 
    agency: 'NASA', 
    role: 'Flight Engineer', 
    launchDate: '2024-03-04', 
    biography: 'Michael Barratt adalah dokter dan astronot NASA berpengalaman. Ia memiliki gelar kedokteran dari Northwestern University dan spesialisasi di bidang kedokteran penerbangan. Ini adalah penerbangan ketiganya ke ISS. Kontribusi utamanya adalah penelitian medis tentang dampak gravitasi mikro terhadap tubuh manusia, yang sangat penting untuk merencanakan misi jangka panjang ke Bulan dan Mars.' 
  },
  'jeanette-epps': { 
    name: 'Jeanette Epps', 
    country: 'Amerika Serikat', 
    agency: 'NASA', 
    role: 'Flight Engineer', 
    launchDate: '2024-03-04', 
    biography: 'Jeanette Epps adalah astronot NASA dengan gelar PhD dalam teknik kedirgantaraan dari University of Maryland. Ia adalah anggota NASA dari Crew-8 yang terbang dengan SpaceX Crew Dragon. Sebelum menjadi astronot, Epps bekerja sebagai insinyur di Ford Motor Company dan kemudian di CIA sebagai ilmuwan teknis. Ia merupakan astronot Afrika-Amerika perempuan pertama yang bertugas dalam ekspedisi jangka panjang di ISS.' 
  },
  'alexander-grebenkin': { 
    name: 'Alexander Grebenkin', 
    country: 'Rusia', 
    agency: 'Roscosmos', 
    role: 'Flight Engineer', 
    launchDate: '2024-03-04', 
    biography: 'Alexander Grebenkin adalah kosmonot Rusia yang bergabung dalam kelompok kosmonot Roscosmos. Ia bertugas sebagai Flight Engineer di ISS bersama kru Crew-8. Dalam misinya, ia bertanggung jawab atas operasi dan pemeliharaan sistem ISS dari sisi Rusia, serta berpartisipasi dalam eksperimen ilmiah yang dirancang bersama tim internasional.' 
  },
  'li-guangsu': { 
    name: 'Li Guangsu', 
    country: 'Tiongkok', 
    agency: 'CNSA', 
    role: 'Flight Engineer', 
    launchDate: '2024-04-25', 
    biography: 'Li Guangsu adalah taikonot (astronot Tiongkok) dari China National Space Administration (CNSA). Ia bertugas di Stasiun Luar Angkasa Tiangong dalam misi Shenzhou. Sebagai Flight Engineer, Li bertanggung jawab atas operasi teknis dan eksperimen ilmiah di modul Tiangong. Tiongkok terus mengembangkan program antariksa mereka secara mandiri dengan tujuan membangun kehadiran permanen di orbit rendah Bumi.' 
  },
  'li-cong': { 
    name: 'Li Cong', 
    country: 'Tiongkok', 
    agency: 'CNSA', 
    role: 'Flight Engineer', 
    launchDate: '2024-04-25', 
    biography: 'Li Cong adalah taikonot dari China National Space Administration yang bertugas di Stasiun Luar Angkasa Tiangong. Ia memiliki latar belakang militer dan teknik, serta telah melalui pelatihan ketat yang diselenggarakan oleh CNSA. Dalam misinya, Li Cong terlibat dalam uji coba teknologi baru dan eksperimen sains yang mendukung ambisi Tiongkok untuk misi berawak ke Bulan.' 
  },
  'ye-guangfu': { 
    name: 'Ye Guangfu', 
    country: 'Tiongkok', 
    agency: 'CNSA', 
    role: 'Commander', 
    launchDate: '2024-04-25', 
    biography: 'Ye Guangfu adalah taikonot dan komandan misi CNSA di Stasiun Luar Angkasa Tiangong. Ini adalah penerbangan keduanya setelah menyelesaikan misi Shenzhou-13. Sebagai Commander, Ye memimpin seluruh kru dalam operasi harian stasiun, kegiatan spacewalk, dan penelitian ilmiah. Ia juga pernah menjadi taikonot pertama Tiongkok yang melakukan spacewalk bersama taikonot dari negara lain.' 
  },
};

// AI generation with fallback chain: Groq → OpenRouter → Mistral
async function generateWithAI(prompt: string): Promise<string> {
  // 1. Try Groq
  if (GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Anda adalah ahli biografi luar angkasa. Kembalikan output dalam format JSON murni.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(4000) // 4 seconds limit
      });
      if (res.ok) {
        const json = await res.json();
        const content = json.choices[0].message.content.trim();
        JSON.parse(content);
        console.log('[Cron Astronot] Generated via Groq');
        return content;
      }
    } catch (err) {
      console.warn('[Cron Astronot] Groq failed, trying fallback:', err);
    }
  }

  // 2. Fallback: OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': getSiteUrl(),
          'X-Title': 'Meteorit Indonesia'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: 'Anda adalah ahli biografi luar angkasa. Kembalikan output dalam format JSON murni tanpa markdown.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        const content = json.choices[0].message.content.trim()
          .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        JSON.parse(content);
        console.log('[Cron Astronot] Generated via OpenRouter');
        return content;
      }
    } catch (err) {
      console.warn('[Cron Astronot] OpenRouter failed, trying fallback:', err);
    }
  }

  // 3. Fallback: Mistral
  if (MISTRAL_API_KEY) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            { role: 'system', content: 'Anda adalah ahli biografi luar angkasa. Kembalikan output dalam format JSON murni tanpa markdown.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        const content = json.choices[0].message.content.trim()
          .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        JSON.parse(content);
        console.log('[Cron Astronot] Generated via Mistral');
        return content;
      }
    } catch (err) {
      console.warn('[Cron Astronot] Mistral failed:', err);
    }
  }

  throw new Error('Semua AI provider gagal digunakan.');
}

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let people: { name: string; craft: string }[] = [];

  try {
    // 1. Fetch current astronauts in space
    const resAstros = await fetch('https://api.open-notify.org/astros.json', {
      signal: AbortSignal.timeout(5000) // 5 seconds limit
    });
    if (resAstros.ok) {
      const dataAstros = await resAstros.json();
      people = dataAstros.people || [];
    } else {
      console.warn(`Open Notify API returned status ${resAstros.status}, switching to preset list.`);
    }
  } catch (e) {
    console.warn("Open Notify API down/timeout, switching to preset list:", e);
  }

  // Fallback ke preset list jika API open-notify down
  if (people.length === 0) {
    people = [
      { name: 'Oleg Kononenko', craft: 'ISS' },
      { name: 'Nikolai Chub', craft: 'ISS' },
      { name: 'Tracy Caldwell Dyson', craft: 'ISS' },
      { name: 'Butch Wilmore', craft: 'ISS' },
      { name: 'Suni Williams', craft: 'ISS' },
      { name: 'Matthew Dominick', craft: 'ISS' },
      { name: 'Michael Barratt', craft: 'ISS' },
      { name: 'Jeanette Epps', craft: 'ISS' },
      { name: 'Alexander Grebenkin', craft: 'ISS' },
      { name: 'Li Guangsu', craft: 'Tiangong' },
      { name: 'Li Cong', craft: 'Tiangong' },
      { name: 'Ye Guangfu', craft: 'Tiangong' }
    ];
  }

  const processed = [];
  const activeAstronauts: AstronautProfile[] = [];
  let aiCallCount = 0;

  try {
    for (const person of people) {
      const name = person.name;
      const craft = person.craft || 'ISS';
      const slug = getSlug(name);
      const docRef = adminDb.collection('astronauts').doc(slug);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const existing = docSnap.data() || {};
        const updatedDoc: AstronautProfile = {
          id: slug,
          name: existing.name || name,
          craft,
          country: existing.country || 'Tidak diketahui',
          agency: existing.agency || 'Agensi Antariksa',
          launchDate: existing.launchDate || new Date().toISOString().split('T')[0],
          role: existing.role || 'Astronot',
          biography: existing.biography || `${name} sedang menjalankan misi di ${craft}.`,
          imageUrl: existing.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(`professional official portrait photo astronaut ${name} in space suit`)}?width=400&height=500&nologo=true`,
          status: 'active',
          mission: existing.mission || `Misi aktif ${craft}`,
          source: 'Open Notify API + cache profil',
          updatedAt: new Date().toISOString()
        };
        await docRef.update({ ...updatedDoc, craft, status: 'active', updatedAt: new Date().toISOString() });
        activeAstronauts.push(updatedDoc);
        processed.push({ name, slug, status: 'Already exists — craft updated' });
        continue;
      }

      // Default profile dari preset atau fallback dasar
      const preset = PRESET_ASTRONAUTS[slug];
      let profileData = preset ? {
        fullname: preset.name,
        country: preset.country,
        agency: preset.agency,
        launchDate: preset.launchDate,
        role: preset.role,
        biography: preset.biography
      } : {
        fullname: name,
        country: 'Tidak diketahui',
        agency: 'Agensi Antariksa',
        launchDate: new Date().toISOString().split('T')[0],
        role: 'Astronot',
        biography: `${name} adalah astronot yang saat ini sedang menjalankan misi di ${craft}. Profil lengkap sedang diperbarui.`
      };

      // Hanya panggil AI generator maksimal 2 kali per request untuk menghindari timeout serverless
      if (aiCallCount < 2) {
        const prompt = `Tuliskan profil biografi lengkap astronot bernama "${name}" yang saat ini berada di ${craft} dalam Bahasa Indonesia.
  
  Ketentuan output:
  - Kembalikan HANYA string JSON murni (tanpa markdown, tanpa pembungkus apapun).
  - Format JSON yang wajib ada:
    {
      "fullname": "nama lengkap resmi astronot",
      "country": "negara asal dalam Bahasa Indonesia",
      "agency": "nama agensi antariksa",
      "launchDate": "tanggal peluncuran misi terbaru format YYYY-MM-DD",
      "role": "jabatan di stasiun luar angkasa",
      "biography": "biografi singkat 200-250 kata dalam Bahasa Indonesia tentang karir, pendidikan, pengalaman misi"
    }`;

        try {
          aiCallCount++;
          const aiContent = await generateWithAI(prompt);
          const parsed = JSON.parse(aiContent);
          profileData = {
            fullname: parsed.fullname || profileData.fullname,
            country: parsed.country || profileData.country,
            agency: parsed.agency || profileData.agency,
            launchDate: parsed.launchDate || profileData.launchDate,
            role: parsed.role || profileData.role,
            biography: parsed.biography || profileData.biography,
          };
        } catch (aiErr) {
          console.warn(`[Cron Astronot] AI failed for ${name}, using preset fallback:`, aiErr);
        }
      }

      // Generate photo via Pollinations
      const photoPrompt = encodeURIComponent(`professional official portrait photo astronaut ${name} in space suit NASA realistic high quality`);
      const imageUrl = `https://image.pollinations.ai/prompt/${photoPrompt}?width=400&height=500&nologo=true&seed=${slug.length * 17}`;

      const attribution = '\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa';
      const astronautDoc = {
        id: slug,
        name: profileData.fullname,
        craft,
        country: profileData.country,
        agency: profileData.agency,
        launchDate: profileData.launchDate,
        role: profileData.role,
        biography: profileData.biography + attribution,
        imageUrl,
        status: 'active',
        mission: `Misi aktif ${craft}`,
        source: 'Open Notify API',
        updatedAt: new Date().toISOString()
      };

      await docRef.set(astronautDoc);
      activeAstronauts.push(astronautDoc as AstronautProfile);
      processed.push({ name, slug, status: 'Generated & Saved' });

      const profileMsg =
        `👨‍🚀 <b>Profil Astronot Baru</b>\n\n` +
        `<b>${astronautDoc.name}</b>\n` +
        `${astronautDoc.role} • ${astronautDoc.agency} (${astronautDoc.country})\n` +
        `🛰 <b>Misi:</b> ${astronautDoc.craft}\n\n` +
        `🔗 ${getAbsoluteUrl(`/astronot/${astronautDoc.id}`)}`;
      
      await sendBroadcastNotification({
        title: `👨‍🚀 Profil Astronot Baru: ${astronautDoc.name}`,
        body: `Profil Astronot Baru:\n${astronautDoc.name}\n${astronautDoc.role} • ${astronautDoc.agency} (${astronautDoc.country})`,
        telegramHtml: profileMsg,
        link: `/astronot/${astronautDoc.id}`,
        imageUrl: astronautDoc.imageUrl
      });
    }

    const seen = new Set(activeAstronauts.map((astronaut) => astronaut.id));
    const archiveAstronauts = UPCOMING_AND_RETURNED_PRESETS.filter((astronaut) => !seen.has(astronaut.id));
    const dataset = buildAstronautDataset([...activeAstronauts, ...archiveAstronauts], 'Open Notify API + Meteorit Indonesia archive');
    await uploadToR2('data/astronauts/astronauts.json', JSON.stringify(dataset, null, 2), 'application/json');

    const adminChatId = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const reportMsg =
      `📢 <b>LAPORAN CRON ASTRONOT</b>\n\n` +
      `🟢 <b>Status:</b> Sukses memperbarui JSON R2\n` +
      `🛰 <b>Sedang di antariksa:</b> ${dataset.summary.active}\n` +
      `🚀 <b>Misi mendatang:</b> ${dataset.summary.upcoming}\n` +
      `🏡 <b>Alumni/returned:</b> ${dataset.summary.returned}\n` +
      `🗂 <b>Total profil:</b> ${dataset.summary.total}\n` +
      `💾 <b>R2:</b> data/astronauts/astronauts.json`;
    await sendTelegramMessage(adminChatId, reportMsg);

    return NextResponse.json({
      success: true,
      total: people.length,
      processed,
      summary: dataset.summary,
      r2Key: 'data/astronauts/astronauts.json'
    });

  } catch (error) {
    console.error('[Cron Astronot] Fatal error:', error);
    const adminChatId = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg =
      `⚠️ <b>LAPORAN CRON ASTRONOT GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}`;
    try {
      await sendTelegramMessage(adminChatId, failMsg);
    } catch {}
    return NextResponse.json(
      { error: 'Gagal memproses cron astronot', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
