import { listSuppliers as listSuppliersAction } from '../actions/list-suppliers.js';

export async function listSuppliers(
  filters: unknown,
): ReturnType<typeof listSuppliersAction> {
  return listSuppliersAction(filters);
}
