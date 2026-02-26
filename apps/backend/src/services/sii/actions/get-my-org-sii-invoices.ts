/**
 * Get SII Invoices for the Authenticated User's Organization
 *
 * Resolves the calling user's org credentials automatically:
 * 1. Look up user by email
 * 2. Find their organization
 * 3. Decrypt stored SII password
 * 4. Parse RUT into dni/dv
 * 5. Fetch invoices from SII
 */

import * as userDb from '../../../db/user.db.js';
import * as orgDb from '../../../db/organization.db.js';
import { decrypt } from '../../../commons/encryption/index.js';
import { parseChileanRut } from '../helpers/parse-rut.js';
import getSiiInvoices from './get-sii-invoices.js';
import type { Invoice } from '../../../types/index.js';

interface GetMyOrgSiiInvoicesParams {
  email: string;
  from: string;
  to?: string;
}

interface GetMyOrgSiiInvoicesResponse {
  invoices: Invoice[];
}

export async function getMyOrgSiiInvoices({
  email,
  from,
  to,
}: GetMyOrgSiiInvoicesParams): Promise<GetMyOrgSiiInvoicesResponse> {
  // 1. Find user by email
  const user = await userDb.findByEmail(email);
  if (!user) {
    throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  }

  // 2. Find their organization
  const org = await orgDb.findById(user.organization_id);
  if (!org) {
    throw Object.assign(new Error('Organization not found'), {
      code: 'NOT_FOUND',
    });
  }

  // 3. Decrypt stored SII password
  if (!org.tax_authority_password_enc) {
    throw Object.assign(
      new Error('Organization has no SII credentials configured'),
      { code: 'CONFIGURATION_ERROR' },
    );
  }
  const password = decrypt(org.tax_authority_password_enc);

  // 4. Parse RUT into dni/dv
  const { dni, dv } = parseChileanRut(org.tax_identifier);

  // 5. Fetch invoices from SII
  return getSiiInvoices({
    taxPayerDni: dni,
    taxPayerDv: dv,
    password,
    from,
    to,
  });
}
