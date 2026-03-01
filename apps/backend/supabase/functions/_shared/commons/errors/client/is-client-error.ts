function isClientError(error: Error): boolean {
  const err = error as Error & { statusCode?: number };
  if (typeof err.statusCode === 'number') {
    return err.statusCode.toString().startsWith('4');
  }
  return false;
}

export default isClientError;
