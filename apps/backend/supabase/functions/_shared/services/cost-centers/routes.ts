/**
 * Cost Centers service routes (Edge Function).
 */

import type { Router } from '../../lib/router.ts';
import {
  listCostCentersHandler,
  getCostCenterHandler,
  createCostCenterHandler,
  updateCostCenterHandler,
  deleteCostCenterHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerCostCenterRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/cost-centers',
    requireAuth(async (req) => listCostCentersHandler(req)),
  );

  router.get(
    '/api/organizations/:orgId/cost-centers/:id',
    requireAuth(async (req) => getCostCenterHandler(req)),
  );

  router.post(
    '/api/organizations/:orgId/cost-centers',
    requireAuth(async (req) => createCostCenterHandler(req)),
  );

  router.put(
    '/api/organizations/:orgId/cost-centers/:id',
    requireAuth(async (req) => updateCostCenterHandler(req)),
  );

  router.delete(
    '/api/organizations/:orgId/cost-centers/:id',
    requireAuth(async (req) => deleteCostCenterHandler(req)),
  );
}
