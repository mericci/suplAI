import { errorReasons } from './constants';
import { isError } from './is-error';

export function isProfileNotFoundError(error: unknown): error is Error {
  return (
    isError(error)
    && 'reason' in error
    && error.reason === errorReasons.profileNotFound
  );
}
