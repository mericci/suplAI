/**
 * HTTP handler: POST /api/suppliers/upsert
 */

import { upsertSupplier } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { HttpStatus, type RequestContext } from '../../../types/api.ts';
import { supabaseAdmin } from '../../../lib/supabase.ts';
import { upsertOrgSupplier } from '../../invoices/actions/upsert-org-supplier.ts';

export async function upsertSupplierHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const supplier = await upsertSupplier(body);

    // Link supplier to the requesting user's organization
    // Use admin client to bypass RLS (anon key has no auth.uid() in Edge context)
    const { data: userData } = await supabaseAdmin()
      .from('users')
      .select('organization_id')
      .eq('id', context.userId)
      .is('deleted_at', null)
      .single();
    if (userData?.organization_id) {
      await upsertOrgSupplier(userData.organization_id, supplier.id);
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
