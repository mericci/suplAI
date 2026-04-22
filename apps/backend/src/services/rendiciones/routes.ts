import type { Router } from '../../lib/router.js';
import {
  listRendicionesHandler,
  createRendicionHandler,
  getRendicionHandler,
  uploadRendicionDocumentHandler,
  approveRendicionHandler,
  rejectRendicionHandler,
  submitRendicionHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

export function registerRendicionRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/rendiciones',
    requireAuth(async (req, ctx) => listRendicionesHandler(req, ctx)),
  );
  router.post(
    '/api/organizations/:orgId/rendiciones',
    requireAuth(async (req, ctx) => createRendicionHandler(req, ctx)),
  );
  router.get(
    '/api/organizations/:orgId/rendiciones/:id',
    requireAuth(async (req) => getRendicionHandler(req)),
  );
  router.post(
    '/api/organizations/:orgId/rendiciones/:id/documents',
    requireAuth(async (req) => uploadRendicionDocumentHandler(req)),
  );
  router.patch(
    '/api/organizations/:orgId/rendiciones/:id/approve',
    requireAuth(async (req, ctx) => approveRendicionHandler(req, ctx)),
  );
  router.patch(
    '/api/organizations/:orgId/rendiciones/:id/reject',
    requireAuth(async (req) => rejectRendicionHandler(req)),
  );
  router.patch(
    '/api/organizations/:orgId/rendiciones/:id/submit',
    requireAuth(async (req) => submitRendicionHandler(req)),
  );
}
