/**
 * Settings service routes (Edge Function).
 */

import type { Router } from '../../lib/router.ts';
import { getSettingsHandler, upsertSettingsHandler } from './http/index.ts';
import { requireAuth } from '../../auth/middleware.ts';

export function registerSettingsRoutes(router: Router): void {
  router.get(
    '/api/organizations/:orgId/settings',
    requireAuth(async (req, context) => getSettingsHandler(req, context)),
  );

  router.put(
    '/api/organizations/:orgId/settings',
    requireAuth(async (req, context) => upsertSettingsHandler(req, context)),
  );

  router.get(
    '/api/organizations/:orgId/settings/suppliers/:supplierId',
    requireAuth(async (req, context) => getSettingsHandler(req, context)),
  );

  router.put(
    '/api/organizations/:orgId/settings/suppliers/:supplierId',
    requireAuth(async (req, context) => upsertSettingsHandler(req, context)),
  );
}
