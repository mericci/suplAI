import type { Router } from '../../lib/router.ts';
import {
  listSupplierCostCentersHandler,
  upsertSupplierCostCentersHandler,
  deleteSupplierCostCenterHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerSupplierCostCenterRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/suppliers/:supplierId/cost-centers',
    requireAuth(async (req) => listSupplierCostCentersHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/suppliers/:supplierId/cost-centers',
    requireAuth(async (req) => upsertSupplierCostCentersHandler(req)),
  );

  router.delete(
    '/api/organizations/:orgId/suppliers/:supplierId/cost-centers/:id',
    requireAuth(async (req) => deleteSupplierCostCenterHandler(req)),
  );
}
