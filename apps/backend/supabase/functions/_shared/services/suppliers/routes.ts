/**
 * Supplier service routes.
 */

import type { Router } from '../../lib/router.ts';
import {
  upsertSupplierHandler,
  getSupplierHandler,
  updateSupplierHandler,
  deleteSupplierHandler,
  listSuppliersHandler,
  listSuppliersByOrgHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerSupplierRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/suppliers',
    requireAuth(async (req) => listSuppliersByOrgHandler(req)),
  );
  router.get('/api/suppliers', listSuppliersHandler);
  router.get('/api/suppliers/:id', getSupplierHandler);
  // POST /api/suppliers/upsert — find-or-create by taxIdentifier
  router.post(
    '/api/suppliers/upsert',
    requireAuth(async (req) => upsertSupplierHandler(req)),
  );
  router.put(
    '/api/suppliers/:id',
    requireAuth(async (req) => updateSupplierHandler(req)),
  );
  router.delete(
    '/api/suppliers/:id',
    requireAuth(async (req) => deleteSupplierHandler(req)),
  );
}
