import { upsertSupplierAccountingIds } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { UpsertSupplierAccountingIdsPayload } from '../types/index.ts';

const VALID_DISTRIBUTION_TYPES = ['single', 'average', 'percentage', 'manual'];

export async function upsertSupplierAccountingIdsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const supplierId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!supplierId || !isValidUUID(supplierId)) return validationError('Invalid supplier ID');

    let body: unknown;
    try { body = await req.json(); } catch { return validationError('Invalid JSON body'); }

    const payload = body as Partial<UpsertSupplierAccountingIdsPayload>;
    if (!payload.distributionType || !VALID_DISTRIBUTION_TYPES.includes(payload.distributionType)) {
      return validationError(`distributionType must be one of: ${VALID_DISTRIBUTION_TYPES.join(', ')}`);
    }
    if (!Array.isArray(payload.assignments)) return validationError('assignments must be an array');

    const result = await upsertSupplierAccountingIds(supplierId, orgId, payload as UpsertSupplierAccountingIdsPayload);
    return successResponse(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected error';
    if (msg.includes('must sum to 100') || msg.includes('exactly one')) return validationError(msg);
    return serverError(msg);
  }
}
