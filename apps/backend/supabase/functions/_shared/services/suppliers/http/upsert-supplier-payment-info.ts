/**
 * HTTP handler: PUT /api/organizations/:orgId/suppliers/:supplierId/payment-info
 */

import { upsertSupplierPaymentInfo } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function upsertSupplierPaymentInfoHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/suppliers/:supplierId/payment-info
    const orgId = segments[3];
    const supplierId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID format');
    if (!supplierId || !isValidUUID(supplierId)) return validationError('Invalid supplier ID format');

    const body = await req.json();
    const paymentInfo = await upsertSupplierPaymentInfo(supplierId, orgId, body);
    return successResponse(paymentInfo);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('ZodError') || msg.includes('Invalid')) return validationError(msg);
    return serverError(msg);
  }
}
