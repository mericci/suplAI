/**
 * Cost Centers service routes.
 * All routes are nested under /api/organizations/:orgId/cost-centers.
 */

import type { Router } from '../../lib/router.js';
import {
  listCostCentersHandler,
  getCostCenterHandler,
  createCostCenterHandler,
  updateCostCenterHandler,
  deleteCostCenterHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

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
