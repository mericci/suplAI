/**
 * Normalize a Chilean RUT by stripping dots (but keeping the dash).
 * Stored format: "11111111-1" (no dots)
 * Display format: "11.111.111-1" (with dots) — handled by the frontend
 */
export function normalizeRut(rut: string): string {
  return rut.replace(/\./g, '').trim();
}

/**
 * Format a Chilean RUT for display, adding thousand-separator dots.
 * "11111111-1" → "11.111.111-1"
 */
export function formatRut(rut: string): string {
  const normalized = normalizeRut(rut);
  const dashIdx = normalized.lastIndexOf('-');
  if (dashIdx === -1) return normalized;
  const body = normalized.slice(0, dashIdx);
  const dv = normalized.slice(dashIdx);
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + dv;
}
