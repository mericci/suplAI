import { listSuppliers as listSuppliersAction } from '../actions/list-suppliers.ts';

export async function listSuppliers(
  filters: unknown,
): ReturnType<typeof listSuppliersAction> {
  return listSuppliersAction(filters);
}
