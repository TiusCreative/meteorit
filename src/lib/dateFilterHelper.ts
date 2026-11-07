/**
 * Helper utility for parsing and filtering dates across various formats
 * (ISO strings, YYYY-MM-DD, Indonesian date strings, year numbers, etc.)
 */

const ID_MONTHS: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, ags: 8, aug: 8,
  september: 9, sep: 9,
  oktober: 10, okt: 10, oct: 10,
  november: 11, nov: 11,
  desember: 12, des: 12, dec: 12,
};

export interface ParsedDate {
  year: number;
  month: number; // 1 - 12 (0 if unknown)
  day: number;   // 1 - 31 (0 if unknown)
  formattedISO: string; // YYYY-MM-DD if available
}

export function parseItemDate(val: any): ParsedDate | null {
  if (!val) return null;

  // Case 1: Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return {
      year: val.getFullYear(),
      month: val.getMonth() + 1,
      day: val.getDate(),
      formattedISO: val.toISOString().split('T')[0],
    };
  }

  const str = String(val).trim();
  if (!str) return null;

  // Case 2: Standard ISO or YYYY-MM-DD (e.g., "2026-08-12" or "2026-08-12T14:30:00.000Z")
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return {
      year,
      month,
      day,
      formattedISO: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
    };
  }

  // Case 3: Year only (e.g., "1872", "1969")
  if (/^\d{4}$/.test(str)) {
    const year = parseInt(str, 10);
    return {
      year,
      month: 0,
      day: 0,
      formattedISO: `${year}-01-01`,
    };
  }

  // Case 4: Indonesian formatted string (e.g. "12 Agustus 2026" or "12 Aug 2026")
  const parts = str.toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1];
    const year = parseInt(parts[2], 10);
    const month = ID_MONTHS[monthName] || 0;

    if (!isNaN(year) && year > 1000) {
      const padDay = !isNaN(day) && day > 0 ? String(day).padStart(2, '0') : '01';
      const padMonth = month > 0 ? String(month).padStart(2, '0') : '01';
      return {
        year,
        month,
        day: !isNaN(day) ? day : 0,
        formattedISO: `${year}-${padMonth}-${padDay}`,
      };
    }
  }

  // Case 5: Native JS Date parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    const padMonth = String(month).padStart(2, '0');
    const padDay = String(day).padStart(2, '0');
    return {
      year,
      month,
      day,
      formattedISO: `${year}-${padMonth}-${padDay}`,
    };
  }

  return null;
}

export interface DateFilterState {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  selectedMonth: string; // "1" to "12" or ""
  selectedYear: string;  // "2026" or ""
}

export function matchesDateFilter(item: any, filter: DateFilterState): boolean {
  const { startDate, endDate, selectedMonth, selectedYear } = filter;

  // If no filters are set, include everything
  if (!startDate && !endDate && !selectedMonth && !selectedYear) {
    return true;
  }

  // Extract candidate date values from item object or primitive
  let yearCandidate = typeof item === 'object' && item !== null ? (item.year || item.date || item.createdAt || item.id) : item;
  let fullDateCandidate = typeof item === 'object' && item !== null ? (item.createdAt || item.date || item.year || item.id) : item;

  const parsedYear = parseItemDate(yearCandidate);
  const parsedFull = parseItemDate(fullDateCandidate);
  const parsed = parsedFull || parsedYear;

  if (!parsed && !parsedYear) return false;

  // 1. Year filter (check fall year e.g. 1872 or registration year)
  if (selectedYear) {
    const reqYear = parseInt(selectedYear, 10);
    const matchYear = (parsedYear && parsedYear.year === reqYear) || (parsedFull && parsedFull.year === reqYear);
    if (!matchYear) return false;
  }

  // 2. Month filter
  if (selectedMonth) {
    const reqMonth = parseInt(selectedMonth, 10);
    const itemMonth = (parsedFull && parsedFull.month !== 0) ? parsedFull.month : (parsedYear?.month || 0);
    if (itemMonth !== 0 && itemMonth !== reqMonth) return false;
  }

  // 3. Start Date filter (YYYY-MM-DD)
  if (startDate) {
    const iso = (parsedFull && parsedFull.formattedISO) ? parsedFull.formattedISO : (parsedYear?.formattedISO || '');
    if (iso && iso < startDate) return false;
  }

  // 4. End Date filter (YYYY-MM-DD)
  if (endDate) {
    const iso = (parsedFull && parsedFull.formattedISO) ? parsedFull.formattedISO : (parsedYear?.formattedISO || '');
    if (iso && iso > endDate) return false;
  }

  return true;
}
