/**
 * HTTP handler: DELETE /api/organizations/:orgId/budget-items/:id
 */

import { deleteBudgetItem } from '../handlers/index.js';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function deleteBudgetItemHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid budget item ID');

    try {
      await deleteBudgetItem(id, orgId);
    } catch (e) {
      if (getErrorMessage(e).includes('not found')) return notFoundResponse('Budget item');
      throw e;
    }

    return successResponse(null, 'Budget item deleted');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
