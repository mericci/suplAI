/**
 * HTTP handler: GET /api/organizations/:orgId/settings
 * HTTP handler: GET /api/organizations/:orgId/settings/suppliers/:supplierId
 */

import { getSettings } from '../handlers/index.js';
import * as userDb from '../../../db/user.db.js';
import {
  successResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import { HttpStatus } from '../../../types/api.js';
import type { RequestContext } from '../../../types/api.js';

export async function getSettingsHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');

    // /api/organizations/:orgId/settings
    // /api/organizations/:orgId/settings/suppliers/:supplierId
    const settingsIdx = segments.indexOf('settings');
    const orgId = segments[settingsIdx - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    // Admin check
    const user = await userDb.findById(context.userId!);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

    // Optional supplier scoping
    let supplierId: string | undefined;
    const suppliersIdx = segments.indexOf('suppliers');
    if (suppliersIdx !== -1 && segments[suppliersIdx + 1]) {
      supplierId = segments[suppliersIdx + 1];
      if (!isValidUUID(supplierId)) return validationError('Invalid supplier ID');
    }

    const rules = await getSettings(orgId, supplierId);
    return successResponse(rules);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
