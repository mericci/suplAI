import { getSupplier as getSupplierAction } from '../actions/get-supplier.js';
import type { SupplierPublic, SupplierSearchParams } from '../types/index.js';

export async function getSupplier(
  params: SupplierSearchParams,
): Promise<SupplierPublic> {
  return getSupplierAction(params);
}
