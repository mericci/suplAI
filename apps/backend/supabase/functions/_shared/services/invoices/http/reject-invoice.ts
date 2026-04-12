/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/reject
 *
 * Requires authentication. Role-gated:
 * - admin / super_admin: can reject any invoice
 * - aprobador: can reject only if invoice.service_id → service.cost_center_id ∈ user's cost centers
 * - other roles: 403 Forbidden
 */

import { rejectInvoice } from '../handlers/index.ts';
import * as userDb from '../../../db/user.db.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import * as supplierServiceDb from '../../../db/supplier-service.db.ts';
import * as costCenterDb from '../../../db/cost-center.db.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { RequestContext } from '../../../types/api.ts';
import { HttpStatus } from '../../../types/api.ts';

const APPROVE_ROLES = ['admin', 'super_admin', 'aprobador'];

export async function rejectInvoiceHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/reject
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const user = await userDb.findByEmail(context.email);
    if (!user) return unauthorizedResponse();

    if (!APPROVE_ROLES.includes(user.role)) {
      return errorResponse('Forbidden: you do not have permission to reject invoices', HttpStatus.FORBIDDEN);
    }

    if (user.role === 'aprobador') {
      const invoiceRow = await invoiceDb.findById(id, orgId);
      if (!invoiceRow) return notFoundResponse('Invoice');

      const serviceId = (invoiceRow as unknown as Record<string, unknown>).service_id as string | null;
      if (!serviceId) {
        return errorResponse(
          'Invoice must be linked to a service before an approver can reject it',
          HttpStatus.FORBIDDEN,
        );
      }

      const service = await supplierServiceDb.findById(serviceId);
      if (!service?.cost_center_id) {
        return errorResponse(
          'Service must be linked to a cost center before an approver can reject it',
          HttpStatus.FORBIDDEN,
        );
      }

      const userCostCenterIds = await costCenterDb.findCostCenterIdsByUser(user.id);
      if (!userCostCenterIds.includes(service.cost_center_id)) {
        return errorResponse(
          "Forbidden: this invoice's service is not linked to your cost center",
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const invoice = await rejectInvoice(id, orgId, user.id);
    return successResponse(invoice, 'Invoice rejected');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    if (msg.includes('cannot be rejected')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
