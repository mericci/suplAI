/**
 * Invoice service routes.
 * All routes are nested under /api/organizations/:orgId/invoices (multi-tenant scoping).
 */

import type { Router } from '../../lib/router.ts';
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
  validateInvoiceHandler,
  listPendingDistributionsHandler,
  createInvoiceDistributionsHandler,
  getInvoiceDistributionsHandler,
  getInvoiceNominaHandler,
  getInvoiceCommentsHandler,
  createInvoiceCommentHandler,
  getInvoiceEventsHandler,
  getInvoiceDocumentsHandler,
  uploadInvoiceDocumentHandler,
  fetchInvoiceDteXmlHttpHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

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

  // List invoices pending manual distribution (must be before /:id)
  router.get(
    '/api/organizations/:orgId/invoices/pending-distributions',
    requireAuth(async (req) => listPendingDistributionsHandler(req)),
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

  // Validate an invoice with AI
  router.patch(
    '/api/organizations/:orgId/invoices/:id/validate',
    requireAuth(async (req) => validateInvoiceHandler(req)),
  );

  // Soft-delete an invoice
  router.delete(
    '/api/organizations/:orgId/invoices/:id',
    requireAuth(async (req) => deleteInvoiceHandler(req)),
  );

  // Submit manual distribution records for an invoice
  router.post(
    '/api/organizations/:orgId/invoices/:id/distributions',
    requireAuth(async (req) => createInvoiceDistributionsHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/invoices/:id/distributions',
    requireAuth(async (req) => getInvoiceDistributionsHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/invoices/:id/nomina',
    requireAuth(async (req) => getInvoiceNominaHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/invoices/:id/comments',
    requireAuth(async (req) => getInvoiceCommentsHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/invoices/:id/comments',
    requireAuth(async (req, context) => createInvoiceCommentHandler(req, context)),
  );

  router.get(
    '/api/organizations/:orgId/invoices/:id/events',
    requireAuth(async (req) => getInvoiceEventsHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/invoices/:id/documents',
    requireAuth(async (req) => getInvoiceDocumentsHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/invoices/:id/documents',
    requireAuth(async (req, context) => uploadInvoiceDocumentHandler(req, context)),
  );

  // Fetch DTE XML on demand from SII
  router.patch(
    '/api/organizations/:orgId/invoices/:id/fetch-dte-xml',
    requireAuth(async (req) => fetchInvoiceDteXmlHttpHandler(req)),
  );
}
