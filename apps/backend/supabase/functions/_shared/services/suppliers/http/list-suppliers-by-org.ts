/**
 * HTTP handler: GET /api/organizations/:orgId/suppliers
 */

import { listSuppliersByOrg } from '../handlers/index.ts';
import { validationError, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function listSuppliersByOrgHandler(
  req: Request,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/suppliers
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const filters = {
      search: url.searchParams.get('search') ?? undefined,
      page: url.searchParams.has('page')
        ? Number(url.searchParams.get('page'))
        : undefined,
      limit: url.searchParams.has('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
      sortBy: url.searchParams.get('sortBy') ?? undefined,
      sortDir: (url.searchParams.get('sortDir') ?? undefined) as 'asc' | 'desc' | undefined,
    };

    const result = await listSuppliersByOrg(orgId, filters);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
