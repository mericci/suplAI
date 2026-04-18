/**
 * User service routes.
 * All routes are nested under /api/organizations/:orgId/users (multi-tenant scoping).
 */

import type { Router } from '../../lib/router.js';
import {
  listUsersHandler,
  getUserHandler,
  getMeHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listUserPaymentInfoHandler,
  createUserPaymentInfoHandler,
  updateUserPaymentInfoHandler,
  deleteUserPaymentInfoHandler,
  updateUserRutHandler,
} from './http/index.js';
import { requireAuth } from '../../auth/middleware.js';

export function registerUserRoutes(router: Router): void {
  // Must be registered before :id routes to avoid conflict
  router.get(
    '/api/users/me',
    requireAuth(async (req, ctx) => getMeHandler(req, ctx)),
  );
  router.get(
    '/api/users/me/payment-info',
    requireAuth(async (req, ctx) => listUserPaymentInfoHandler(req, ctx)),
  );
  router.post(
    '/api/users/me/payment-info',
    requireAuth(async (req, ctx) => createUserPaymentInfoHandler(req, ctx)),
  );
  router.put(
    '/api/users/me/payment-info/:infoId',
    requireAuth(async (req, ctx) => updateUserPaymentInfoHandler(req, ctx)),
  );
  router.delete(
    '/api/users/me/payment-info/:infoId',
    requireAuth(async (req, ctx) => deleteUserPaymentInfoHandler(req, ctx)),
  );
  router.patch(
    '/api/users/me/rut',
    requireAuth(async (req, ctx) => updateUserRutHandler(req, ctx)),
  );
  router.get(
    '/api/organizations/:orgId/users',
    requireAuth(async (req) => listUsersHandler(req)),
  );
  router.get(
    '/api/organizations/:orgId/users/:id',
    requireAuth(async (req) => getUserHandler(req)),
  );
  router.post(
    '/api/organizations/:orgId/users',
    requireAuth(async (req) => createUserHandler(req)),
  );
  router.put(
    '/api/organizations/:orgId/users/:id',
    requireAuth(async (req) => updateUserHandler(req)),
  );
  router.delete(
    '/api/organizations/:orgId/users/:id',
    requireAuth(async (req) => deleteUserHandler(req)),
  );
}
