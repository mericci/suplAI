/**
 * Formats a Chilean RUT from its numeric body and verification digit
 * into the canonical string format: "<dni>-<dv>".
 *
 * Example: formatRut(12345678, 'K') → "12345678-K"
 */
export function formatRut(dni: number, dv: string): string {
  return `${dni}-${dv}`;
}
