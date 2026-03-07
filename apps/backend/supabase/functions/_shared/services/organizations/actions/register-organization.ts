/**
 * Register Organization Action
 *
 * Public registration flow: validates the payload, checks tax identifier
 * uniqueness, optionally creates an auth user via Supabase, creates the
 * organization, and optionally creates the admin user record.
 */

import { z } from 'zod';
import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import * as orgDb from '../../../db/organization.db.ts';
import * as userDb from '../../../db/user.db.ts';
import { encrypt } from '../../../commons/encryption/index.ts';
import * as authService from '../../../auth/service.ts';
import { getSiiSessionTokens } from '../../../commons/integrations/sii/index.ts';
import { parseChileanRut } from '../../sii/helpers/parse-rut.ts';
import { toPublic } from '../types/index.ts';
import type { OrganizationPublic } from '../types/index.ts';

/* ------------------------------------------------------------------ */
/*  Validation schema                                                   */
/* ------------------------------------------------------------------ */

const RegisterOrganizationSchema = z.object({
  organization: z.object({
    legalName: z
      .string()
      .min(2, 'Legal name must be at least 2 characters')
      .max(200, 'Legal name must not exceed 200 characters')
      .trim(),
    taxIdentifier: z
      .string()
      .min(1, 'Tax identifier is required')
      .max(50, 'Tax identifier must not exceed 50 characters')
      .trim(),
    taxAuthorityPassword: z
      .string()
      .min(1, 'Tax authority password is required'),
  }),
  adminUser: z
    .object({
      firstName: z.string().min(1, 'First name is required').trim(),
      lastName: z.string().min(1, 'Last name is required').trim(),
      email: z.string().email('Invalid email format').toLowerCase().trim(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    })
    .optional(),
});

/* ------------------------------------------------------------------ */
/*  Response type                                                       */
/* ------------------------------------------------------------------ */

export interface RegisterOrganizationResult {
  organization: OrganizationPublic;
  user?: { id: string; email: string };
  session?: { access_token: string; refresh_token: string; expires_in: number };
}

/* ------------------------------------------------------------------ */
/*  Action                                                              */
/* ------------------------------------------------------------------ */

export async function registerOrganization(
  data: unknown,
): Promise<RegisterOrganizationResult> {
  try {
    // 1. Validate full request
    const validated = RegisterOrganizationSchema.parse(data);

    logger.info('Registering organization', {
      taxIdentifier: validated.organization.taxIdentifier,
    });

    // 2. Check taxIdentifier uniqueness
    const existing = await orgDb.findByTaxIdentifier(
      validated.organization.taxIdentifier,
    );
    if (existing) {
      throw Object.assign(
        new Error('An organization with this tax identifier already exists'),
        { code: 'CONFLICT' },
      );
    }

    // 3. Validate SII credentials before creating any DB records
    try {
      const { dni, dv } = parseChileanRut(validated.organization.taxIdentifier);
      const siiResult = await getSiiSessionTokens({
        taxPayerDni: dni,
        taxPayerDv: dv,
        password: validated.organization.taxAuthorityPassword,
      });
      // getSiiSessionTokens does NOT throw on bad credentials — it returns undefined siiToken
      if (!siiResult.siiToken) {
        throw Object.assign(
          new Error(
            'Credenciales SII inválidas. Verifica tu RUT y contraseña.',
          ),
          { code: 'VALIDATION_ERROR' },
        );
      }
    } catch (siiError) {
      // Re-throw VALIDATION_ERROR as-is (covers both bad RUT format and failed login)
      if ((siiError as { code?: string }).code === 'VALIDATION_ERROR') throw siiError;
      // Any unexpected network/runtime error → surface as validation error too
      throw Object.assign(
        new Error(
          `Credenciales SII inválidas. Verifica tu RUT y contraseña. (${getErrorMessage(siiError)})`,
        ),
        { code: 'VALIDATION_ERROR' },
      );
    }

    // 4. Sign up admin user in Supabase Auth (before creating org so we
    //    can roll back cleanly if auth fails)
    let authResult: Awaited<ReturnType<typeof authService.signUp>> | undefined;
    if (validated.adminUser) {
      authResult = await authService.signUp({
        email: validated.adminUser.email,
        password: validated.adminUser.password,
      });
    }

    // 5. Create organization with encrypted SII password
    const passwordEnc = await encrypt(validated.organization.taxAuthorityPassword);
    const org = await orgDb.create({
      legal_name: validated.organization.legalName,
      tax_identifier: validated.organization.taxIdentifier,
      tax_authority_username: null,
      tax_authority_password_enc: passwordEnc,
    });

    logger.info('Organization created', { organizationId: org.id });

    // 6. Create the user record linked to the new organization
    if (validated.adminUser && authResult) {
      await userDb.create({
        id: authResult.user.id,  // Store the Supabase Auth UID as the user's id
        organization_id: org.id,
        email: validated.adminUser.email,
        role: 'admin',
        status: 'active',
        first_name: validated.adminUser.firstName,
        last_name: validated.adminUser.lastName,
        name: `${validated.adminUser.firstName} ${validated.adminUser.lastName}`,
        avatar_url: null,
        phone: null,
        metadata: null,
      });

      logger.info('Admin user record created', {
        organizationId: org.id,
        email: validated.adminUser.email,
      });
    }

    return {
      organization: toPublic(org),
      ...(authResult && {
        user: authResult.user,
        session: authResult.session,
      }),
    };
  } catch (error) {
    logger.error('Error registering organization', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
