/**
 * Organization service routes.
 * Register all organization-related endpoints on the router.
 */

import type { Router } from '../../lib/router.ts';
import {
  createOrganizationHandler,
  getOrganizationHandler,
  updateOrganizationHandler,
  deleteOrganizationHandler,
  listOrganizationsHandler,
  registerOrganizationHandler,
} from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerOrganizationRoutes(router: Router): void {
  // Public registration — must be declared before /:id to avoid route conflict
  router.post('/api/organizations/register', registerOrganizationHandler);

  router.get('/api/organizations', listOrganizationsHandler);
  router.get('/api/organizations/:id', getOrganizationHandler);
  router.post(
    '/api/organizations',
    requireAuth(async (req) => createOrganizationHandler(req)),
  );
  router.put(
    '/api/organizations/:id',
    requireAuth(async (req) => updateOrganizationHandler(req)),
  );
  router.delete(
    '/api/organizations/:id',
    requireAuth(async (req) => deleteOrganizationHandler(req)),
  );
}
