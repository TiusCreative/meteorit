'use client';

import { useEffect, useState } from 'react';

interface FireballEvent {
  date: string;
  energy: string | null;
  impact_e: string | null;
  lat: string | null;
  lon: string | null;
  lat_dir: string | null;
  lon_dir: string | null;
  alt: string | null;
  vel: string | null;
}

function formatLatLon(lat: string | null, latDir: string | null, lon: string | null, lonDir: string | null): string {
  if (!lat || !lon) return '—';
  return `${parseFloat(lat).toFixed(1)}°${latDir || ''}, ${parseFloat(lon).toFixed(1)}°${lonDir || ''}`;
}

import { monitoringDict } from '@/lib/monitoringTranslations';
import type { SiteLanguage } from '@/lib/i18n';

function getEnergyLevel(energy: string | null, language: SiteLanguage): { label: string; color: string } {
  const isId = language === 'id';
  const isMs = language === 'ms';
  const isZh = language === 'zh';
  const isJa = language === 'ja';

  let label = 'Tak Diketahui';
  if (language !== 'id') {
    if (isZh) label = '未知';
    else if (isJa) label = '不明';
    else label = 'Unknown';
  }

  if (!energy) return { label, color: 'text-slate-400' };
  const val = parseFloat(energy);
  
  if (val >= 1000) {
    if (isZh) label = '极端';
    else if (isJa) label = '極度';
    else if (isMs) label = 'Ekstrem';
    else if (isId) label = 'Ekstrem';
    else label = 'Extreme';
    return { label, color: 'text-red-400' };
  }
  if (val >= 100) {
    if (isZh) label = '极大';
    else if (isJa) label = '極大';
    else if (isMs) label = 'Sangat Besar';
    else if (isId) label = 'Sangat Besar';
    else label = 'Very Large';
    return { label, color: 'text-orange-400' };
  }
  if (val >= 10) {
    if (isZh) label = '大型';
    else if (isJa) label = '大型';
    else if (isMs) label = 'Besar';
    else if (isId) label = 'Besar';
    else label = 'Large';
    return { label, color: 'text-amber-400' };
  }
  if (val >= 1) {
    if (isZh) label = '中等';
    else if (isJa) label = '中程度';
    else if (isMs) label = 'Sederhana';
    else if (isId) label = 'Sedang';
    else label = 'Moderate';
    return { label, color: 'text-yellow-400' };
  }
  
  if (isZh) label = '微小';
  else if (isJa) label = '極小';
  else if (isMs) label = 'Kecil';
  else if (isId) label = 'Kecil';
  else label = 'Small';
  return { label, color: 'text-cyan-400' };
}

export default function FireballFeed({ language = 'id' }: { language?: SiteLanguage }) {
  const dict = monitoringDict[language] || monitoringDict.id;
  const [data, setData] = useState<FireballEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'energy'>('date');

  useEffect(() => {
    async function fetchFireball() {
      try {
        setLoading(true);
        const res = await fetch('/api/nasa/fireball');
        if (!res.ok) throw new Error(language === 'id' ? 'Gagal memuat data bola api' : 'Failed to load fireball data');
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchFireball();
  }, [language]);

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'energy') {
      return (parseFloat(b.energy || '0')) - (parseFloat(a.energy || '0'));
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const maxEnergy = Math.max(...data.map((d) => parseFloat(d.energy || '0')));

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="dashboard-card p-4 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <p className="text-2xl font-black mono-font text-orange-400">{loading ? '...' : data.length}</p>
          <p className="text-xs text-slate-500">{dict.totalFireballs}</p>
        </div>
        <div className="dashboard-card p-4 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-2xl font-black mono-font text-amber-400">
            {loading ? '...' : (maxEnergy > 0 ? maxEnergy.toFixed(0) : '—')}
          </p>
          <p className="text-xs text-slate-500">{dict.maxImpact} (GJ)</p>
        </div>
        <div className="dashboard-card p-4 text-center col-span-2 md:col-span-1">
          <div className="text-2xl mb-1">🌍</div>
          <p className="text-2xl font-black mono-font text-rose-400">
            {loading ? '...' : data.filter((d) => d.lat && d.lon).length}
          </p>
          <p className="text-xs text-slate-500">{dict.latestImpact}</p>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3 mb-4 text-left justify-start">
        <span className="text-xs text-slate-400">
          {language === 'id' ? 'Urutkan:' : language === 'ms' ? 'Isih:' : language === 'zh' ? '排序:' : language === 'ja' ? '並び替え:' : 'Sort:'}
        </span>
        {(['date', 'energy'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              sortBy === s
                ? 'border-orange-400 text-orange-400 bg-orange-400/10'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {s === 'date' 
              ? `📅 ${language === 'id' ? 'Terbaru' : language === 'ms' ? 'Terkini' : language === 'zh' ? '最新' : language === 'ja' ? '最新' : 'Latest'}` 
              : `⚡ ${dict.maxEnergy || dict.maxImpact}`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm mono-font">{dict.loadingFireball}</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl border border-red-500/30 text-center py-12">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/80">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold mono-font">
                    {language === 'id' ? 'TANGGAL & WAKTU (UTC)' : language === 'ms' ? 'TARIKH & MASA (UTC)' : language === 'zh' ? '日期与时间 (UTC)' : language === 'ja' ? '日時 (UTC)' : 'DATE & TIME (UTC)'}
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold mono-font">
                    {language === 'id' ? 'ENERGI (GJ)' : language === 'ms' ? 'TENAGA (GJ)' : language === 'zh' ? '能量 (GJ)' : language === 'ja' ? 'エネルギー (GJ)' : 'ENERGY (GJ)'}
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold mono-font hidden md:table-cell">
                    {dict.impactEnergy} (kt TNT)
                  </th>
                  <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold mono-font hidden lg:table-cell">
                    {language === 'id' ? 'KOORDINAT' : language === 'ms' ? 'KOORDINAT' : language === 'zh' ? '坐标' : language === 'ja' ? '座標' : 'COORDINATES'}
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold mono-font hidden md:table-cell">
                    {dict.velocityLabel} (km/s)
                  </th>
                  <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold">LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((event, idx) => {
                  const energyInfo = getEnergyLevel(event.energy, language);
                  const energyVal = event.energy ? parseFloat(event.energy).toFixed(2) : '—';
                  const impactVal = event.impact_e ? parseFloat(event.impact_e).toFixed(3) : '—';
                  const velVal = event.vel ? parseFloat(event.vel).toFixed(1) : '—';
                  const coords = formatLatLon(event.lat, event.lat_dir, event.lon, event.lon_dir);
                  const dateStr = event.date ? new Date(event.date).toLocaleDateString(dict.weekdayLocale || 'id-ID', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : '—';
                  
                  // Energy bar width
                  const energyNum = parseFloat(event.energy || '0');
                  const barWidth = maxEnergy > 0 ? (energyNum / maxEnergy) * 100 : 0;

                  return (
                    <tr
                      key={`${event.date}-${idx}`}
                      className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors text-left"
                    >
                      <td className="px-4 py-3 mono-font text-xs text-slate-300">{dateStr}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`mono-font text-xs font-bold ${energyInfo.color}`}>{energyVal}</span>
                          {event.energy && (
                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-red-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right mono-font text-xs text-slate-400 hidden md:table-cell">{impactVal}</td>
                      <td className="px-4 py-3 text-center mono-font text-xs text-slate-400 hidden lg:table-cell">{coords}</td>
                      <td className="px-4 py-3 text-right mono-font text-xs text-slate-400 hidden md:table-cell">{velVal}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold ${energyInfo.color}`}>{energyInfo.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      {dict.noFireballData}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-650 mt-4 text-right mono-font">
        Sumber: JPL Fireball Data API • GJ = Gigajoule • kt = kiloton TNT
      </p>
    </div>
  );
}
