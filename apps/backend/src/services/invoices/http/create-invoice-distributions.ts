/**
 * HTTP handler: POST /api/organizations/:orgId/invoices/:id/distributions
 */

import { createInvoiceDistributions } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { CreateInvoiceDistributionsPayload } from '../actions/create-invoice-distributions.js';

export async function createInvoiceDistributionsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const invoiceId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!invoiceId || !isValidUUID(invoiceId)) return validationError('Invalid invoice ID');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError('Invalid JSON body');
    }

    const payload = body as CreateInvoiceDistributionsPayload;

    if (
      (!payload.costCenterDistributions || payload.costCenterDistributions.length === 0) &&
      (!payload.accountingIdDistributions || payload.accountingIdDistributions.length === 0)
    ) {
      return validationError('At least one distribution (costCenterDistributions or accountingIdDistributions) is required');
    }

    await createInvoiceDistributions(invoiceId, orgId, payload);
    return successResponse({ created: true });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('must sum to') || msg.includes('not found')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
