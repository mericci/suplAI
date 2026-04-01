/**
 * Nomina service routes (Edge Function).
 */

import type { Router } from '../../lib/router.ts';
import {
  listNominasHandler,
  getLockedInvoiceIdsHandler,
  createNominaHandler,
  updateNominaHandler,
  deleteNominaHandler,
  payNominaHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerNominaRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/nominas',
    requireAuth(async (req) => listNominasHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/nominas/locked-invoice-ids',
    requireAuth(async (req) => getLockedInvoiceIdsHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/nominas',
    requireAuth(async (req, context) => createNominaHandler(req, context)),
  );

  router.delete(
    '/api/organizations/:orgId/nominas/:id',
    requireAuth(async (req, context) => deleteNominaHandler(req, context)),
  );

  router.patch(
    '/api/organizations/:orgId/nominas/:id/pay',
    requireAuth(async (req, context) => payNominaHandler(req, context)),
  );

  router.patch(
    '/api/organizations/:orgId/nominas/:id',
    requireAuth(async (req, context) => updateNominaHandler(req, context)),
  );
}
