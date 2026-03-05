/**
 * Supplier service routes.
 */

import type { Router } from '../../lib/router.js';
import {
  upsertSupplierHandler,
  getSupplierHandler,
  updateSupplierHandler,
  deleteSupplierHandler,
  listSuppliersHandler,
  listSuppliersByOrgHandler,
  extractSupplierDocumentHandler,
  createSupplierDocumentHandler,
  listSupplierDocumentsHandler,
  getSupplierDocumentPreviewUrlHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

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
  // Document extraction via AI
  router.post(
    '/api/suppliers/extract-from-document',
    requireAuth(async (req) => extractSupplierDocumentHandler(req)),
  );
  // Supplier documents CRUD
  router.post(
    '/api/suppliers/:supplierId/documents',
    requireAuth(async (req) => createSupplierDocumentHandler(req)),
  );
  router.get(
    '/api/suppliers/:supplierId/documents',
    requireAuth(async (req) => listSupplierDocumentsHandler(req)),
  );
  router.get(
    '/api/suppliers/:supplierId/documents/:docId/preview-url',
    requireAuth(async (req) => getSupplierDocumentPreviewUrlHandler(req)),
  );
}
