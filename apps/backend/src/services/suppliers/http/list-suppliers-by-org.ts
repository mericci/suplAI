/**
 * HTTP handler: GET /api/organizations/:orgId/suppliers
 */

import { listSuppliersByOrg } from '../handlers/index.js';
import { validationError, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

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
