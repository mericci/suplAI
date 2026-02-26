import { deleteSupplier as deleteSupplierAction } from '../actions/delete-supplier.js';

export async function deleteSupplier(id: string): Promise<void> {
  return deleteSupplierAction(id);
}
