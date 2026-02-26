/**
 * Invoice service routes.
 * All routes are nested under /api/organizations/:orgId/invoices (multi-tenant scoping).
 */

import type { Router } from '../../lib/router.js';
import {
  upsertInvoiceHandler,
  getInvoiceHandler,
  listInvoicesHandler,
  updateInvoiceHandler,
  approveInvoiceHandler,
  rejectInvoiceHandler,
  payInvoiceHandler,
  deleteInvoiceHandler,
  syncInvoicesHandler,
  importInvoicesHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

export function registerInvoiceRoutes(router: Router): void {
  // Trigger SII sync explicitly (slow — network call to tax authority)
  router.post(
    '/api/organizations/:orgId/invoices/sync',
    requireAuth(async (req) => syncInvoicesHandler(req)),
  );

  // User-initiated import from SII with explicit period and default status
  router.post(
    '/api/organizations/:orgId/invoices/import',
    requireAuth(async (req) => importInvoicesHandler(req)),
  );

  // List invoices for an organization
  router.get(
    '/api/organizations/:orgId/invoices',
    requireAuth(async (req) => listInvoicesHandler(req)),
  );

  // Get a specific invoice
  router.get(
    '/api/organizations/:orgId/invoices/:id',
    requireAuth(async (req) => getInvoiceHandler(req)),
  );

  // Upsert (sync from tax authority) — idempotent
  router.post(
    '/api/organizations/:orgId/invoices/upsert',
    requireAuth(async (req) => upsertInvoiceHandler(req)),
  );

  // Update mutable fields
  router.put(
    '/api/organizations/:orgId/invoices/:id',
    requireAuth(async (req) => updateInvoiceHandler(req)),
  );

  // Approve an invoice (pending → approved)
  router.patch(
    '/api/organizations/:orgId/invoices/:id/approve',
    requireAuth(async (req, context) => approveInvoiceHandler(req, context)),
  );

  // Reject an invoice (pending → rejected)
  router.patch(
    '/api/organizations/:orgId/invoices/:id/reject',
    requireAuth(async (req, context) => rejectInvoiceHandler(req, context)),
  );

  // Mark an invoice as paid (approved → paid)
  router.patch(
    '/api/organizations/:orgId/invoices/:id/pay',
    requireAuth(async (req) => payInvoiceHandler(req)),
  );

  // Soft-delete an invoice
  router.delete(
    '/api/organizations/:orgId/invoices/:id',
    requireAuth(async (req) => deleteInvoiceHandler(req)),
  );
}
