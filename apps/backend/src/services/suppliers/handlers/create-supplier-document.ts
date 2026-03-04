import type { SupplierDocument } from '@supl/shared';
import { createSupplierDocument as createAction } from '../actions/create-supplier-document.js';

export async function createSupplierDocument(data: unknown): Promise<SupplierDocument> {
  return createAction(data);
}
