/**
 * HTTP handler: POST /api/organizations/:orgId/invoices/upsert
 */

import { upsertInvoice } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function upsertInvoiceHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const invoice = await upsertInvoice(body);

    return successResponse(invoice, 'Invoice upserted successfully');
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
