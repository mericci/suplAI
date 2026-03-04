import { createSupplierDocument as createAction } from '../actions/create-supplier-document.ts';
import type { SupplierDocument } from '@supl/shared';

export async function createSupplierDocument(data: unknown): Promise<SupplierDocument> {
  return createAction(data);
}
