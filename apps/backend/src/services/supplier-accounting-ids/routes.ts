/**
 * Supplier Accounting IDs service routes.
 * Nested under /api/organizations/:orgId/suppliers/:supplierId/accounting-ids.
 */

import type { Router } from '../../lib/router.js';
import {
  listSupplierAccountingIdsHandler,
  upsertSupplierAccountingIdsHandler,
  deleteSupplierAccountingIdHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

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
