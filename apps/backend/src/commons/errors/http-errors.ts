/**
 * Wrapper for http-errors so the app uses a single default import (CJS/ESM compatible).
 * Import from this file instead of 'http-errors' when using named exports.
 */
import createError from 'http-errors';

type CreateError = typeof createError & {
  HttpError?: new (...args: unknown[]) => {
    statusCode: number;
    message: string;
  };
  Forbidden?: new (msg?: string) => unknown;
  NotFound?: new (msg?: string) => unknown;
  Unauthorized?: new (msg?: string) => unknown;
  BadRequest?: new (msg?: string) => unknown;
  InternalServerError?: new (msg?: string) => unknown;
};

const ce = createError as CreateError;

export default createError;
export const { HttpError } = ce;
export const { Forbidden } = ce;
export const { NotFound } = ce;
export const { Unauthorized } = ce;
export const { BadRequest } = ce;
export const { InternalServerError } = ce;
