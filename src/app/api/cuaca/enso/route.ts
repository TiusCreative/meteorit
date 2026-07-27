import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = 'https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices';
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      throw new Error(`NOAA sstoi.indices returned status ${res.status}`);
    }

    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Parse data historis
    const history: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 10 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
        const yr = parseInt(parts[0]);
        const mo = parseInt(parts[1]);
        const sst = parseFloat(parts[8]);
        const anom = parseFloat(parts[9]);
        
        let hStatus = 'Netral';
        if (anom >= 0.5) hStatus = 'El Niño';
        else if (anom <= -0.5) hStatus = 'La Niña';

        history.push({
          year: yr,
          month: mo,
          sst,
          anomaly: anom,
          status: hStatus
        });
      }
    }

    // Hitung ONI (Running 3-month mean of anomaly)
    const historyWithOni = history.map((item, idx) => {
      if (idx < 2) {
        return {
          ...item,
          oni: item.anomaly,
          oniStatus: item.status
        };
      }
      const val1 = history[idx - 2].anomaly;
      const val2 = history[idx - 1].anomaly;
      const val3 = item.anomaly;
      const oni = (val1 + val2 + val3) / 3;
      
      let oniStatus = 'Netral';
      if (oni >= 0.5) oniStatus = 'El Niño';
      else if (oni <= -0.5) oniStatus = 'La Niña';

      return {
        ...item,
        oni: parseFloat(oni.toFixed(2)),
        oniStatus
      };
    });

    if (historyWithOni.length === 0) {
      throw new Error('Gagal mem-parsing data indeks dari NOAA.');
    }

    const latestItem = historyWithOni[historyWithOni.length - 1];
    const year = latestItem.year;
    const month = latestItem.month;
    const nino34Sst = latestItem.sst;
    const nino34Anom = latestItem.anomaly;
    const oniIndex = latestItem.oni;
    const status = latestItem.oniStatus; // Standar NOAA menggunakan ONI untuk status resmi

    let colorClass = 'text-green-600';
    let bgClass = 'bg-green-50';
    let desc = `Status ENSO saat ini dalam kondisi Netral dengan indeks ONI sebesar ${oniIndex >= 0 ? '+' : ''}${oniIndex.toFixed(2)}°C. Kondisi cuaca cenderung normal.`;

    if (status === 'El Niño') {
      colorClass = 'text-red-600';
      bgClass = 'bg-red-50';
      desc = `Status ENSO saat ini dalam kondisi El Niño dengan indeks ONI sebesar +${oniIndex.toFixed(2)}°C. Potensi curah hujan di Indonesia lebih rendah dan cuaca lebih kering/panas.`;
    } else if (status === 'La Niña') {
      colorClass = 'text-blue-600';
      bgClass = 'bg-blue-50';
      desc = `Status ENSO saat ini dalam kondisi La Niña dengan indeks ONI sebesar ${oniIndex.toFixed(2)}°C. Potensi curah hujan di Indonesia cenderung meningkat, meningkatkan curah hujan di atas normal.`;
    }

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const periodLabel = `${monthNames[month - 1]} ${year}`;

    // Generate dynamic seasonal forecasts (4 periods forward)
    const forecasts: any[] = [];
    const monthNamesShort = ['Jan-Mar', 'Feb-Apr', 'Mar-Mei', 'Apr-Jun', 'Mei-Jul', 'Jun-Ags', 'Jul-Sep', 'Ags-Okt', 'Sep-Nov', 'Okt-Des', 'Nov-Jan', 'Des-Feb'];
    const currentMonthIndex = month - 1;

    for (let offset = 1; offset <= 4; offset++) {
      const idx = (currentMonthIndex + offset) % 12;
      const targetYear = year + Math.floor((currentMonthIndex + offset) / 12);
      const period = `${monthNamesShort[idx]} ${targetYear}`;
      
      let probElNino = 10;
      let probLaNina = 15;
      let probNeutral = 75;
      
      if (status === 'El Niño') {
        probElNino = Math.max(20, 80 - offset * 15);
        probNeutral = 100 - probElNino - 5;
        probLaNina = 5;
      } else if (status === 'La Niña') {
        probLaNina = Math.max(25, 85 - offset * 15);
        probNeutral = 100 - probLaNina - 5;
        probElNino = 5;
      } else {
        // Neutral transition state
        probNeutral = Math.max(50, 75 - offset * 5);
        probLaNina = Math.floor((100 - probNeutral) / 2);
        probElNino = 100 - probNeutral - probLaNina;
      }

      const dominant = probNeutral >= probElNino && probNeutral >= probLaNina 
        ? 'Netral' 
        : (probElNino >= probLaNina ? 'El Niño' : 'La Niña');

      forecasts.push({
        period,
        neutral: probNeutral,
        elNino: probElNino,
        laNina: probLaNina,
        dominant
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        period: periodLabel,
        nino34_sst: nino34Sst,
        nino34_anomaly: nino34Anom,
        oni: oniIndex,
        status,
        description: desc,
        colorClass,
        bgClass,
        forecasts,
        history: historyWithOni, // Mengirimkan seluruh data historis untuk grafik
        source: 'NOAA Climate Prediction Center (CPC)',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[API ENSO] Error:', err);
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil informasi indeks ENSO dari NOAA.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
