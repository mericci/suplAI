/**
 * Test service routes (development).
 * Register test/ping endpoints on the router.
 */

import type { Router } from '../../lib/router';
import { helloWorldHandler, pingHandler } from './http';

export function registerTestRoutes(router: Router): void {
  router.get('/api/test/hello', helloWorldHandler);
  router.get('/api/test/ping', pingHandler);
}
