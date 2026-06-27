'use client';

import { useEffect, useState } from 'react';

interface CMEEvent {
  activityID: string;
  startTime: string;
  note: string;
  speed: number | null;
}

interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;
  sourceLocation: string;
}

interface DonkiData {
  success: boolean;
  activityLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  activityColor: string;
  cmeCount: number;
  flareCount: number;
  cme: CMEEvent[];
  flares: SolarFlare[];
  period: { start: string; end: string };
}

function ActivityGauge({ level }: { level: 'Rendah' | 'Sedang' | 'Tinggi' }) {
  const levels = ['Rendah', 'Sedang', 'Tinggi'];
  const activeIdx = levels.indexOf(level);
  const colors = ['#22d3ee', '#f59e0b', '#ef4444'];
  const bgColors = ['bg-cyan-400', 'bg-amber-400', 'bg-red-400'];
  const dimBg = ['bg-cyan-900/30', 'bg-amber-900/30', 'bg-red-900/30'];

  return (
    <div className="flex items-center gap-2">
      {levels.map((l, i) => (
        <div key={l} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`h-10 w-full rounded-lg transition-all duration-500 ${
              i <= activeIdx ? bgColors[i] : dimBg[i]
            } ${i === activeIdx ? 'shadow-lg' : 'opacity-40'}`}
            style={i === activeIdx ? { boxShadow: `0 0 20px ${colors[i]}40` } : undefined}
          />
          <span className={`text-xs font-semibold ${i === activeIdx ? 'text-white' : 'text-slate-600'}`}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function FlareClassBadge({ classType }: { classType: string }) {
  const cls = classType?.charAt(0)?.toUpperCase() || 'A';
  const colorMap: Record<string, string> = {
    X: 'bg-red-950/80 text-red-400 border-red-500/40',
    M: 'bg-orange-950/80 text-orange-400 border-orange-500/40',
    C: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
    B: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30',
    A: 'bg-slate-800 text-slate-400 border-slate-600/40',
  };
  const css = colorMap[cls] || colorMap['A'];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border mono-font ${css}`}>
      {classType || '—'}
    </span>
  );
}

export default function SpaceWeather() {
  const [data, setData] = useState<DonkiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDonki() {
      try {
        setLoading(true);
        const res = await fetch('/api/nasa/donki');
        if (!res.ok) throw new Error('Gagal memuat data cuaca antariksa');
        const json: DonkiData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error tidak diketahui');
      } finally {
        setLoading(false);
      }
    }
    fetchDonki();
  }, []);

  const levelColorMap: Record<string, string> = {
    Rendah: 'text-cyan-400',
    Sedang: 'text-amber-400',
    Tinggi: 'text-red-400',
  };

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm mono-font">Mengambil data dari NASA DONKI API...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl border border-red-500/30 text-center py-12">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Activity Level Hero Card */}
          <div className="dashboard-card p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Sun visualization */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-5xl float-anim ${
                    data.activityLevel === 'Tinggi'
                      ? 'bg-gradient-to-br from-red-600/30 to-orange-600/30'
                      : data.activityLevel === 'Sedang'
                      ? 'bg-gradient-to-br from-amber-600/30 to-orange-500/30'
                      : 'bg-gradient-to-br from-yellow-500/20 to-amber-400/20'
                  }`}
                    style={{
                      boxShadow: data.activityLevel === 'Tinggi'
                        ? '0 0 40px rgba(239,68,68,0.3), 0 0 80px rgba(239,68,68,0.15)'
                        : data.activityLevel === 'Sedang'
                        ? '0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(245,158,11,0.15)'
                        : '0 0 40px rgba(253,224,71,0.2), 0 0 80px rgba(253,224,71,0.1)',
                    }}
                  >
                    ☀️
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs text-slate-500 mono-font mb-1">STATUS AKTIVITAS MATAHARI (7 HARI TERAKHIR)</p>
                <h2 className={`text-4xl font-black tracking-tight mb-3 ${levelColorMap[data.activityLevel] || 'text-cyan-400'}`}>
                  {data.activityLevel}
                </h2>
                <ActivityGauge level={data.activityLevel} />
                <p className="text-xs text-slate-500 mt-3 mono-font">
                  Periode: {data.period?.start} — {data.period?.end}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="dashboard-card p-3 text-center">
                  <p className="text-2xl font-black mono-font text-rose-400">{data.cmeCount}</p>
                  <p className="text-xs text-slate-500">CME Terdeteksi</p>
                </div>
                <div className="dashboard-card p-3 text-center">
                  <p className="text-2xl font-black mono-font text-amber-400">{data.flareCount}</p>
                  <p className="text-xs text-slate-500">Solar Flare</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alert banner for high activity */}
          {data.activityLevel === 'Tinggi' && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0 float-anim">🌋</span>
              <div>
                <p className="text-red-400 font-bold text-sm">AKTIVITAS MATAHARI TINGGI TERDETEKSI</p>
                <p className="text-xs text-red-300/70 mt-0.5">
                  Solar flare kelas-X dan/atau CME besar terdeteksi. Potensi gangguan sinyal radio, satelit komunikasi, dan jaringan listrik di lintang tinggi.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CME Events */}
            <div className="dashboard-card p-5">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-lg">🌊</span>
                Coronal Mass Ejection (CME)
                <span className="ml-auto text-xs text-slate-500 mono-font">{data.cme.length} peristiwa</span>
              </h3>
              <div className="space-y-3">
                {data.cme.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">Tidak ada CME terdeteksi dalam periode ini.</p>
                ) : data.cme.map((c) => (
                  <div key={c.activityID} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-xs mono-font text-slate-300">
                        {c.startTime ? new Date(c.startTime).toLocaleDateString('id-ID', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </p>
                      {c.speed && (
                        <span className="text-xs text-rose-400 mono-font font-bold">{c.speed} km/s</span>
                      )}
                    </div>
                    {c.note && (
                      <p className="text-xs text-slate-500 line-clamp-2">{c.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Solar Flares */}
            <div className="dashboard-card p-5">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Solar Flare
                <span className="ml-auto text-xs text-slate-500 mono-font">{data.flares.length} peristiwa</span>
              </h3>
              <div className="space-y-3">
                {data.flares.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">Tidak ada solar flare terdeteksi dalam periode ini.</p>
                ) : data.flares.map((f) => (
                  <div key={f.flrID} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs mono-font text-slate-300">
                        {f.beginTime ? new Date(f.beginTime).toLocaleDateString('id-ID', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </p>
                      <FlareClassBadge classType={f.classType} />
                    </div>
                    <div className="flex gap-4 mt-1">
                      <p className="text-xs text-slate-500">
                        Puncak: {f.peakTime ? new Date(f.peakTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                      {f.sourceLocation && (
                        <p className="text-xs text-slate-500 mono-font">Lokasi: {f.sourceLocation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CME Class explanation */}
          <div className="dashboard-card p-4">
            <p className="text-xs text-slate-400 font-semibold mb-3">📖 Kelas Solar Flare</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {[
                { cls: 'A', desc: 'Tidak signifikan', color: 'text-slate-400' },
                { cls: 'B', desc: 'Sangat kecil', color: 'text-cyan-400' },
                { cls: 'C', desc: 'Kecil', color: 'text-amber-400' },
                { cls: 'M', desc: 'Medium, berdampak regional', color: 'text-orange-400' },
                { cls: 'X', desc: 'Ekstrem, berdampak global', color: 'text-red-400' },
              ].map((item) => (
                <div key={item.cls} className="flex items-center gap-2">
                  <span className={`font-black mono-font ${item.color}`}>{item.cls}</span>
                  <span className="text-slate-500">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-4 text-right mono-font">
        Sumber: NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)
      </p>
    </div>
  );
}
