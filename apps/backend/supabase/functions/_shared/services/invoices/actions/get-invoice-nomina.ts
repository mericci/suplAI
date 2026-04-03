import * as invoiceDb from '../../../db/invoice.db.ts';
import * as nominaDb from '../../../db/nomina.db.ts';
import type { NominaRow } from '../../../db/nomina.db.ts';

export async function getInvoiceNomina(
  id: string,
  organizationId: string,
): Promise<NominaRow | null> {
  const existing = await invoiceDb.findById(id, organizationId);
  if (!existing) throw new Error('Invoice not found');

  return nominaDb.findNominaByInvoiceId(id, organizationId);
}
