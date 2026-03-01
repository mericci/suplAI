import { updateSupplier as updateSupplierAction } from '../actions/update-supplier.ts';
import type { SupplierPublic } from '../types/index.ts';

export async function updateSupplier(
  id: string,
  data: unknown,
): Promise<SupplierPublic> {
  return updateSupplierAction(id, data);
}
