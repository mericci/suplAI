/**
 * Lookup SII Action
 *
 * Authenticates with SII using the provided RUT and password,
 * then returns the company's legal name (razón social) parsed from
 * the Mi SII home page. Used to auto-populate the registration form.
 */

import { z } from 'zod';
import { getErrorMessage } from '../../../utils/error.js';
import { getSiiSessionTokens } from '../../../commons/integrations/sii/index.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';

/* ------------------------------------------------------------------ */
/*  Validation schema                                                   */
/* ------------------------------------------------------------------ */

const LookupSiiSchema = z.object({
  taxIdentifier: z.string().min(1, 'Tax identifier is required').trim(),
  taxAuthorityPassword: z.string().min(1, 'Tax authority password is required'),
});

/* ------------------------------------------------------------------ */
/*  Response type                                                       */
/* ------------------------------------------------------------------ */

export interface LookupSiiResult {
  legalName: string | null;
}

/* ------------------------------------------------------------------ */
/*  Action                                                              */
/* ------------------------------------------------------------------ */

export async function lookupSii(data: unknown): Promise<LookupSiiResult> {
  const validated = LookupSiiSchema.parse(data);

  try {
    const { dni, dv } = parseChileanRut(validated.taxIdentifier);
    const siiResult = await getSiiSessionTokens({
      taxPayerDni: dni,
      taxPayerDv: dv,
      password: validated.taxAuthorityPassword,
    });

    if (!siiResult.siiToken) {
      throw Object.assign(
        new Error('Credenciales SII inválidas. Verifica tu RUT y contraseña.'),
        { code: 'VALIDATION_ERROR' },
      );
    }

    return { legalName: siiResult.legalName };
  } catch (error) {
    if ((error as { code?: string }).code === 'VALIDATION_ERROR') throw error;
    throw Object.assign(
      new Error(
        `Credenciales SII inválidas. Verifica tu RUT y contraseña. (${getErrorMessage(error)})`,
      ),
      { code: 'VALIDATION_ERROR' },
    );
  }
}
