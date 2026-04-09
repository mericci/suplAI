/**
 * HTTP handler: GET /api/suppliers/:supplierId/services?orgId=xxx
 */

import { listSupplierServices } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function listSupplierServicesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/suppliers/:supplierId/services
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
