export interface DateRange {
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateStr(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

export function formatMonthYear(d: Date): string {
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
