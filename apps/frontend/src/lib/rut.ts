/**
 * Strip dots from a Chilean RUT (normalize to DB storage format).
 * "76.124.890-1" → "76124890-1"
 */
export function normalizeRut(rut: string): string {
  return rut.replace(/\./g, '').trim();
}

/**
 * Format a Chilean RUT for display, adding thousand-separator dots.
 * "76124890-1" → "76.124.890-1"
 */
export function formatRut(rut: string): string {
  const normalized = normalizeRut(rut);
  const dashIdx = normalized.lastIndexOf('-');
  if (dashIdx === -1) return normalized;
  const body = normalized.slice(0, dashIdx);
  const dv = normalized.slice(dashIdx); // e.g. "-1" or "-K"
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted + dv;
}
