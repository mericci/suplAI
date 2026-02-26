/**
 * Authentication Middleware
 *
 * Middleware for protecting routes and extracting user context
 */

import { supabase } from '../lib/supabase.js';
import { unauthorizedResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { getErrorMessage } from '../utils/error.js';
import type { RequestContext } from '../types/api.js';

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] ?? null;
}

/**
 * Authenticate request and extract user context
 */
export async function authenticate(
  req: Request,
): Promise<RequestContext | null> {
  const token = extractToken(req);

  if (!token) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error ?? !user) {
      logger.warn('Invalid authentication token');
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? undefined,
      role: user.role ?? undefined,
    };
  } catch (error) {
    logger.error('Authentication error', { error: getErrorMessage(error) });
    return null;
  }
}

/**
 * Middleware to require authentication
 * Wraps a handler and ensures user is authenticated
 */
export function requireAuth(
  handler: (req: Request, context: RequestContext) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const context = await authenticate(req);

    if (!context) {
      return unauthorizedResponse();
    }

    return handler(req, context);
  };
}

/**
 * Middleware to optionally authenticate
 * Passes context to handler but doesn't require authentication
 */
export function optionalAuth(
  handler: (req: Request, context: RequestContext | null) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const context = await authenticate(req);
    return handler(req, context);
  };
}
