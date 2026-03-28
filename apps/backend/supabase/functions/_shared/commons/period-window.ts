/**
 * Period Window Utility
 *
 * Converts a contabilidad period key into a { start, end } date range (ISO strings).
 * Used by cost-centers and accounting-ids services to filter invoice aggregates.
 */

export type ContabilidadPeriod = 'all' | 'ytd' | '1m' | 'current_month' | '1y';

export interface PeriodWindow {
  start: string | null;
  end: string | null;
}

export function getPeriodWindow(period: ContabilidadPeriod): PeriodWindow {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === 'all') {
    return { start: null, end: null };
  }

  if (period === 'ytd') {
    return {
      start: new Date(year, 0, 1).toISOString().split('T')[0],
      end: today,
    };
  }

  if (period === '1m') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return { start: d.toISOString().split('T')[0], end: today };
  }

  if (period === 'current_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  // '1y': last 365 days
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - 1);
  return { start: d.toISOString().split('T')[0], end: today };
}
