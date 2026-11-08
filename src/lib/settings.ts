import { adminDb } from './firebaseAdmin';
import { getSiteUrl } from './siteUrl';

export interface GlobalSettings {
  whatsappUrl: string;
  telegramChannel: string;
  telegramGroup: string;
  adsenseActive: boolean;
  adsenseClientId: string;
  adsenseSlotId: string;
  adsensePositions: string[];
  manualAds: {
    id: string;
    imageUrl: string;
    linkUrl: string;
    position: string; // e.g., 'hero', 'content', 'footer'
  }[];
  donationTiers: {
    id: string;
    amount: number;
    label: string;
  }[];
  aboutVisi: string;
  aboutMisi: string;
  aboutSejarah: string;
  adminEmails: string[];
  encyclopediaCronLimit: number;
  googleTagId: string;
  googleAnalyticsPropertyId: string;
  googleSearchConsoleUrl: string;
  customHeadCode: string;
  customBodyStartCode: string;
  customBodyEndCode: string;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  whatsappUrl: "https://whatsapp.com/channel/meteorit",
  telegramChannel: "https://t.me/meteoritindonesia",
  telegramGroup: "https://t.me/meteoritindonesia_group",
  adsenseActive: false,
  adsenseClientId: "ca-pub-1234567890123456",
  adsenseSlotId: "1234567890",
  adsensePositions: ["hero", "content", "footer"],
  manualAds: [
    {
      id: "ad-1",
      imageUrl: "/placeholder-ad.webp",
      linkUrl: getSiteUrl(),
      position: "content"
    }
  ],
  donationTiers: [
    { id: "1", amount: 100000, label: "Donasi Kecil" },
    { id: "2", amount: 250000, label: "Donasi Sedang" },
    { id: "3", amount: 500000, label: "Donasi Besar" },
    { id: "4", amount: 1000000, label: "Donasi Premium" }
  ],
  aboutVisi: "Menjadi pusat informasi dan komunitas astronomi terpercaya di Indonesia yang mendorong minat masyarakat terhadap ilmu astronomi, khususnya tentang meteorit dan benda-benda langit lainnya.",
  aboutMisi: "Menyediakan ensiklopedia meteorit yang komprehensif dan mudah diakses\nMembangun komunitas penggemar astronomi yang aktif dan saling mendukung\nMenyediakan platform untuk diskusi dan pertukaran pengetahuan tentang meteorit\nMeningkatkan kesadaran masyarakat tentang pentingnya pelestarian meteorit\nMenyediakan platform untuk diskusi dan pertukaran pengetahuan tentang meteorit\nMenjadi jembatan antara kolektor, peneliti, dan penggemar meteorit",
  aboutSejarah: "Meteorit Indonesia didirikan pada tahun 2023 oleh sekelompok penggemar astronomi yang ingin menciptakan platform yang dapat diakses oleh semua orang untuk mempelajari tentang meteorit. Kami mulai sebagai forum kecil dan telah berkembang menjadi sumber daya komprehensif dengan ribuan anggota dari seluruh Indonesia.",
  adminEmails: [
    "creativecortex168@gmail.com",
    "timotiuss75@gmail.com",
    "tiuss75@gmail.com",
    "tius75@gmail.com",
    "tiuss168@gmail.com"
  ],
  encyclopediaCronLimit: 20,
  googleTagId: "G-X4F6EB07D4",
  googleAnalyticsPropertyId: "543353784",
  googleSearchConsoleUrl: "https://search.google.com/search-console",
  customHeadCode: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X4F6EB07D4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-X4F6EB07D4');
</script>`,
  customBodyStartCode: "",
  customBodyEndCode: ""
};

let cachedSettings: GlobalSettings | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 menit cache

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const now = Date.now();
  if (cachedSettings && (now - lastFetchTime < CACHE_TTL)) {
    return cachedSettings;
  }

  // 1. Try D1 system_state first
  try {
    const { queryD1 } = await import('./d1Client');
    const res = await queryD1("SELECT value FROM system_state WHERE key = 'settings-global' LIMIT 1");
    const row = res?.results?.[0];
    if (row?.value) {
      const data = JSON.parse(row.value);
      const envEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
      const adminEmails = Array.from(new Set([
        ...(DEFAULT_SETTINGS.adminEmails || []),
        ...(data.adminEmails || []),
        ...envEmails
      ])).map(e => e.toLowerCase().trim());

      const mergedSettings = { ...DEFAULT_SETTINGS, ...data, adminEmails } as GlobalSettings;
      cachedSettings = mergedSettings;
      lastFetchTime = now;
      return mergedSettings;
    }
  } catch (d1Err) {
    console.warn("[Settings] D1 read failed, checking Firestore:", d1Err);
  }

  // 2. Fallback to Firestore
  try {
    const docRef = adminDb.collection('settings').doc('global');
    const snapshot = await docRef.get();
    
    if (snapshot.exists) {
      const data = snapshot.data() || {};
      const envEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
      const adminEmails = Array.from(new Set([
        ...(DEFAULT_SETTINGS.adminEmails || []),
        ...(data.adminEmails || []),
        ...envEmails
      ])).map(e => e.toLowerCase().trim());

      const mergedSettings = { ...DEFAULT_SETTINGS, ...data, adminEmails } as GlobalSettings;
      cachedSettings = mergedSettings;
      lastFetchTime = now;
      return mergedSettings;
    }
  } catch (error) {
    console.error("Error fetching global settings from Firestore:", error);
  }

  // 3. Fallback to DEFAULT_SETTINGS merged with env
  const envEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
  const adminEmails = Array.from(new Set([
    ...(DEFAULT_SETTINGS.adminEmails || []),
    ...envEmails
  ])).map(e => e.toLowerCase().trim());
  const fallback = { ...DEFAULT_SETTINGS, adminEmails };
  cachedSettings = fallback;
  lastFetchTime = now;
  return fallback;
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<boolean> {
  try {
    const current = await getGlobalSettings();
    const merged = { ...current, ...settings };

    // 1. Save to D1 system_state
    try {
      const { queryD1 } = await import('./d1Client');
      await queryD1(
        "INSERT OR REPLACE INTO system_state (key, value, updated_at) VALUES ('settings-global', ?, ?)",
        [JSON.stringify(merged), new Date().toISOString()]
      );
    } catch (d1Err) {
      console.warn("[Settings] D1 write failed:", d1Err);
    }

    // 2. Best-effort save to Firestore
    try {
      const docRef = adminDb.collection('settings').doc('global');
      await docRef.set(settings, { merge: true });
    } catch (fsErr) {
      /* best effort */
    }
    
    // Invalidate cache
    cachedSettings = null;
    lastFetchTime = 0;
    return true;
  } catch (error) {
    console.error("Error updating global settings:", error);
    return false;
  }
}
