import { StatusCodes } from 'http-status-codes';
import createError, { HttpError } from '../http-errors';
import { BAD_GATEWAY_ERROR_MESSAGE } from './default-messages';

function createBadGatewayError(
  message: string = BAD_GATEWAY_ERROR_MESSAGE,
): HttpError {
  return createError(StatusCodes.BAD_GATEWAY, message, {
    expose: true,
  });
}

export default createBadGatewayError;
