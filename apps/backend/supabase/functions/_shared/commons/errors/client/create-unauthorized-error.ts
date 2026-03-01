import { HttpError, Unauthorized } from '../http-errors.ts';
import { UNAUTHORIZED_ERROR_MESSAGE } from './default-messages.ts';

function createUnauthorizedError(
  message: string = UNAUTHORIZED_ERROR_MESSAGE,
): HttpError {
  return new Unauthorized(message);
}

export default createUnauthorizedError;
