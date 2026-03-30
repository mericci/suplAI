/**
 * Router Setup for Edge Function
 *
 * Creates and configures the router with all service routes.
 * Extracted from main.ts so it can be imported by the Edge Function entry point.
 */

import { Router } from './lib/router.ts';
import { registerTestRoutes } from './services/test/routes.ts';
import { registerSiiRoutes } from './services/sii/routes.ts';
import { registerOrganizationRoutes } from './services/organizations/routes.ts';
import { registerUserRoutes } from './services/users/routes.ts';
import { registerSupplierRoutes } from './services/suppliers/routes.ts';
import { registerInvoiceRoutes } from './services/invoices/routes.ts';
import { registerBudgetRoutes } from './services/budget/routes.ts';
import { registerNominaRoutes } from './services/nominas/routes.ts';
import { registerSettingsRoutes } from './services/settings/routes.ts';
import { registerCostCenterRoutes } from './services/cost-centers/routes.ts';
import { registerAccountingIdRoutes } from './services/accounting-ids/routes.ts';
import { registerSupplierCostCenterRoutes } from './services/supplier-cost-centers/routes.ts';
import { registerSupplierAccountingIdRoutes } from './services/supplier-accounting-ids/routes.ts';

export function createRouter(): Router {
  const router = new Router();

  // Health check (app-level, not tied to a service)
  router.get('/api/health', () => Promise.resolve(
    new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  ));

  registerTestRoutes(router);
  registerSiiRoutes(router);
  registerOrganizationRoutes(router);
  registerUserRoutes(router);
  registerSupplierRoutes(router);
  registerInvoiceRoutes(router);
  registerBudgetRoutes(router);
  registerNominaRoutes(router);
  registerSettingsRoutes(router);
  registerCostCenterRoutes(router);
  registerAccountingIdRoutes(router);
  registerSupplierCostCenterRoutes(router);
  registerSupplierAccountingIdRoutes(router);

  return router;
}
