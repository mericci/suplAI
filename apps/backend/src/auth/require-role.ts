/**
 * Role-based authorization middleware
 *
 * Wraps requireAuth and enforces that the calling user has one of the allowed app-level roles.
 * Roles are stored in the `users` table (not Supabase Auth metadata).
 */

import * as userDb from '../db/user.db.js';
import { requireAuth } from './middleware.js';
import { errorResponse, unauthorizedResponse } from '../utils/response.js';
import { HttpStatus } from '../types/api.js';
import type { RequestContext } from '../types/api.js';

export function requireRole(
  roles: string[],
): (handler: (req: Request, context: RequestContext) => Promise<Response>) => (req: Request) => Promise<Response> {
  return function (handler) {
    return requireAuth(async (req: Request, context: RequestContext) => {
      if (!context.userId) return unauthorizedResponse();

      const user = await userDb.findById(context.userId);
      if (!user) return unauthorizedResponse();

      if (!roles.includes(user.role)) {
        return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
      }

      return handler(req, context);
    });
  };
}
