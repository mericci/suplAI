import createError, { HttpError } from '../http-errors.ts';
import { ErrorReason } from '../types/index.ts';
import { isClientErrorCode } from './is-client-error-code.ts';
import { errorReasons } from '../constants/index.ts';
import { BAD_REQUEST_ERROR_MESSAGE } from './default-messages.ts';

interface ClientError {
  statusCode: number;
  reason: ErrorReason;
  message?: string;
}

type ClientErrorOrMessage = string | ClientError;

interface CreateClientErrorParams {
  statusCode: number;
  errorOrMessage: ClientErrorOrMessage;
}

/**
 * Creates an HTTP error with client error status code (4xx)
 * @throws {Error} If status code is not a valid client error code
 */
export function createClientError({
  statusCode,
  errorOrMessage,
}: CreateClientErrorParams): HttpError {
  if (!isClientErrorCode(statusCode)) {
    throw new Error(
      `Invalid client error status code: ${statusCode}. Must be between 400 and 499`,
    );
  }

  const body = typeof errorOrMessage === 'string'
    ? { reason: errorReasons.unknown, message: errorOrMessage }
    : {
      ...errorOrMessage,
      message: errorOrMessage.message || BAD_REQUEST_ERROR_MESSAGE,
    };

  return createError(statusCode, body);
}
