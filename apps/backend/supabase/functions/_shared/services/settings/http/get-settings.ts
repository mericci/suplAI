/**
 * HTTP handler: GET /api/organizations/:orgId/settings
 * HTTP handler: GET /api/organizations/:orgId/settings/suppliers/:supplierId
 */

import { getSettings } from '../handlers/index.ts';
import * as userDb from '../../../db/user.db.ts';
import {
  successResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function getSettingsHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');

    const settingsIdx = segments.indexOf('settings');
    const orgId = segments[settingsIdx - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const user = await userDb.findById(context.userId!);
    if (!user || user.role !== 'admin') {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

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
