export interface DateRange {
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  let isBCE = false;
  let cleanStr = dateStr.trim();
  if (cleanStr.startsWith('-')) {
    isBCE = true;
    cleanStr = cleanStr.slice(1);
  }
  const parts = cleanStr.split('-').map(Number);
  let year = parts[0] || 0;
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;
  if (isBCE) year = -year;

  const d = new Date(0);
  d.setUTCFullYear(year, month, day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function formatDateStr(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (year < 0) {
    return `-${String(Math.abs(year)).padStart(4, '0')}-${month}-${day}`;
  }
  return `${String(year).padStart(4, '0')}-${month}-${day}`;
}

export function formatYearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year === 0) return '1 BC';
  if (year < 1000) return `${year} AD`;
  return `${year}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  const year = d.getUTCFullYear();

  // Historical dates (BCE or early AD)
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }
  if (year < 1200) {
    return `${year} AD`;
  }

  // Modern / standard dates
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

export function formatMonthYear(d: Date): string {
  const year = d.getUTCFullYear();
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }
  if (year < 1000) {
    return `${year} AD`;
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Calculates pixel X offset from the timeline origin date
 */
export function dateToPixelX(dateStr: string, originDate: Date, pxPerDay: number): number {
  const d = parseDate(dateStr);
  const diffTime = d.getTime() - originDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.round(diffDays * pxPerDay);
}

/**
 * Converts pixel X offset back to date string
 */
export function pixelXToDate(x: number, originDate: Date, pxPerDay: number): string {
  const days = Math.round(x / pxPerDay);
  const targetDate = new Date(originDate.getTime() + days * 24 * 60 * 60 * 1000);
  return formatDateStr(targetDate);
}

/**
 * Finds a midpoint date between two date strings (useful for inserting between nodes)
 */
export function getMidpointDate(dateA: string, dateB: string): string {
  const dA = parseDate(dateA).getTime();
  const dB = parseDate(dateB).getTime();
  const mid = new Date(Math.round((dA + dB) / 2));
  return formatDateStr(mid);
}

/**
 * Adds days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateStr(d);
}

/**
 * Difference in days between dateB and dateA (dateB - dateA)
 */
export function diffInDays(dateA: string, dateB: string): number {
  const dA = parseDate(dateA).getTime();
  const dB = parseDate(dateB).getTime();
  return Math.round((dB - dA) / (1000 * 60 * 60 * 24));
}

/**
 * Chronological comparison for sorting date strings (including BCE and CE)
 */
export function compareDateStrings(dateA: string, dateB: string): number {
  const dA = parseDate(dateA).getTime();
  const dB = parseDate(dateB).getTime();
  return dA - dB;
}

