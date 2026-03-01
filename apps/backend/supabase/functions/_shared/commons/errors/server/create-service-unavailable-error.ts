import { StatusCodes } from 'http-status-codes';
import createError, { HttpError } from '../http-errors.ts';
import { SERVICE_UNAVAILABLE_ERROR_MESSAGE } from './default-messages.ts';

function createServiceUnavailableTimeoutError(
  message: string = SERVICE_UNAVAILABLE_ERROR_MESSAGE,
): HttpError {
  return createError(StatusCodes.SERVICE_UNAVAILABLE, message, {
    expose: true,
  });
}

export default createServiceUnavailableTimeoutError;
