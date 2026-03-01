import type { HttpError } from '../errors/http-errors.ts';
import { createBadRequestError } from '../errors/client/index.ts';
import { createInternalServerError } from '../errors/server/index.ts';

/**
 * Generic error handler function for axios responses
 *
 * @param error The error captured in an axios request, type AxiosError
 * @throws The correspondent error
 */

interface CodeMessage {
  status: number;
  message: string;
}

function axiosErrorHandler({ status, message }: CodeMessage): HttpError {
  if (status.toString()[0] === '4') {
    return createBadRequestError(message);
  }
  return createInternalServerError(message);
}

export default axiosErrorHandler;
