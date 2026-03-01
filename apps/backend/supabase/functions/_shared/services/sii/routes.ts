/**
 * SII service routes.
 * Register all SII-related endpoints on the router.
 */

import type { Router } from '../../lib/router.ts';
import { getSiiInvoicesHandler, getMyOrgSiiInvoicesHandler } from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerSiiRoutes(router: Router): void {
  // /me must be registered before the general /invoices route to avoid conflicts
  router.get(
    '/api/sii/invoices/me',
    requireAuth(async (req, ctx) => getMyOrgSiiInvoicesHandler(req, ctx)),
  );
  router.get('/api/sii/invoices', getSiiInvoicesHandler);
}
