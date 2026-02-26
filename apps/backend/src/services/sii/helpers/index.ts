import createPeriods from './create-periods';

export { createPeriods };

/**
 * Maps the SII DTE event description to our internal invoice status.
 *
 * SII tracks two explicit receiver events (Ley 20.956):
 *   - ACD ("Aceptación de Contenido del DTE") → keep as pending (user still reviews before approving payment)
 *   - RCD ("Reclamo al Contenido del DTE")    → auto-reject
 *
 * No response means pending (auto-accepted by law after 8 days).
 * Paid status is never known to SII — it must remain a manual internal action.
 *
 * NOTE: The exact `dehDescripcion` string values returned by the live SII API are not
 * publicly documented. A debug log is emitted in get-sii-invoices.ts so we can confirm
 * the real values during the first real sync.
 */
export function mapSiiEventToStatus(
  dehDescripcion: string | null,
): 'pending' | 'rejected' {
  if (!dehDescripcion) return 'pending';
  if (dehDescripcion.toLowerCase().includes('reclamo')) return 'rejected';
  return 'pending';
}
