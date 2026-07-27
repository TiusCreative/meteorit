import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SpaceWeatherResponse {
  success: boolean;
  kpIndex: number;
  solarWindSpeed: number;
  auroraProbability: number;
  satelliteRisk: 'Aman' | 'Waspada' | 'Siaga';
  geomagneticStormClass: string; // G0 to G5
  radioBlackoutClass: string; // R0 to R5
  solarRadiationClass: string; // S0 to S5
  description: string;
  recommendation: string;
  updatedAt: string;
}

export async function GET() {
  try {
    let kpIndex = 2.0;
    let solarWindSpeed = 360; // km/s
    let geomagneticStormClass = 'G0 (Normal)';
    let radioBlackoutClass = 'R0 (Normal)';
    let solarRadiationClass = 'S0 (Normal)';

    // Try fetching NOAA Scales
    try {
      const res = await fetch('https://services.swpc.noaa.gov/products/noaa-scales.json', {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const scales = await res.json();
        // Extract G (geomagnetic), R (radio), S (radiation) scales
        // Usually, the first entry (index "0" or similar) contains current values
        const currentScale = scales["0"] || {};
        if (currentScale.G) {
          const gVal = Number(currentScale.G.Scale) || 0;
          geomagneticStormClass = `G${gVal} (${currentScale.G.Text || 'Normal'})`;
          // Map NOAA G-scale to Kp Index approximate conversion
          // G1 -> Kp 5, G2 -> Kp 6, G3 -> Kp 7, G4 -> Kp 8, G5 -> Kp 9
          if (gVal > 0) {
            kpIndex = 4 + gVal;
          }
        }
        if (currentScale.R) {
          const rVal = Number(currentScale.R.Scale) || 0;
          radioBlackoutClass = `R${rVal} (${currentScale.R.Text || 'Normal'})`;
        }
        if (currentScale.S) {
          const sVal = Number(currentScale.S.Scale) || 0;
          solarRadiationClass = `S${sVal} (${currentScale.S.Text || 'Normal'})`;
        }
      }
    } catch (err) {
      console.warn('[Space Weather API] Gagal mengambil data NOAA Scales, memakai baseline:', err);
    }

    // Try fetching NOAA Solar Wind Speed
    try {
      const res = await fetch('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json', {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const wind = await res.json();
        if (wind && typeof wind.windspeed === 'number') {
          solarWindSpeed = wind.windspeed;
        } else if (wind && typeof wind.WindSpeed === 'number') {
          solarWindSpeed = wind.WindSpeed;
        }
      }
    } catch (err) {
      console.warn('[Space Weather API] Gagal mengambil data angin matahari, memakai baseline:', err);
    }

    // If Kp index hasn't been set by G-scale, we can dynamically estimate it from solar wind speed
    // Normal: 300-400 km/s -> Kp 1-3
    // Moderate: 450-550 km/s -> Kp 4
    // High: >600 km/s -> Kp 5+ (Storm)
    if (kpIndex === 2.0) {
      if (solarWindSpeed > 600) {
        kpIndex = 5.5;
        geomagneticStormClass = 'G1 (Minor)';
      } else if (solarWindSpeed > 500) {
        kpIndex = 4.0;
      } else if (solarWindSpeed > 420) {
        kpIndex = 3.0;
      }
    }

    // Calculate Aurora visibility probability (approximation for high-latitude observer)
    // Formula: scales up exponentially with Kp index
    let auroraProbability = Math.min(100, Math.round((kpIndex / 9) * 100));
    // For equatorial countries like Indonesia, it's practically 0%, but let's calculate global aurora probability
    if (kpIndex < 3) {
      auroraProbability = Math.round(kpIndex * 10); // 0 - 30%
    } else if (kpIndex < 5) {
      auroraProbability = 30 + Math.round((kpIndex - 3) * 20); // 30 - 70%
    } else {
      auroraProbability = 70 + Math.round((kpIndex - 5) * 7.5); // 70 - 100%
    }

    // Determine Satellite / GPS interference risk levels
    let satelliteRisk: 'Aman' | 'Waspada' | 'Siaga' = 'Aman';
    let description = 'Kondisi cuaca antariksa tenang. Tidak ada gangguan magnetik atau radiasi matahari yang berarti.';
    let recommendation = 'Sangat baik untuk pengamatan langit malam terbuka di Indonesia. Sinyal GPS dan jaringan satelit beroperasi optimal.';

    if (kpIndex >= 5.0 || radioBlackoutClass.includes('R2') || solarRadiationClass.includes('S2')) {
      satelliteRisk = 'Siaga';
      description = `Terdeteksi Badai Geomagnetik Aktif (${geomagneticStormClass})! Kecepatan angin matahari mencapai ${solarWindSpeed.toFixed(0)} km/s.`;
      recommendation = 'Bahaya gangguan navigasi GPS presisi dan komunikasi satelit orbit rendah (LEO). Aurora sangat aktif di wilayah kutub dan sub-polar.';
    } else if (kpIndex >= 4.0 || solarWindSpeed > 450) {
      satelliteRisk = 'Waspada';
      description = `Kondisi magnetosfer tidak stabil. Angin matahari cukup kencang (${solarWindSpeed.toFixed(0)} km/s) berpotensi memicu riak geomagnetik ringan.`;
      recommendation = 'GPS mungkin mengalami deviasi mikro. Pengamatan langit malam tetap prospektif, aurora mulai merambat ke batas lintang menengah bumi.';
    }

    const payload: SpaceWeatherResponse = {
      success: true,
      kpIndex,
      solarWindSpeed,
      auroraProbability,
      satelliteRisk,
      geomagneticStormClass,
      radioBlackoutClass,
      solarRadiationClass,
      description,
      recommendation,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('[API Space Weather] Fatal error:', err);
    return NextResponse.json({
      success: false,
      kpIndex: 2.0,
      solarWindSpeed: 380,
      auroraProbability: 15,
      satelliteRisk: 'Aman',
      geomagneticStormClass: 'G0 (Normal)',
      radioBlackoutClass: 'R0 (Normal)',
      solarRadiationClass: 'S0 (Normal)',
      description: 'Gagal menyambung ke NOAA. Menggunakan data prakiraan fallback cuaca antariksa.',
      recommendation: 'Satelit beroperasi normal. Pengamatan bintang dan meteorit terbuka di Indonesia berjalan lancar.',
      updatedAt: new Date().toISOString(),
    });
  }
}
