import { getSupplier as getSupplierAction } from '../actions/get-supplier.ts';
import type { SupplierPublic, SupplierSearchParams } from '../types/index.ts';

export async function getSupplier(
  params: SupplierSearchParams,
): Promise<SupplierPublic> {
  return getSupplierAction(params);
}
