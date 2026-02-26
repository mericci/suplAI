/**
 * HTTP handler: POST /api/organizations/:orgId/invoices/import
 *
 * Body: { from: string (YYYY-MM), defaultStatus: 'pending' | 'approved' | 'rejected' }
 * Response: { count: number, message: string }
 */

import { importInvoices } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const;
type InvoiceStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as InvoiceStatus);
}

function isValidPeriod(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);
}

export async function importInvoicesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/import
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const body = await req.json() as Record<string, unknown>;
    const { from, defaultStatus } = body;

    if (!isValidPeriod(from)) {
      return validationError('from is required and must be in YYYY-MM format');
    }

    if (!isValidStatus(defaultStatus)) {
      return validationError('defaultStatus must be one of: pending, approved, rejected');
    }

    const count = await importInvoices(orgId, from, defaultStatus);

    return successResponse({
      count,
      message: `Successfully imported ${count} invoice${count === 1 ? '' : 's'}`,
    });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
