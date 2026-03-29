/**
 * Accounting IDs service routes (Edge Function).
 */

import type { Router } from '../../lib/router.ts';
import {
  listAccountingIdsHandler,
  getAccountingIdHandler,
  createAccountingIdHandler,
  updateAccountingIdHandler,
  deleteAccountingIdHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerAccountingIdRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/accounting-ids',
    requireAuth(async (req) => listAccountingIdsHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/accounting-ids/:id',
    requireAuth(async (req) => getAccountingIdHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/accounting-ids',
    requireAuth(async (req) => createAccountingIdHandler(req)),
  );

  router.put(
    '/api/organizations/:orgId/accounting-ids/:id',
    requireAuth(async (req) => updateAccountingIdHandler(req)),
  );

  router.delete(
    '/api/organizations/:orgId/accounting-ids/:id',
    requireAuth(async (req) => deleteAccountingIdHandler(req)),
  );
}
