/**
 * Nomina service routes.
 * All routes are nested under /api/organizations/:orgId/nominas (multi-tenant scoping).
 */

import type { Router } from '../../lib/router.js';
import {
  listNominasHandler,
  getLockedInvoiceIdsHandler,
  createNominaHandler,
  deleteNominaHandler,
  payNominaHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

export function registerNominaRoutes(router: Router): void {
  // List nominas for an organization
  router.get(
    '/api/organizations/:orgId/nominas',
    requireAuth(async (req) => listNominasHandler(req)),
  );

  // Get locked invoice IDs (invoices already in a pending nomina)
  router.get(
    '/api/organizations/:orgId/nominas/locked-invoice-ids',
    requireAuth(async (req) => getLockedInvoiceIdsHandler(req)),
  );

  // Create a new nomina (admin only)
  router.post(
    '/api/organizations/:orgId/nominas',
    requireAuth(async (req, context) => createNominaHandler(req, context)),
  );

  // Delete a nomina (admin only)
  router.delete(
    '/api/organizations/:orgId/nominas/:id',
    requireAuth(async (req, context) => deleteNominaHandler(req, context)),
  );

  // Mark a nomina as paid (admin only, multipart with file)
  router.patch(
    '/api/organizations/:orgId/nominas/:id/pay',
    requireAuth(async (req, context) => payNominaHandler(req, context)),
  );
}
