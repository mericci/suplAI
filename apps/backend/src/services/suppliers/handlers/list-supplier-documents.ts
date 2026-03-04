import { listSupplierDocuments as listAction } from '../actions/list-supplier-documents.js';
import type { SupplierDocument } from '@supl/shared';

export async function listSupplierDocuments(supplierId: string): Promise<SupplierDocument[]> {
  return listAction(supplierId);
}
