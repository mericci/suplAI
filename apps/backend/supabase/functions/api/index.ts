/**
 * Supabase Edge Function — API Entry Point
 *
 * Replaces the Node.js HTTP server (src/main.ts).
 * All routes are registered via the shared router setup.
 */

import { createRouter } from '../_shared/router-setup.ts';

const router = createRouter();

Deno.serve((req: Request) => router.handle(req));
