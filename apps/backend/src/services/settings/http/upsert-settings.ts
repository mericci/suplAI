/**
 * HTTP handler: PUT /api/organizations/:orgId/settings
 * HTTP handler: PUT /api/organizations/:orgId/settings/suppliers/:supplierId
 */

import { upsertSettings } from '../handlers/index.js';
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
import type { UpsertOrganizationRulePayload } from '@supl/shared';

export async function upsertSettingsHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');

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

    const body = await req.json() as { rules: UpsertOrganizationRulePayload[] };
    if (!Array.isArray(body?.rules)) {
      return validationError('Request body must contain a "rules" array');
    }

    const rules = await upsertSettings(orgId, body.rules, supplierId);
    return successResponse(rules, 'Settings updated');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
