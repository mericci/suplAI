/**
 * Strip dots from a Chilean RUT (normalize to DB storage format).
 * "11.111.111-1" → "11111111-1"
 */
export function normalizeRut(rut: string): string {
  return rut.replace(/\./g, '').trim();
}

/**
 * Format a Chilean RUT for display: "11111111K" → "11.111.111-K"
 * Accepts stored format (no dash), dashed format, and already-formatted input.
 */
export function formatRut(rut: string): string {
  const stripped = rut.replace(/\./g, '').trim();
  const dashIdx = stripped.lastIndexOf('-');
  const body = dashIdx !== -1 ? stripped.slice(0, dashIdx) : stripped.slice(0, -1);
  const dv = dashIdx !== -1 ? stripped.slice(dashIdx + 1) : stripped.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv.toUpperCase()}`;
}
