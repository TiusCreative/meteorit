import { adminDb } from './firebaseAdmin';

// Kurs USD ke IDR (hardcoded, dapat diganti dengan API kurs dinamis)
const USD_TO_IDR_RATE = 16000;

/**
 * Peta tier donasi → durasi premium (dalam hari).
 * Diurutkan dari nominal terbesar ke terkecil agar cocok dengan tier tertinggi.
 */
export const DONATION_TIERS: { minAmount: number; days: number; label: string }[] = [
  { minAmount: 1000000, days: 70, label: 'Donasi Rp 1.000.000 (70 hari premium)' },
  { minAmount: 500000,  days: 30, label: 'Donasi Rp 500.000 (30 hari premium)' },
  { minAmount: 250000,  days: 21, label: 'Donasi Rp 250.000 (21 hari premium)' },
  { minAmount: 100000,  days: 7,  label: 'Donasi Rp 100.000 (7 hari premium)' },
];

/**
 * Menentukan durasi premium berdasarkan nominal donasi dalam Rupiah.
 * Mengembalikan null jika nominal tidak mencapai tier terendah.
 */
export function getPremiumDays(amountIDR: number): number | null {
  for (const tier of DONATION_TIERS) {
    if (amountIDR >= tier.minAmount) {
      return tier.days;
    }
  }
  return null;
}

/**
 * Mencari user berdasarkan email di koleksi Firestore 'users',
 * lalu memberikan status premium dengan masa aktif sesuai tier donasi.
 *
 * @param email - Email donatur
 * @param amountIDR - Nominal donasi dalam Rupiah
 * @returns Object { granted, days, message }
 */
export async function grantPremiumByDonation(
  email: string,
  amountIDR: number
): Promise<{ granted: boolean; days: number | null; message: string }> {
  const days = getPremiumDays(amountIDR);

  if (!days) {
    return {
      granted: false,
      days: null,
      message: `Nominal Rp ${amountIDR.toLocaleString('id-ID')} tidak mencapai tier premium terendah (Rp 100.000).`,
    };
  }

  try {
    // Cari user berdasarkan email (query Firestore)
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log(`[premiumUtils] User dengan email ${email} belum terdaftar di Firestore. Premium tidak dapat diberikan.`);
      return {
        granted: false,
        days,
        message: `User dengan email ${email} tidak ditemukan. Premium akan aktif setelah user pertama kali login.`,
      };
    }

    const userDoc = usersSnapshot.docs[0];
    const currentData = userDoc.data();

    // Hitung tanggal kedaluwarsa premium
    // Jika sudah premium, tambahkan hari dari masa aktif yang tersisa
    let expiryDate: Date;
    const now = new Date();

    if (currentData.premiumExpiry) {
      const existingExpiry = new Date(currentData.premiumExpiry);
      // Jika masa aktif masih berlaku, tambah dari sana
      if (existingExpiry > now) {
        expiryDate = new Date(existingExpiry.getTime() + days * 24 * 60 * 60 * 1000);
      } else {
        // Sudah expired, mulai dari sekarang
        expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      }
    } else {
      expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    await userDoc.ref.update({
      role: 'premium',
      premiumExpiry: expiryDate.toISOString(),
      premiumGrantedAt: now.toISOString(),
      premiumGrantedByDonation: amountIDR,
    });

    console.log(`[premiumUtils] ✅ Premium berhasil diberikan ke ${email} selama ${days} hari. Kedaluwarsa: ${expiryDate.toISOString()}`);

    return {
      granted: true,
      days,
      message: `Premium ${days} hari berhasil diberikan ke ${email}. Aktif hingga ${expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
    };
  } catch (error) {
    console.error(`[premiumUtils] Error memberikan premium ke ${email}:`, error);
    return {
      granted: false,
      days,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Versi PayPal — konversi USD ke IDR lalu panggil grantPremiumByDonation.
 *
 * @param email - Email donatur
 * @param amountUSD - Nominal donasi dalam USD
 * @param usdToIdrRate - Kurs konversi (default: 16.000)
 */
export async function grantPremiumByDonationUSD(
  email: string,
  amountUSD: number,
  usdToIdrRate: number = USD_TO_IDR_RATE
): Promise<{ granted: boolean; days: number | null; message: string; amountIDR: number }> {
  const amountIDR = Math.round(amountUSD * usdToIdrRate);
  console.log(`[premiumUtils] PayPal $${amountUSD} USD × Rp ${usdToIdrRate} = Rp ${amountIDR.toLocaleString('id-ID')}`);

  const result = await grantPremiumByDonation(email, amountIDR);
  return { ...result, amountIDR };
}
