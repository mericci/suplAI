import { upsertSupplier as upsertSupplierAction } from '../actions/upsert-supplier.ts';
import type { SupplierPublic } from '../types/index.ts';

export async function upsertSupplier(data: unknown): Promise<SupplierPublic> {
  return upsertSupplierAction(data);
}
