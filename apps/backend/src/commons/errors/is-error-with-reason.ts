interface ErrorWithReason {
  reason: string;
}

export function isErrorWithReason(error: unknown): error is ErrorWithReason {
  return (
    typeof error === 'object'
    && error !== null
    && 'reason' in error
    && typeof error.reason === 'string'
  );
}
