/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/approve
 *
 * Requires authentication. Role-gated:
 * - admin / super_admin: can approve any invoice
 * - aprobador: can approve only if invoice.service_id → service.cost_center_id ∈ user's cost centers
 * - other roles: 403 Forbidden
 */

import { approveInvoice } from '../handlers/index.js';
import * as userDb from '../../../db/user.db.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as supplierServiceDb from '../../../db/supplier-service.db.js';
import * as costCenterDb from '../../../db/cost-center.db.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { RequestContext } from '../../../types/api.js';
import { HttpStatus } from '../../../types/api.js';

const APPROVE_ROLES = ['admin', 'super_admin', 'aprobador'];

export async function approveInvoiceHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/approve
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const user = await userDb.findByEmail(context.email);
    if (!user) return unauthorizedResponse();

    if (!APPROVE_ROLES.includes(user.role)) {
      return errorResponse('Forbidden: you do not have permission to approve invoices', HttpStatus.FORBIDDEN);
    }

    if (user.role === 'aprobador') {
      const invoiceRow = await invoiceDb.findById(id, orgId);
      if (!invoiceRow) return notFoundResponse('Invoice');

      const serviceId = (invoiceRow as unknown as Record<string, unknown>).service_id as string | null;
      if (!serviceId) {
        return errorResponse(
          'Invoice must be linked to a service before an approver can approve it',
          HttpStatus.FORBIDDEN,
        );
      }

      const service = await supplierServiceDb.findById(serviceId);
      if (!service?.cost_center_id) {
        return errorResponse(
          'Service must be linked to a cost center before an approver can approve it',
          HttpStatus.FORBIDDEN,
        );
      }

      const userCostCenterIds = await costCenterDb.findCostCenterIdsByUser(user.id);
      if (!userCostCenterIds.includes(service.cost_center_id)) {
        return errorResponse(
          'Forbidden: this invoice\'s service is not linked to your cost center',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const invoice = await approveInvoice(id, orgId, user.id);
    return successResponse(invoice, 'Invoice approved');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    if (msg.includes('cannot be approved')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
