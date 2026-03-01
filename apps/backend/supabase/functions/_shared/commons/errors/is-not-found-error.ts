import { isError } from './is-error.ts';

export function isNotFoundError(error: unknown): error is Error {
  return isError(error) && error.name.includes('NotFoundError');
}
