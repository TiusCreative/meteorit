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
    "timotiuss75@gmail.com",
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

  try {
    const docRef = adminDb.collection('settings').doc('global');
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      await docRef.set(DEFAULT_SETTINGS);
      cachedSettings = DEFAULT_SETTINGS;
      lastFetchTime = now;
      return DEFAULT_SETTINGS;
    }
    
    const data = snapshot.data() || {};
    const adminEmails = data.adminEmails !== undefined
      ? (data.adminEmails || []).map((e: string) => e.toLowerCase().trim())
      : (DEFAULT_SETTINGS.adminEmails || []);
    
    const mergedSettings = { ...DEFAULT_SETTINGS, ...data, adminEmails } as GlobalSettings;
    if (!String(mergedSettings.googleAnalyticsPropertyId || '').trim()) {
      mergedSettings.googleAnalyticsPropertyId = DEFAULT_SETTINGS.googleAnalyticsPropertyId;
    }
    
    cachedSettings = mergedSettings;
    lastFetchTime = now;
    return mergedSettings;
  } catch (error) {
    console.error("Error fetching global settings:", error);
    if (cachedSettings) {
      return cachedSettings;
    }
    return DEFAULT_SETTINGS;
  }
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<boolean> {
  try {
    const docRef = adminDb.collection('settings').doc('global');
    await docRef.set(settings, { merge: true });
    
    // Invalidate cache agar setelan terbaru langsung aktif
    cachedSettings = null;
    lastFetchTime = 0;
    return true;
  } catch (error) {
    console.error("Error updating global settings:", error);
    return false;
  }
}
