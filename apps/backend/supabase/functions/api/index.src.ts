/**
 * Supabase Edge Function entry point — `api`
 *
 * This file is the SOURCE template. It is NOT deployed directly.
 * Run `npm run build:edge` from apps/backend to regenerate index.ts (the bundled output).
 */

import { Router } from '../../../src/lib/router.js';
import { registerTestRoutes } from '../../../src/services/test/routes.js';
import { registerSiiRoutes } from '../../../src/services/sii/routes.js';
import { registerOrganizationRoutes } from '../../../src/services/organizations/routes.js';
import { registerUserRoutes } from '../../../src/services/users/routes.js';
import { registerSupplierRoutes } from '../../../src/services/suppliers/routes.js';
import { registerInvoiceRoutes } from '../../../src/services/invoices/routes.js';

const router = new Router();

router.get('/health', () =>
  Promise.resolve(
    new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ),
);

registerTestRoutes(router);
registerSiiRoutes(router);
registerOrganizationRoutes(router);
registerUserRoutes(router);
registerSupplierRoutes(router);
registerInvoiceRoutes(router);

Deno.serve((req: Request) => router.handle(req));
