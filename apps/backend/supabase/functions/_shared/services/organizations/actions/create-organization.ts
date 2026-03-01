/**
 * Create Organization Action
 *
 * Validates input, encrypts tax authority password if provided, and creates the organization.
 */

import { logger } from '../../../utils/logger.ts';
import * as orgDb from '../../../db/organization.db.ts';
import { validateCreateOrganization } from '../../../db/schemas/index.ts';
import { encrypt } from '../../../commons/encryption/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { OrganizationPublic } from '../types/index.ts';

export async function createOrganization(
  data: unknown,
): Promise<OrganizationPublic> {
  try {
    const validated = validateCreateOrganization(data);

    logger.info('Creating organization', {
      taxIdentifier: validated.taxIdentifier,
    });

    // Uniqueness check (active organizations)
    const existing = await orgDb.findByTaxIdentifier(validated.taxIdentifier);
    if (existing) {
      throw new Error(
        'An organization with this tax identifier already exists',
      );
    }

    const passwordEnc = validated.taxAuthorityPassword
      ? await encrypt(validated.taxAuthorityPassword)
      : null;

    const org = await orgDb.create({
      legal_name: validated.legalName,
      tax_identifier: validated.taxIdentifier,
      tax_authority_username: validated.taxAuthorityUsername ?? null,
      tax_authority_password_enc: passwordEnc,
    });

    logger.info('Organization created', { organizationId: org.id });

    return toPublic(org);
  } catch (error) {
    logger.error('Error creating organization', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
