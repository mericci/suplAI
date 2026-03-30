/**
 * HTTP handler: POST /api/organizations/:orgId/suppliers/:supplierId/cost-centers
 */

import { upsertSupplierCostCenters } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { UpsertSupplierCostCentersPayload } from '../types/index.js';

const VALID_DISTRIBUTION_TYPES = ['single', 'average', 'percentage', 'manual'];

export async function upsertSupplierCostCentersHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const supplierId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!supplierId || !isValidUUID(supplierId)) return validationError('Invalid supplier ID');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError('Invalid JSON body');
    }

    const payload = body as Partial<UpsertSupplierCostCentersPayload>;

    if (!payload.distributionType || !VALID_DISTRIBUTION_TYPES.includes(payload.distributionType)) {
      return validationError(`distributionType must be one of: ${VALID_DISTRIBUTION_TYPES.join(', ')}`);
    }

    if (!Array.isArray(payload.assignments)) {
      return validationError('assignments must be an array');
    }

    for (const a of payload.assignments) {
      if (!a.costCenterId || !isValidUUID(a.costCenterId)) {
        return validationError('Each assignment must have a valid costCenterId (UUID)');
      }
      if (payload.distributionType === 'percentage' && typeof a.percentage !== 'number') {
        return validationError('Each assignment must have a numeric percentage when distributionType is "percentage"');
      }
    }

    const result = await upsertSupplierCostCenters(supplierId, orgId, payload as UpsertSupplierCostCentersPayload);
    return successResponse(result);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('must sum to 100') || msg.includes('exactly one')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
