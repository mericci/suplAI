import { deleteSupplier as deleteSupplierAction } from '../actions/delete-supplier.ts';

export async function deleteSupplier(id: string): Promise<void> {
  return deleteSupplierAction(id);
}
