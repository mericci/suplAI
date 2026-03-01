import { HttpError, NotFound } from '../http-errors.ts';
import { NOT_FOUND_ERROR_MESSAGE } from './default-messages.ts';

function createNotFoundError(
  message: string = NOT_FOUND_ERROR_MESSAGE,
): HttpError {
  return new NotFound(message);
}

export default createNotFoundError;
