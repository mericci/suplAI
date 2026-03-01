/**
 * HTTP handler: GET /api/suppliers/:id
 */

import { getSupplier } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getSupplierHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id || !isValidUUID(id)) return validationError('Invalid supplier ID format');

    const supplier = await getSupplier({ id });
    return successResponse(supplier);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Supplier');
    return serverError(msg);
  }
}
