/**
 * HTTP handler: GET /api/organizations
 */

import { listOrganizations } from '../handlers/index.ts';
import { successResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function listOrganizationsHandler(
  req: Request,
): Promise<Response> {
  try {
    const url = new URL(req.url);

    const filters = {
      search: url.searchParams.get('search') ?? undefined,
      page: url.searchParams.has('page')
        ? Number(url.searchParams.get('page'))
        : undefined,
      limit: url.searchParams.has('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    };

    const result = await listOrganizations(filters);

    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
