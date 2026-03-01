/**
 * Checks if an HTTP status code is in the successful range
 * @param {number} statusCode The HTTP status code to check
 * @returns {boolean} True if the status code is in the successful range (200-299), false otherwise
 */
export function isSuccessStatusCode(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}
