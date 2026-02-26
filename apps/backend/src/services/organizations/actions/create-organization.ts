/**
 * Create Organization Action
 *
 * Validates input, encrypts tax authority password if provided, and creates the organization.
 */

import { logger } from '../../../utils/logger.js';
import * as orgDb from '../../../db/organization.db.js';
import { validateCreateOrganization } from '../../../db/schemas/index.js';
import { encrypt } from '../../../commons/encryption/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { OrganizationPublic } from '../types/index.js';

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
      ? encrypt(validated.taxAuthorityPassword)
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
