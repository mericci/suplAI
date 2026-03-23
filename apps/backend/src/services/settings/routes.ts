/**
 * Settings service routes.
 * Admin-only endpoints for managing organization rules.
 */

import type { Router } from '../../lib/router.js';
import { getSettingsHandler, upsertSettingsHandler } from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

export function registerSettingsRoutes(router: Router): void {
  // Global rules (no supplier scope)
  router.get(
    '/api/organizations/:orgId/settings',
    requireAuth(async (req, context) => getSettingsHandler(req, context)),
  );

  router.put(
    '/api/organizations/:orgId/settings',
    requireAuth(async (req, context) => upsertSettingsHandler(req, context)),
  );

  // Supplier-scoped rules
  router.get(
    '/api/organizations/:orgId/settings/suppliers/:supplierId',
    requireAuth(async (req, context) => getSettingsHandler(req, context)),
  );

  router.put(
    '/api/organizations/:orgId/settings/suppliers/:supplierId',
    requireAuth(async (req, context) => upsertSettingsHandler(req, context)),
  );
}
