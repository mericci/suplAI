/**
 * HTTP handler: POST /api/suppliers/upsert
 */

import { upsertSupplier } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { HttpStatus } from '../../../types/api.js';

export async function upsertSupplierHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const supplier = await upsertSupplier(body);

    return successResponse(
      supplier,
      'Supplier upserted successfully',
      HttpStatus.OK,
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (
      msg.toLowerCase().includes('invalid')
      || msg.toLowerCase().includes('required')
    ) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
