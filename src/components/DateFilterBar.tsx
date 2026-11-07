"use client";

import { useMemo } from 'react';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export interface DateFilterValue {
  startDate: string;
  endDate: string;
  selectedMonth: string;
  selectedYear: string;
}

interface DateFilterBarProps {
  value: DateFilterValue;
  onChange: (newValue: DateFilterValue) => void;
  availableYears?: number[];
  className?: string;
}

const MONTH_NAMES: Record<string, string[]> = {
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

const UI_TEXT: Record<string, {
  dateFilterTitle: string;
  startDate: string;
  endDate: string;
  month: string;
  year: string;
  allMonths: string;
  allYears: string;
  presetAll: string;
  presetToday: string;
  presetThisMonth: string;
  presetThisYear: string;
  resetFilter: string;
}> = {
  id: {
    dateFilterTitle: '📅 Filter Tanggal & Periode Rilis',
    startDate: 'Dari Tanggal',
    endDate: 'Sampai Tanggal',
    month: 'Bulan',
    year: 'Tahun',
    allMonths: 'Semua Bulan',
    allYears: 'Semua Tahun',
    presetAll: 'Semua',
    presetToday: 'Hari Ini',
    presetThisMonth: 'Bulan Ini',
    presetThisYear: 'Tahun Ini',
    resetFilter: 'Reset Filter',
  },
  en: {
    dateFilterTitle: '📅 Filter by Date & Publishing Period',
    startDate: 'From Date',
    endDate: 'To Date',
    month: 'Month',
    year: 'Year',
    allMonths: 'All Months',
    allYears: 'All Years',
    presetAll: 'All',
    presetToday: 'Today',
    presetThisMonth: 'This Month',
    presetThisYear: 'This Year',
    resetFilter: 'Reset Filter',
  },
  ms: {
    dateFilterTitle: '📅 Tapis mengikut Tarikh & Tempoh Rilis',
    startDate: 'Dari Tarikh',
    endDate: 'Hingga Tarikh',
    month: 'Bulan',
    year: 'Tahun',
    allMonths: 'Semua Bulan',
    allYears: 'Semua Tahun',
    presetAll: 'Semua',
    presetToday: 'Hari Ini',
    presetThisMonth: 'Bulan Ini',
    presetThisYear: 'Tahun Ini',
    resetFilter: 'Set Semula',
  },
  zh: {
    dateFilterTitle: '📅 按日期和发布周期筛选',
    startDate: '开始日期',
    endDate: '结束日期',
    month: '月份',
    year: '年份',
    allMonths: '所有月份',
    allYears: '所有年份',
    presetAll: '全部',
    presetToday: '今天',
    presetThisMonth: '本月',
    presetThisYear: '今年',
    resetFilter: '重置筛选',
  },
  ja: {
    dateFilterTitle: '📅 日付・公開期間で絞り込み',
    startDate: '開始日',
    endDate: '終了日',
    month: '月',
    year: '年',
    allMonths: 'すべての月',
    allYears: 'すべての年',
    presetAll: 'すべて',
    presetToday: '今日',
    presetThisMonth: '今月',
    presetThisYear: '今年',
    resetFilter: 'リセット',
  },
};

export default function DateFilterBar({
  value,
  onChange,
  availableYears,
  className = '',
}: DateFilterBarProps) {
  const language = useSiteLanguage();
  const text = UI_TEXT[language] || UI_TEXT.id;
  const monthNames = MONTH_NAMES[language] || MONTH_NAMES.id;

  // Generate fallback years list (e.g. 2026 down to 1970, or provided list)
  const yearOptions = useMemo(() => {
    if (availableYears && availableYears.length > 0) {
      return [...availableYears].sort((a, b) => b - a);
    }
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 2000; y--) {
      years.push(y);
    }
    return years;
  }, [availableYears]);

  const isActive = Boolean(value.startDate || value.endDate || value.selectedMonth || value.selectedYear);

  const handleReset = () => {
    onChange({
      startDate: '',
      endDate: '',
      selectedMonth: '',
      selectedYear: '',
    });
  };

  const handlePresetToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onChange({
      startDate: todayStr,
      endDate: todayStr,
      selectedMonth: '',
      selectedYear: '',
    });
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1);
    onChange({
      startDate: '',
      endDate: '',
      selectedMonth: currentMonth,
      selectedYear: currentYear,
    });
  };

  const handlePresetThisYear = () => {
    const currentYear = String(new Date().getFullYear());
    onChange({
      startDate: '',
      endDate: '',
      selectedMonth: '',
      selectedYear: currentYear,
    });
  };

  return (
    <div className={`bg-slate-900/60 backdrop-blur border border-cyan-900/40 p-4 md:p-5 rounded-2xl mb-6 text-left shadow-lg ${className}`}>
      {/* Header & Preset Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
            {text.dateFilterTitle}
          </span>
          {isActive && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
              Aktif
            </span>
          )}
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handlePresetToday}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {text.presetToday}
          </button>
          <button
            type="button"
            onClick={handlePresetThisMonth}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {text.presetThisMonth}
          </button>
          <button
            type="button"
            onClick={handlePresetThisYear}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {text.presetThisYear}
          </button>

          {isActive && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>✕</span>
              <span>{text.resetFilter}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Start Date */}
        <div>
          <label className="block text-gray-400 font-semibold mb-1">{text.startDate}</label>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-cyan-900/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-gray-400 font-semibold mb-1">{text.endDate}</label>
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-cyan-900/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Month Selector */}
        <div>
          <label className="block text-gray-400 font-semibold mb-1">{text.month}</label>
          <select
            value={value.selectedMonth}
            onChange={(e) => onChange({ ...value, selectedMonth: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-cyan-900/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value="">{text.allMonths}</option>
            {monthNames.map((name, idx) => (
              <option key={idx} value={String(idx + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-gray-400 font-semibold mb-1">{text.year}</label>
          <select
            value={value.selectedYear}
            onChange={(e) => onChange({ ...value, selectedYear: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-cyan-900/50 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value="">{text.allYears}</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
