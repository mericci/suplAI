/**
 * Update Organization Action
 *
 * Validates partial input, encrypts password if updated, and applies changes.
 */

import { logger } from '../../../utils/logger.ts';
import * as orgDb from '../../../db/organization.db.ts';
import { validateUpdateOrganization } from '../../../db/schemas/index.ts';
import { encrypt } from '../../../commons/encryption/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { OrganizationPublic } from '../types/index.ts';

export async function updateOrganization(
  id: string,
  data: unknown,
): Promise<OrganizationPublic> {
  try {
    const validated = validateUpdateOrganization(data);

    logger.info('Updating organization', { organizationId: id });

    const existing = await orgDb.findById(id);
    if (!existing) {
      throw new Error('Organization not found');
    }

    // If taxIdentifier is changing, check uniqueness
    if (
      validated.taxIdentifier
      && validated.taxIdentifier !== existing.tax_identifier
    ) {
      const conflict = await orgDb.findByTaxIdentifier(validated.taxIdentifier);
      if (conflict) {
        throw new Error(
          'An organization with this tax identifier already exists',
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (validated.legalName !== undefined) updates.legal_name = validated.legalName;
    if (validated.taxIdentifier !== undefined) updates.tax_identifier = validated.taxIdentifier;
    if (validated.taxAuthorityUsername !== undefined) {
      updates.tax_authority_username = validated.taxAuthorityUsername;
    }
    if (validated.taxAuthorityPassword !== undefined) {
      updates.tax_authority_password_enc = validated.taxAuthorityPassword
        ? await encrypt(validated.taxAuthorityPassword)
        : null;
    }

    const org = await orgDb.update(id, updates as never);

    logger.info('Organization updated', { organizationId: id });

    return toPublic(org);
  } catch (error) {
    logger.error('Error updating organization', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
