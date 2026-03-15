/**
 * HTTP handler: GET /api/organizations/:orgId/suppliers/:supplierId/payment-info
 */

import { getSupplierPaymentInfo } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getSupplierPaymentInfoHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/suppliers/:supplierId/payment-info
    const orgId = segments[3];
    const supplierId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID format');
    if (!supplierId || !isValidUUID(supplierId)) return validationError('Invalid supplier ID format');

    const paymentInfo = await getSupplierPaymentInfo(supplierId, orgId);
    return successResponse(paymentInfo);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
