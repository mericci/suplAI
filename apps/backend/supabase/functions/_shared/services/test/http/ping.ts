/**
 * HTTP handler: GET /api/test/ping
 */

import { successResponse } from '../../../utils/response.ts';

export async function pingHandler(_req: Request): Promise<Response> {
  return Promise.resolve(
    successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );
}
