import type { Router } from '../../lib/router.ts';
import {
  listSupplierAccountingIdsHandler,
  upsertSupplierAccountingIdsHandler,
  deleteSupplierAccountingIdHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerSupplierAccountingIdRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/suppliers/:supplierId/accounting-ids',
    requireAuth(async (req) => listSupplierAccountingIdsHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/suppliers/:supplierId/accounting-ids',
    requireAuth(async (req) => upsertSupplierAccountingIdsHandler(req)),
  );

  router.delete(
    '/api/organizations/:orgId/suppliers/:supplierId/accounting-ids/:id',
    requireAuth(async (req) => deleteSupplierAccountingIdHandler(req)),
  );
}
