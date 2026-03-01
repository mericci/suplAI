/**
 * Simple Router for API endpoints
 *
 * Routes HTTP requests to appropriate handlers
 */

import { errorResponse, notFoundResponse } from '../utils/response.ts';
import { logger } from '../utils/logger.ts';
import { getErrorMessage } from '../utils/error.ts';
import { HttpStatus } from '../types/api.ts';

type Handler = (req: Request) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
  pathParams: string[];
}

export class Router {
  private routes: Route[] = [];

  private corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  /**
   * Register a route
   */
  private addRoute(method: string, path: string, handler: Handler): void {
    // Convert path pattern to regex (e.g., /users/:id -> /users/([^/]+))
    const pathParams: string[] = [];
    const pattern = path.replace(/:([^/]+)/g, (_: string, param: string) => {
      pathParams.push(param);
      return '([^/]+)';
    });

    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      handler,
      pathParams,
    });
  }

  /**
   * HTTP method helpers
   */
  get(path: string, handler: Handler): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: Handler): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: Handler): void {
    this.addRoute('PUT', path, handler);
  }

  patch(path: string, handler: Handler): void {
    this.addRoute('PATCH', path, handler);
  }

  delete(path: string, handler: Handler): void {
    this.addRoute('DELETE', path, handler);
  }

  /**
   * Handle incoming requests
   */
  async handle(req: Request): Promise<Response> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: this.corsHeaders,
      });
    }

    const url = new URL(req.url);
    // Supabase prepends the function name as the first path segment when
    // routing to the Edge Function (e.g. /api/health → /api is the fn name).
    // Strip it so registered routes (/health, /api/users/me, …) match correctly.
    const withoutFnName = url.pathname.match(/^\/[^/]+(\/.*)?$/);
    const pathname = withoutFnName ? (withoutFnName[1] ?? '/') : url.pathname;

    logger.info('Incoming request', {
      method: req.method,
      path: pathname,
    });

    // Find matching route
    const route = this.routes.find(
      (r) => r.method === req.method && pathname.match(r.pattern),
    );

    if (route) {
      try {
        const response = await route.handler(req);
        const headers = new Headers(response.headers);
        Object.entries(this.corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        logger.error('Handler error', {
          method: req.method,
          path: pathname,
          error: getErrorMessage(error),
        });

        return this.addCorsHeaders(
          errorResponse(
            'Internal server error',
            HttpStatus.INTERNAL_SERVER_ERROR,
          ),
        );
      }
    }

    // No route matched
    logger.warn('Route not found', { method: req.method, path: pathname });
    return this.addCorsHeaders(notFoundResponse('Route'));
  }

  /**
   * Add CORS headers to a response
   */
  private addCorsHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    Object.entries(this.corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
