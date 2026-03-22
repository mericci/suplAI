/**
 * HTTP handler: PUT /api/organizations/:orgId/settings
 * HTTP handler: PUT /api/organizations/:orgId/settings/suppliers/:supplierId
 */

import { upsertSettings } from '../handlers/index.ts';
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

    const user = await userDb.findById(context.userId!);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

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
