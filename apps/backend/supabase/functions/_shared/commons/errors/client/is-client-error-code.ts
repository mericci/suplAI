/**
 * Validates if the status code is a valid client error code (4xx)
 */
export function isClientErrorCode(code: number): boolean {
  return code >= 400 && code < 500;
}
