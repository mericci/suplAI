/**
 * HTTP handler: POST /api/suppliers/upsert
 */

import { upsertSupplier } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
  conflictResponse,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { HttpStatus, type RequestContext } from '../../../types/api.ts';
import { supabaseAdmin } from '../../../lib/supabase.ts';
import { upsertOrgSupplier } from '../../invoices/actions/upsert-org-supplier.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { normalizeRut } from '../../../utils/rut.ts';
import { toPublic } from '../types/index.ts';

export async function upsertSupplierHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    // Check for existing supplier before upserting — return 409 so the UI can
    // prompt the user to go to the existing supplier profile instead of overwriting.
    const rawRut = (body as Record<string, unknown>).taxIdentifier;
    if (typeof rawRut === 'string' && rawRut.trim()) {
      const existing = await supplierDb.findByTaxIdentifier(normalizeRut(rawRut));
      if (existing) {
        return conflictResponse('Supplier already exists', toPublic(existing));
      }
    }

    const supplier = await upsertSupplier(body);

    // Link supplier to the requesting user's organization.
    // Look up by email because users.id is gen_random_uuid(), not the Supabase Auth UID.
    // Use admin client to bypass RLS (anon key has no auth.uid() in Edge context).
    const { data: userData } = context.email
      ? await supabaseAdmin()
          .from('users')
          .select('organization_id')
          .eq('email', context.email)
          .is('deleted_at', null)
          .single()
      : { data: null };
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
