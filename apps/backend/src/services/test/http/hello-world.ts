/**
 * HTTP handler: GET /api/test/hello
 */

import { helloWorld } from '../handlers';
import { successResponse, serverError } from '../../../utils/response';
import { getErrorMessage } from '../../../utils/error';

export async function helloWorldHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') ?? undefined;

    const result = helloWorld(name);

    return Promise.resolve(successResponse(result));
  } catch (error) {
    return Promise.resolve(serverError(getErrorMessage(error)));
  }
}
