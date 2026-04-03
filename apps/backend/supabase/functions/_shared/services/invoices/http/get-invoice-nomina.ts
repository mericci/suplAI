import { getInvoiceNomina } from '../actions/get-invoice-nomina.ts';
import { successResponse, notFoundResponse, validationError, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getInvoiceNominaHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const nomina = await getInvoiceNomina(id, orgId);
    return successResponse(nomina);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    return serverError(msg);
  }
}
