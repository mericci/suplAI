import { errorReasons } from './constants/index.ts';
import { isError } from './is-error.ts';

export function isProfileNotFoundError(error: unknown): error is Error {
  return (
    isError(error)
    && 'reason' in error
    && error.reason === errorReasons.profileNotFound
  );
}
