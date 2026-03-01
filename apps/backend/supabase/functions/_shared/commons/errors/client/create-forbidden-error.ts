import { Forbidden, HttpError } from '../http-errors.ts';
import { FORBIDDEN_ERROR_MESSAGE } from './default-messages.ts';

function createForbiddenError(
  message: string = FORBIDDEN_ERROR_MESSAGE,
): HttpError {
  return new Forbidden(message);
}

export default createForbiddenError;
