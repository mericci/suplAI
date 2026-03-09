/**
 * Budget service routes.
 * All routes are nested under /api/organizations/:orgId/budget-items.
 */

import type { Router } from '../../lib/router.ts';
import {
  listBudgetItemsHandler,
  createBudgetItemHandler,
  deleteBudgetItemHandler,
  getBudgetMetricsHandler,
  getInvoiceBudgetStatusesHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerBudgetRoutes(router: Router): void {
  // Static sub-paths must be registered before /:id to avoid being matched as an ID
  router.get(
    '/api/organizations/:orgId/budget-items/metrics',
    requireAuth(async (req) => getBudgetMetricsHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/budget-items/invoice-statuses',
    requireAuth(async (req) => getInvoiceBudgetStatusesHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/budget-items',
    requireAuth(async (req) => listBudgetItemsHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/budget-items',
    requireAuth(async (req) => createBudgetItemHandler(req)),
  );

  router.delete(
    '/api/organizations/:orgId/budget-items/:id',
    requireAuth(async (req) => deleteBudgetItemHandler(req)),
  );
}
