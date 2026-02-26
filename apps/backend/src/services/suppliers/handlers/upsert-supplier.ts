import { upsertSupplier as upsertSupplierAction } from '../actions/upsert-supplier.js';
import type { SupplierPublic } from '../types/index.js';

export async function upsertSupplier(data: unknown): Promise<SupplierPublic> {
  return upsertSupplierAction(data);
}
