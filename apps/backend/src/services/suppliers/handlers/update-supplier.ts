import { updateSupplier as updateSupplierAction } from '../actions/update-supplier.js';
import type { SupplierPublic } from '../types/index.js';

export async function updateSupplier(
  id: string,
  data: unknown,
): Promise<SupplierPublic> {
  return updateSupplierAction(id, data);
}
