/**
 * HTTP handler: GET /api/suppliers/:supplierId/services?orgId=xxx (Edge Function)
 */

import { listSupplierServices } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function listSupplierServicesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const servicesIdx = segments.lastIndexOf('services');
    const supplierId = segments[servicesIdx - 1];

    if (!supplierId || !isValidUUID(supplierId)) {
      return validationError('Invalid supplier ID format');
    }

    const orgId = url.searchParams.get('orgId');
    if (!orgId || !isValidUUID(orgId)) {
      return validationError('Missing or invalid orgId query parameter');
    }

    const services = await listSupplierServices(supplierId, orgId);
    return successResponse(services);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
