/**
 * HTTP handler: POST /api/suppliers/upsert
 */

import { upsertSupplier } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { HttpStatus, type RequestContext } from '../../../types/api.js';
import { supabaseAdmin } from '../../../lib/supabase.js';
import { upsertOrgSupplier } from '../../invoices/actions/upsert-org-supplier.js';
import { logger } from '../../../utils/logger.js';

export async function upsertSupplierHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const supplier = await upsertSupplier(body);

    // Link supplier to the requesting user's organization.
    // Look up by email because users.id is gen_random_uuid(), not the Supabase Auth UID.
    if (context.email) {
      const { data: userData } = await supabaseAdmin()
        .from('users')
        .select('organization_id')
        .eq('email', context.email)
        .is('deleted_at', null)
        .single();

      if (userData?.organization_id) {
        await upsertOrgSupplier(userData.organization_id, supplier.id);
      } else {
        logger.warn('upsertSupplierHandler: could not find org for user — org-association skipped', {
          email: context.email,
        });
      }
    }

    return successResponse(
      supplier,
      'Supplier upserted successfully',
      HttpStatus.OK,
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (
      msg.toLowerCase().includes('invalid')
      || msg.toLowerCase().includes('required')
    ) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
