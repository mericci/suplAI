/**
 * List Pending Distributions Action
 *
 * Returns invoices that have 'manual' distribution configured for their supplier
 * but do not yet have distribution records created.
 */

import { supabase } from '../../../lib/supabase.js';
import * as supplierCostCenterDb from '../../../db/supplier-cost-center.db.js';
import * as supplierAccountingIdDb from '../../../db/supplier-accounting-id.db.js';
import * as invoiceDistributionDb from '../../../db/invoice-distribution.db.js';
import { getErrorMessage } from '../../../utils/error.js';

interface PendingCostCenter {
  id: string;
  name: string;
  externalId: string;
}

interface PendingAccountingId {
  id: string;
  externalId: string;
  description: string;
}

export interface PendingDistributionInvoice {
  id: string;
  folio: string;
  supplierName: string;
  netAmount: number;
  issueDate: string;
  pendingCostCenters: PendingCostCenter[];
  pendingAccountingIds: PendingAccountingId[];
}

interface InvoiceRow {
  id: string;
  document_number: string;
  net_amount: number | null;
  issue_date: string;
  supplier_id: string;
  suppliers: { legal_name: string } | null;
}

export async function listPendingDistributions(
  organizationId: string,
): Promise<PendingDistributionInvoice[]> {
  try {
    // Get all suppliers with manual distribution for cost centers and accounting IDs
    const [ccManualSuppliers, aiManualSuppliers] = await Promise.all([
      supplierCostCenterDb.findSuppliersWithManualDistribution(organizationId),
      supplierAccountingIdDb.findSuppliersWithManualDistribution(organizationId),
    ]);

    const allManualSupplierIds = [...new Set([...ccManualSuppliers, ...aiManualSuppliers])];
    if (allManualSupplierIds.length === 0) return [];

    // Fetch invoices for those suppliers in this org
    const { data: invoices, error } = await supabase
      .from('invoices' as never)
      .select('id, document_number, net_amount, issue_date, supplier_id, suppliers!inner(legal_name)')
      .eq('organization_id', organizationId)
      .in('supplier_id', allManualSupplierIds)
      .is('deleted_at', null)
      .order('issue_date', { ascending: false });

    if (error) throw new Error(`Database error: ${error.message}`);

    const invoiceRows = (invoices ?? []) as InvoiceRow[];
    if (invoiceRows.length === 0) return [];

    const invoiceIds = invoiceRows.map((i) => i.id);

    // Find which ones already have distributions
    const [withCC, withAI] = await Promise.all([
      invoiceDistributionDb.getInvoiceIdsWithCostCenterDistributions(organizationId, invoiceIds),
      invoiceDistributionDb.getInvoiceIdsWithAccountingIdDistributions(organizationId, invoiceIds),
    ]);

    // Build a map: supplierId → { costCenters[], accountingIds[] }
    const supplierCCMap = new Map<string, PendingCostCenter[]>();
    const supplierAIMap = new Map<string, PendingAccountingId[]>();

    // Fetch the actual cost centers and accounting IDs for each supplier with manual distribution
    await Promise.all([
      ...ccManualSuppliers.map(async (supplierId) => {
        const links = await supplierCostCenterDb.findAllBySupplierAndOrg(supplierId, organizationId);
        supplierCCMap.set(supplierId, links.map((l) => ({
          id: l.cost_center_id,
          name: l.cost_center_name,
          externalId: l.cost_center_external_id,
        })));
      }),
      ...aiManualSuppliers.map(async (supplierId) => {
        const links = await supplierAccountingIdDb.findAllBySupplierAndOrg(supplierId, organizationId);
        supplierAIMap.set(supplierId, links.map((l) => ({
          id: l.accounting_id,
          externalId: l.accounting_external_id,
          description: l.accounting_description,
        })));
      }),
    ]);

    // Build result: only include invoices that are pending for at least one type
    const result: PendingDistributionInvoice[] = [];

    for (const invoice of invoiceRows) {
      const pendingCostCenters = !withCC.has(invoice.id)
        ? (supplierCCMap.get(invoice.supplier_id) ?? [])
        : [];
      const pendingAccountingIds = !withAI.has(invoice.id)
        ? (supplierAIMap.get(invoice.supplier_id) ?? [])
        : [];

      if (pendingCostCenters.length === 0 && pendingAccountingIds.length === 0) continue;

      result.push({
        id: invoice.id,
        folio: invoice.document_number,
        supplierName: invoice.suppliers?.legal_name ?? 'Desconocido',
        netAmount: Number(invoice.net_amount ?? 0),
        issueDate: invoice.issue_date,
        pendingCostCenters,
        pendingAccountingIds,
      });
    }

    return result;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
