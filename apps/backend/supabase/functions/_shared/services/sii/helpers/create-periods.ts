const PERIOD_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

function parsePeriod(period: string): { year: number; month: number } {
  if (!PERIOD_FORMAT.test(period)) {
    throw new Error(`Invalid period format: expected YYYY-MM, got "${period}"`);
  }
  const [y, m] = period.split('-').map(Number);
  return { year: y, month: m };
}

function periodToString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Builds an array of periods (YYYY-MM) from `from` up to `to` (inclusive).
 * If `to` is omitted, uses the current year-month.
 *
 * @param from - Start period, e.g. "2026-01"
 * @param to - End period, e.g. "2026-03"; if omitted, up to current month
 * @returns Array of "YYYY-MM" strings
 */
function createPeriods(from: string, to?: string): string[] {
  const start = parsePeriod(from);
  const now = new Date();
  const end = to !== undefined
    ? parsePeriod(to)
    : { year: now.getFullYear(), month: now.getMonth() + 1 };

  let { year } = start;
  let { month } = start;
  const result: string[] = [];

  while (year < end.year || (year === end.year && month <= end.month)) {
    result.push(periodToString(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return result;
}

export default createPeriods;
