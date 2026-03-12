/**
 * API Response Utilities
 *
 * Helper functions for creating consistent API responses
 */

import type { ApiResponse } from '../types/api.js';
import { HttpStatus } from '../types/api.js';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = HttpStatus.OK,
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = HttpStatus.BAD_REQUEST,
  details?: Record<string, unknown>,
): Response {
  const body: ApiResponse = {
    success: false,
    error,
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create a validation error response
 */
export function validationError(
  message: string,
  fields?: Record<string, string>,
): Response {
  return errorResponse(message, HttpStatus.UNPROCESSABLE_ENTITY, fields);
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return errorResponse(message, HttpStatus.UNAUTHORIZED);
}

/**
 * Create a not found response
 */
export function notFoundResponse(resource = 'Resource'): Response {
  return errorResponse(`${resource} not found`, HttpStatus.NOT_FOUND);
}

/**
 * Create an internal server error response
 */
export function serverError(message = 'Internal server error'): Response {
  return errorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
}

/**
 * Create a 409 Conflict response, optionally including the conflicting resource data
 */
export function conflictResponse<T>(message: string, data?: T): Response {
  const body = { success: false, error: message, ...(data !== undefined && { data }) };
  return new Response(JSON.stringify(body), {
    status: HttpStatus.CONFLICT,
    headers: { 'Content-Type': 'application/json' },
  });
}
