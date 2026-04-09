/**
 * HTTP handler: POST /api/suppliers/:supplierId/services
 */

import { createSupplierService } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function createSupplierServiceHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/suppliers/:supplierId/services
    const servicesIdx = segments.lastIndexOf('services');
    const supplierId = segments[servicesIdx - 1];

    if (!supplierId || !isValidUUID(supplierId)) {
      return validationError('Invalid supplier ID format');
    }

    const body = await req.json() as Record<string, unknown>;
    const service = await createSupplierService({ ...body, supplierId });
    return successResponse(service, 'Service created', 201);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('Invalid') || msg.includes('required')) return validationError(msg);
    return serverError(msg);
  }
}
