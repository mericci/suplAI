/**
 * HTTP handler: DELETE /api/suppliers/:id
 */

import { deleteSupplier } from '../handlers/index.ts';
import {
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';

export async function deleteSupplierHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id || !isValidUUID(id)) return validationError('Invalid supplier ID format');

    await deleteSupplier(id);
    return new Response(null, { status: HttpStatus.NO_CONTENT });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Supplier');
    return serverError(msg);
  }
}
