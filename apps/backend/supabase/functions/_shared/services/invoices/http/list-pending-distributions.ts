import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import * as supplierCostCenterDb from '../../../db/supplier-cost-center.db.ts';
import * as supplierAccountingIdDb from '../../../db/supplier-accounting-id.db.ts';
import * as invoiceDistributionDb from '../../../db/invoice-distribution.db.ts';
import { supabase } from '../../../lib/supabase.ts';

interface InvoiceRow {
  id: string;
  document_number: string;
  net_amount: number | null;
  issue_date: string;
  supplier_id: string;
  suppliers: { legal_name: string } | null;
}

export async function listPendingDistributionsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const [ccManualSuppliers, aiManualSuppliers] = await Promise.all([
      supplierCostCenterDb.findSuppliersWithManualDistribution(orgId),
      supplierAccountingIdDb.findSuppliersWithManualDistribution(orgId),
    ]);

    const allManualSupplierIds = [...new Set([...ccManualSuppliers, ...aiManualSuppliers])];
    if (allManualSupplierIds.length === 0) return successResponse([]);

    const { data: invoices, error } = await supabase
      .from('invoices' as never)
      .select('id, document_number, net_amount, issue_date, supplier_id, suppliers!inner(legal_name)')
      .eq('organization_id', orgId)
      .in('supplier_id', allManualSupplierIds)
      .is('deleted_at', null)
      .order('issue_date', { ascending: false });

    if (error) throw new Error(`Database error: ${error.message}`);

    const invoiceRows = (invoices ?? []) as InvoiceRow[];
    if (invoiceRows.length === 0) return successResponse([]);

    const invoiceIds = invoiceRows.map((i) => i.id);

    const [withCC, withAI] = await Promise.all([
      invoiceDistributionDb.getInvoiceIdsWithCostCenterDistributions(orgId, invoiceIds),
      invoiceDistributionDb.getInvoiceIdsWithAccountingIdDistributions(orgId, invoiceIds),
    ]);

    const supplierCCMap = new Map<string, Array<{ id: string; name: string; externalId: string }>>();
    const supplierAIMap = new Map<string, Array<{ id: string; externalId: string; description: string }>>();

    await Promise.all([
      ...ccManualSuppliers.map(async (supplierId) => {
        const links = await supplierCostCenterDb.findAllBySupplierAndOrg(supplierId, orgId);
        supplierCCMap.set(supplierId, links.map((l) => ({
          id: l.cost_center_id,
          name: l.cost_center_name,
          externalId: l.cost_center_external_id,
        })));
      }),
      ...aiManualSuppliers.map(async (supplierId) => {
        const links = await supplierAccountingIdDb.findAllBySupplierAndOrg(supplierId, orgId);
        supplierAIMap.set(supplierId, links.map((l) => ({
          id: l.accounting_id,
          externalId: l.accounting_external_id,
          description: l.accounting_description,
        })));
      }),
    ]);

    const result = [];
    for (const invoice of invoiceRows) {
      const pendingCostCenters = !withCC.has(invoice.id) ? (supplierCCMap.get(invoice.supplier_id) ?? []) : [];
      const pendingAccountingIds = !withAI.has(invoice.id) ? (supplierAIMap.get(invoice.supplier_id) ?? []) : [];

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

    return successResponse(result);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Unexpected error');
  }
}
