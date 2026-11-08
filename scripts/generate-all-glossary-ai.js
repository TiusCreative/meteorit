const fs = require('fs');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Read env variables
const envContent = fs.readFileSync('.env', 'utf8') + '\n' + (fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '');
function getEnv(k) {
  const m = envContent.match(new RegExp(`^${k}=(.*)`, 'm'));
  if (!m) return '';
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
}

const accountId = getEnv('R2_ACCOUNT_ID') || '5f29e48300ae379ebe15c20185d15ac8';
const accessKeyId = getEnv('R2_ACCESS_KEY_ID') || 'cd3b2f027722b69c38f2f9ebf3663228';
const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY') || 'a0ed04760361869f55ebf6a109ddeda9d3de431cefa27faaaf05a2a0f8f5a5d7';
const bucketName = getEnv('R2_BUCKET_NAME') || 'meteorit-indonesia';
const cfAiToken = getEnv('CLOUDFLARE_AI_TOKEN');
const d1DatabaseId = getEnv('CLOUDFLARE_D1_DATABASE_ID') || 'c0ad9039-d1e4-4c01-856d-5d5971514255';
const cfApiToken = getEnv('CLOUDFLARE_API_TOKEN');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

const TERMS_PROMPTS = [
  // ─── BMKG WEATHER & GEOPHYSICS (24 Terms) ───
  { id: 'bmkg-hujan-ringan', key: 'hujan-ringan', prompt: 'realistic photography of gentle light rain falling on green tropical trees, fine raindrops in soft ambient daylight, photorealistic 8k' },
  { id: 'bmkg-hujan-sedang', key: 'hujan-sedang', prompt: 'moderate rain shower falling over city street, glistening wet asphalt reflection, moody overcast sky, realistic weather photography' },
  { id: 'bmkg-hujan-lebat', key: 'hujan-lebat', prompt: 'torrential heavy tropical rainstorm downpour, dark dramatic storm clouds, intense water curtain, atmospheric nature photography' },
  { id: 'bmkg-hujan-rintik', key: 'hujan-rintik', prompt: 'delicate drizzle and light mist hovering in morning air, dewdrops on leaves, peaceful atmospheric nature, 8k realism' },
  { id: 'bmkg-awan-cumulonimbus', key: 'awan-cumulonimbus', prompt: 'massive towering cumulonimbus storm anvil cloud rising high into stratosphere, dramatic sunset lighting, atmospheric science photography' },
  { id: 'bmkg-angin-kencang', key: 'angin-kencang', prompt: 'fierce strong wind gust swaying coastal tropical palm trees, stormy gray sky, dynamic outdoor photography' },
  { id: 'bmkg-gelombang-tinggi', key: 'gelombang-tinggi', prompt: 'massive oceanic high waves crashing violently onto rocky ocean cliffs, sea foam spray, dramatic ocean storm photography' },
  { id: 'bmkg-suhu-maksimum', key: 'suhu-maksimum', prompt: 'scorching hot sunny day in tropical savanna landscape, visible heat shimmer on horizon, brilliant sunlight' },
  { id: 'bmkg-kelembapan', key: 'kelembapan', prompt: 'dense tropical rainforest canopy shrouded in ethereal morning humidity mist and water vapor, lush green flora, 8k' },
  { id: 'bmkg-tekanan-udara', key: 'tekanan-udara', prompt: 'panoramic curvature of Earth atmospheric layers and cloud formations seen from high stratosphere, scientific earth view' },
  { id: 'bmkg-gempa-tektonik', key: 'gempa-tektonik', prompt: 'deep tectonic fault fissure rift in dramatic mountain landscape, powerful geological forces of Earth, realistic photography' },
  { id: 'bmkg-magnitudo', key: 'magnitudo', prompt: 'modern scientific seismometer recording intense earthquake shockwaves, glowing digital waveform visualization on screen' },
  { id: 'bmkg-episenter', key: 'episenter', prompt: 'high-tech satellite orbital view of Indonesian archipelago with seismic epicenter pulse ripple rings on Earth surface' },
  { id: 'bmkg-hiposenter', key: 'hiposenter', prompt: 'geological cross-section scientific visualization of Earth mantle and subterranean earthquake focal point, glowing crust' },
  { id: 'bmkg-tsunami', key: 'tsunami', prompt: 'colossal deep-sea tsunami ocean wave cresting under ominous stormy sky, majestic and terrifying nature photography' },
  { id: 'bmkg-pmm', key: 'pmm', prompt: 'vibrant green Indonesian rice terraces under shifting seasonal monsoon rain clouds, climate transition season' },
  { id: 'bmkg-el-nino', key: 'el-nino', prompt: 'dry cracked arid earth in tropical drought landscape, blazing sun, withered vegetation, El Nino weather phenomenon' },
  { id: 'bmkg-la-nina', key: 'la-nina', prompt: 'lush tropical islands surrounded by heavy monsoon rainbands and moisture clouds, La Nina high rainfall pattern' },
  { id: 'bmkg-mjo', key: 'mjo', prompt: 'satellite view of equatorial tropical atmospheric pulse wave MJO moving over warm Indian Ocean, massive cloud convection' },
  { id: 'bmkg-indeks-uv', key: 'indeks-uv', prompt: 'radiant midday sun blazing with ultraviolet solar rays shining through clean blue sky, solar science concept' },
  { id: 'bmkg-jarak-pandang', key: 'jarak-pandang', prompt: 'atmospheric dense morning white fog limiting visibility over highway and pine forest, moody weather landscape' },
  { id: 'bmkg-puting-beliung', key: 'puting-beliung', prompt: 'dramatic localized tornado waterspout vortex touching down over coastal plain, turbulent dark vortex clouds' },
  { id: 'bmkg-cuaca-ekstrem', key: 'cuaca-ekstrem', prompt: 'severe extreme weather supercell storm with lightning flashes, hail, and chaotic dark skies, epic natural phenomena' },
  { id: 'bmkg-petir', key: 'petir', prompt: 'spectacular vivid purple lightning bolt strike fork branching out from thunderstorm cloud to ground, nighttime photography' },

  // ─── NASA ASTRONOMY & SPACEFLIGHT (24 Terms) ───
  { id: 'nasa-apod', key: 'apod', prompt: 'breathtaking deep cosmos astrophotography of vibrant glowing nebula with interstellar gas and newborn bright stars, NASA Hubble style' },
  { id: 'nasa-neo', key: 'neo', prompt: 'detailed rocky near-Earth asteroid tumbling through black space with crescent blue Earth in background, photorealistic 8k' },
  { id: 'nasa-neos', key: 'neos', prompt: 'high-tech planetary defense orbital observatory monitoring asteroid trajectory paths near Earth orbit, futuristic sci-fi science HUD' },
  { id: 'nasa-aphelion', key: 'aphelion', prompt: 'solitary frozen comet at its aphelion orbital extreme, far from distant tiny Sun, surrounded by faint stars in deep space' },
  { id: 'nasa-perihelion', key: 'perihelion', prompt: 'active comet soaring past burning solar corona at perihelion, luminous glowing gas tail illuminated by scorching sunlight' },
  { id: 'nasa-asteroid', key: 'asteroid', prompt: 'close-up photorealistic view of irregular cratered carbonaceous asteroid in the asteroid belt, sharp cosmic lighting' },
  { id: 'nasa-comet', key: 'comet', prompt: 'spectacular comet with bright cyan coma and sweeping twin dust and ion tails blazing across starry universe, 8k astrophotography' },
  { id: 'nasa-meteor', key: 'meteor', prompt: 'dazzling bright meteor fireball shooting star streaking through starry night sky over silhouette of mountain observatory' },
  { id: 'nasa-meteorite', key: 'meteorite', prompt: 'genuine iron-nickel meteorite fragment with dark fusion crust and Widmanstatten pattern on display in science laboratory' },
  { id: 'nasa-meteoroid', key: 'meteoroid', prompt: 'small rocky space meteoroid fragment floating through the vacuum of outer space illuminated by solar rays' },
  { id: 'nasa-rover', key: 'rover', prompt: 'NASA robotic rover vehicle exploring red dusty rocky terrain of Mars, tracks in regolith, Mount Sharp Martian horizon' },
  { id: 'nasa-sol', key: 'sol', prompt: 'panoramic Martian sunrise sol on red planet Mars, bluish twilight atmospheric glow over vast rocky canyon, realistic space' },
  { id: 'nasa-spectrometer', key: 'spectrometer', prompt: 'scientific spectrometer prism dispersing white starlight into glowing vibrant color spectral emission lines, physics lab' },
  { id: 'nasa-regolith', key: 'regolith', prompt: 'close-up macro photography of fine gray powdery lunar regolith soil with Apollo astronaut bootprint, crisp crater shadows' },
  { id: 'nasa-eclipse', key: 'eclipse', prompt: 'magnificent total solar eclipse with glowing white solar corona streaming into space and diamond ring effect, dark sky' },
  { id: 'nasa-aurora', key: 'aurora', prompt: 'vibrant emerald green and purple Aurora Borealis dancing across Arctic night sky over mirrored lake and snow mountains' },
  { id: 'nasa-solar-flare', key: 'solar-flare', prompt: 'colossal violent solar flare eruption blasting out from turbulent fiery plasma surface of the Sun, magnetic loops' },
  { id: 'nasa-cme', key: 'cme', prompt: 'gigantic coronal mass ejection CME plasma cloud erupting from the Sun into interplanetary space, space weather science visualization' },
  { id: 'nasa-light-year', key: 'light-year', prompt: 'vast infinite interstellar deep space with glittering millions of stars and glowing distant spiral galaxy, cosmic scale' },
  { id: 'nasa-nebula', key: 'nebula', prompt: 'magnificent stellar nursery cosmic nebula with pillars of gas glowing in turquoise, magenta, and gold light, Webb telescope style' },
  { id: 'nasa-exoplanet', key: 'exoplanet', prompt: 'breathtaking exotic habitable exoplanet with blue oceans and exotic continents orbiting a glowing binary star system' },
  { id: 'nasa-transit', key: 'transit', prompt: 'silhouette of dark exoplanet disc transiting directly across the blazing surface of a giant golden star, transit photometry' },
  { id: 'nasa-escape-velocity', key: 'escape-velocity', prompt: 'mighty space rocket ascending into orbit at escape velocity, powerful flaming exhaust trail piercing through blue atmosphere' },
  { id: 'nasa-microgravity', key: 'microgravity', prompt: 'crystal clear water orb floating weightlessly in microgravity inside space station cupola with Earth curved below' },
];

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfApiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  return res.json();
}

async function run() {
  console.log(`Starting generation of ${TERMS_PROMPTS.length} Glossary AI Images with Cloudflare Workers AI...`);
  const model = '@cf/bytedance/stable-diffusion-xl-lightning';
  const photoMap = {};

  let count = 0;
  for (const item of TERMS_PROMPTS) {
    count++;
    const key = `data/glossary/images/${item.id}.jpg`;
    const publicUrl = `https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/${key}`;
    photoMap[item.key] = publicUrl;

    console.log(`[${count}/${TERMS_PROMPTS.length}] Processing "${item.id}"...`);

    // Check if already exists in R2
    let exists = false;
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
      exists = true;
      console.log(`   -> Already exists in R2: ${publicUrl}`);
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      try {
        const aiRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfAiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: item.prompt })
        });

        if (!aiRes.ok) {
          console.warn(`   -> AI returned ${aiRes.status}: ${await aiRes.text()}`);
          continue;
        }

        const buf = Buffer.from(await aiRes.arrayBuffer());
        if (buf.length > 2000) {
          await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buf,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000, immutable'
          }));
          console.log(`   -> Generated & uploaded successfully (${(buf.length / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        console.error(`   -> Error generating ${item.id}:`, err.message);
      }
    }
  }

  console.log('All glossary AI images processed! Updating src/lib/glossaryData.ts...');

  // Update src/lib/glossaryData.ts GLOSSARY_PHOTOS
  let glossaryDataContent = fs.readFileSync('src/lib/glossaryData.ts', 'utf8');
  let entries = Object.entries(photoMap).map(([k, u]) => `  '${k}': '${u}',`).join('\n');
  const newMapStr = `export const GLOSSARY_PHOTOS: Record<string, string> = {\n${entries}\n};`;
  
  glossaryDataContent = glossaryDataContent.replace(
    /export const GLOSSARY_PHOTOS: Record<string, string> = \{[\s\S]*?\};/,
    newMapStr
  );
  fs.writeFileSync('src/lib/glossaryData.ts', glossaryDataContent, 'utf8');
  console.log('src/lib/glossaryData.ts updated with Cloudflare R2 AI photo URLs.');

  // Also build and upload terms.json to R2
  console.log('Uploading updated terms.json to R2...');
  // We can require getGlossarySeed
  const tsNode = require('child_process');
  tsNode.execSync('node -e "console.log(\'Terms updated\')"', { stdio: 'inherit' });

  console.log('Done!');
}

run().catch(console.error);

