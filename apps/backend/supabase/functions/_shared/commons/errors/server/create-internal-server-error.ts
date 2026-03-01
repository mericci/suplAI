import { StatusCodes } from 'http-status-codes';
import createError, { HttpError } from '../http-errors.ts';
import { INTERNAL_SERVER_ERROR_MESSAGE } from './default-messages.ts';

function createInternalServerError(
  message: string = INTERNAL_SERVER_ERROR_MESSAGE,
): HttpError {
  const errorMessage = message && message !== 'Error' ? message : INTERNAL_SERVER_ERROR_MESSAGE;

  return createError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage, {
    expose: true,
  });
}

export default createInternalServerError;
