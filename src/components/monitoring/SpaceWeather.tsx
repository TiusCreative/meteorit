'use client';

import { useEffect, useState } from 'react';
import { monitoringDict } from '@/lib/monitoringTranslations';
import type { SiteLanguage } from '@/lib/i18n';

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

function ActivityGauge({ level, language }: { level: 'Rendah' | 'Sedang' | 'Tinggi'; language: SiteLanguage }) {
  const isId = language === 'id';
  const isMs = language === 'ms';
  const isZh = language === 'zh';
  const isJa = language === 'ja';

  let lowLabel = 'Rendah';
  let medLabel = 'Sedang';
  let highLabel = 'Tinggi';

  if (!isId) {
    if (isMs) {
      lowLabel = 'Rendah';
      medLabel = 'Sederhana';
      highLabel = 'Tinggi';
    } else if (isZh) {
      lowLabel = '低';
      medLabel = '中';
      highLabel = '高';
    } else if (isJa) {
      lowLabel = '低';
      medLabel = '中';
      highLabel = '高';
    } else {
      lowLabel = 'Low';
      medLabel = 'Moderate';
      highLabel = 'High';
    }
  }

  const levels = ['Rendah', 'Sedang', 'Tinggi'] as const;
  const labelMap = { Rendah: lowLabel, Sedang: medLabel, Tinggi: highLabel };
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
          <span className={`text-xs font-semibold ${i === activeIdx ? 'text-white' : 'text-slate-650 dark:text-slate-600'}`}>{labelMap[l]}</span>
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

export default function SpaceWeather({ language = 'id' }: { language?: SiteLanguage }) {
  const dict = monitoringDict[language] || monitoringDict.id;
  const [data, setData] = useState<DonkiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDonki() {
      try {
        setLoading(true);
        const res = await fetch('/api/nasa/donki');
        if (!res.ok) throw new Error(language === 'id' ? 'Gagal memuat data cuaca antariksa' : 'Failed to load space weather data');
        const json: DonkiData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchDonki();
  }, [language]);

  const getLocalizedLevel = (level: 'Rendah' | 'Sedang' | 'Tinggi') => {
    if (language === 'zh') return level === 'Rendah' ? '低度' : level === 'Sedang' ? '中度' : '高度';
    if (language === 'ja') return level === 'Rendah' ? '低い' : level === 'Sedang' ? '中等' : '高い';
    if (language === 'ms') return level === 'Rendah' ? 'Rendah' : level === 'Sedang' ? 'Sederhana' : 'Tinggi';
    if (language !== 'id') return level === 'Rendah' ? 'Low' : level === 'Sedang' ? 'Moderate' : 'High';
    return level;
  };

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
            <p className="text-slate-400 text-sm mono-font">{dict.loadingWeather}</p>
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
          <div className="dashboard-card p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6 text-left">
              <div className="flex-shrink-0 flex items-center justify-center mx-auto md:mx-0">
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

              <div className="flex-grow flex-shrink">
                <p className="text-xs text-slate-500 mono-font mb-1">
                  {language === 'id' ? 'STATUS AKTIVITAS MATAHARI (7 HARI TERAKHIR)' : language === 'ms' ? 'STATUS AKTIVITI MATAHARI (7 HARI TERAKHIR)' : language === 'zh' ? '太阳活动状态 (过去7天)' : language === 'ja' ? '太陽活動ステータス (過去7日間)' : 'SOLAR ACTIVITY STATUS (LAST 7 DAYS)'}
                </p>
                <h2 className={`text-4xl font-black tracking-tight mb-3 ${levelColorMap[data.activityLevel] || 'text-cyan-400'}`}>
                  {getLocalizedLevel(data.activityLevel)}
                </h2>
                <ActivityGauge level={data.activityLevel} language={language} />
                <p className="text-xs text-slate-500 mt-3 mono-font">
                  {language === 'id' ? 'Periode' : language === 'ms' ? 'Tempoh' : language === 'zh' ? '期间' : language === 'ja' ? '期間' : 'Period'}: {data.period?.start} — {data.period?.end}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="dashboard-card p-3 text-center">
                  <p className="text-2xl font-black mono-font text-rose-400">{data.cmeCount}</p>
                  <p className="text-xs text-slate-550 dark:text-slate-500">{language === 'id' ? 'CME Dikesan' : language === 'ms' ? 'CME Dikesan' : language === 'zh' ? '检测到 CME' : language === 'ja' ? 'CME検出数' : 'CMEs Detected'}</p>
                </div>
                <div className="dashboard-card p-3 text-center">
                  <p className="text-2xl font-black mono-font text-amber-400">{data.flareCount}</p>
                  <p className="text-xs text-slate-550 dark:text-slate-500">Solar Flare</p>
                </div>
              </div>
            </div>
          </div>

          {data.activityLevel === 'Tinggi' && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-left">
              <span className="text-2xl flex-shrink-0 float-anim">🌋</span>
              <div>
                <p className="text-red-400 font-bold text-sm">
                  {language === 'id' ? 'AKTIVITAS MATAHARI TINGGI TERDETEKSI' : language === 'ms' ? 'AKTIVITI MATAHARI TINGGI DIKESAN' : language === 'zh' ? '检测到强太阳活动' : language === 'ja' ? '高レベルの太陽活動を検出' : 'HIGH SOLAR ACTIVITY DETECTED'}
                </p>
                <p className="text-xs text-red-300/70 mt-0.5">
                  {language === 'id' 
                    ? 'Solar flare kelas-X dan/atau CME besar terdeteksi. Potensi gangguan sinyal radio, satelit komunikasi, dan jaringan listrik.'
                    : language === 'ms'
                    ? 'Suar suria kelas-X dan/atau CME besar dikesan. Potensi gangguan isyarat radio, satelit komunikasi dan grid kuasa.'
                    : language === 'zh'
                    ? '检测到 X 级太阳耀斑和/或大规模 CME。这可能会干扰无线电信号、通信卫星和电力网。'
                    : language === 'ja'
                    ? 'Xクラスの太陽フレアおよび/または大規模なCMEが検出されました。無線信号、通信衛星、送電網に干渉する可能性があります。'
                    : 'X-class solar flare and/or major CME detected. Potential interference with radio signals, communication satellites, and power grids.'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            <div className="dashboard-card p-5">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-lg">🌊</span>
                Coronal Mass Ejection (CME)
                <span className="ml-auto text-xs text-slate-500 mono-font">
                  {data.cme.length} {language === 'id' ? 'peristiwa' : language === 'ms' ? 'peristiwa' : language === 'zh' ? '次事件' : language === 'ja' ? '件のイベント' : 'events'}
                </span>
              </h3>
              <div className="space-y-3">
                {data.cme.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">
                    {language === 'id' ? 'Tidak ada CME terdeteksi dalam periode ini.' : language === 'ms' ? 'Tiada CME dikesan dalam tempoh ini.' : language === 'zh' ? '在此期间未检测到 CME。' : language === 'ja' ? 'この期間中にCMEは検出されませんでした。' : 'No CMEs detected in this period.'}
                  </p>
                ) : data.cme.map((c) => (
                  <div key={c.activityID} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-xs mono-font text-slate-350 dark:text-slate-300">
                        {c.startTime ? new Date(c.startTime).toLocaleDateString(dict.weekdayLocale || 'id-ID', {
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

            <div className="dashboard-card p-5">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Solar Flare
                <span className="ml-auto text-xs text-slate-500 mono-font">
                  {data.flares.length} {language === 'id' ? 'peristiwa' : language === 'ms' ? 'peristiwa' : language === 'zh' ? '次事件' : language === 'ja' ? '件のイベント' : 'events'}
                </span>
              </h3>
              <div className="space-y-3">
                {data.flares.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">
                    {language === 'id' ? 'Tidak ada solar flare terdeteksi dalam periode ini.' : language === 'ms' ? 'Tiada suar suria dikesan dalam tempoh ini.' : language === 'zh' ? '在此期间未检测到太阳耀斑。' : language === 'ja' ? 'この期間中に太陽フレアは検出されませんでした。' : 'No solar flares detected in this period.'}
                  </p>
                ) : data.flares.map((f) => (
                  <div key={f.flrID} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs mono-font text-slate-350 dark:text-slate-300">
                        {f.beginTime ? new Date(f.beginTime).toLocaleDateString(dict.weekdayLocale || 'id-ID', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </p>
                      <FlareClassBadge classType={f.classType} />
                    </div>
                    <div className="flex gap-4 mt-1">
                      <p className="text-xs text-slate-500">
                        {language === 'id' ? 'Puncak' : language === 'ms' ? 'Puncak' : language === 'zh' ? '峰值' : language === 'ja' ? 'ピーク' : 'Peak'}: {f.peakTime ? new Date(f.peakTime).toLocaleTimeString(dict.weekdayLocale || 'id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                      {f.sourceLocation && (
                        <p className="text-xs text-slate-550 dark:text-slate-500 mono-font">
                          {language === 'id' ? 'Lokasi' : language === 'ms' ? 'Lokasi' : language === 'zh' ? '位置' : language === 'ja' ? '位置' : 'Location'}: {f.sourceLocation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card p-4 text-left">
            <p className="text-xs text-slate-400 font-semibold mb-3">📖 {language === 'id' ? 'Kelas Solar Flare' : language === 'ms' ? 'Kelas Suar Suria' : language === 'zh' ? '太阳耀斑级别' : language === 'ja' ? '太陽フレアクラス' : 'Solar Flare Classes'}</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {[
                { cls: 'A', desc: language === 'id' ? 'Tidak signifikan' : language === 'ms' ? 'Tiada kesan' : language === 'zh' ? '无影响' : language === 'ja' ? '影響なし' : 'Negligible', color: 'text-slate-400' },
                { cls: 'B', desc: language === 'id' ? 'Sangat kecil' : language === 'ms' ? 'Sangat kecil' : language === 'zh' ? '极微小' : language === 'ja' ? '極微小' : 'Very small', color: 'text-cyan-400' },
                { cls: 'C', desc: language === 'id' ? 'Kecil' : language === 'ms' ? 'Kecil' : language === 'zh' ? '小规模' : language === 'ja' ? '小規模' : 'Small', color: 'text-amber-400' },
                { cls: 'M', desc: language === 'id' ? 'Medium, regional' : language === 'ms' ? 'Sederhana, serantau' : language === 'zh' ? '中等, 区域影响' : language === 'ja' ? '中規模, 地域的影響' : 'Medium, regional', color: 'text-orange-400' },
                { cls: 'X', desc: language === 'id' ? 'Ekstrem, global' : language === 'ms' ? 'Ekstrem, global' : language === 'zh' ? '极端, 全球影响' : language === 'ja' ? '極度, 全球的影響' : 'Extreme, global', color: 'text-red-400' },
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

      <p className="text-xs text-slate-650 mt-4 text-right mono-font">
        Sumber: NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)
      </p>
    </div>
  );
}
