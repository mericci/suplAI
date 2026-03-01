import { StatusCodes } from 'http-status-codes';
import createError, { HttpError } from '../http-errors.ts';
import { GATEWAY_TIMEOUT_ERROR_MESSAGE } from './default-messages.ts';

function createGatewayTimeoutError(
  message: string = GATEWAY_TIMEOUT_ERROR_MESSAGE,
): HttpError {
  return createError(StatusCodes.GATEWAY_TIMEOUT, message, {
    expose: true,
  });
}

export default createGatewayTimeoutError;
