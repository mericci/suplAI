/**
 * HTTP handler: POST /api/organizations/:orgId/invoices/sync
 */

import { syncInvoices } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function syncInvoicesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/sync
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    await syncInvoices(orgId);
    return successResponse({ message: 'Sync complete' });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
