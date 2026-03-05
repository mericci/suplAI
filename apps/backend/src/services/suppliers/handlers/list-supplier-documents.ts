import type { SupplierDocument } from '@supl/shared';
import { listSupplierDocuments as listAction } from '../actions/list-supplier-documents.js';

export async function listSupplierDocuments(supplierId: string): Promise<SupplierDocument[]> {
  return listAction(supplierId);
}
