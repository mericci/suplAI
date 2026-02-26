/**
 * HTTP handler: GET /api/suppliers
 */

import { listSuppliers } from '../handlers/index.js';
import { successResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function listSuppliersHandler(req: Request): Promise<Response> {
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

    const result = await listSuppliers(filters);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
