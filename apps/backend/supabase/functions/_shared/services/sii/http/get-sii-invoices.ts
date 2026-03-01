/**
 * HTTP handler: GET /api/sii/invoices
 * Query: taxPayerDni, taxPayerDv, password, from, to? (to optional)
 */

import { getSiiInvoices } from '../handlers/index.ts';
import {
  successResponse,
  serverError,
  validationError,
} from '../../../utils/response.ts';
import { validateRequiredFields } from '../../../utils/validation.ts';
import { getErrorMessage } from '../../../utils/error.ts';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidPeriod(value: unknown): value is string {
  return typeof value === 'string' && PERIOD_REGEX.test(value);
}

export async function getSiiInvoicesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const taxPayerDni = params.get('taxPayerDni');
    const taxPayerDv = params.get('taxPayerDv');
    const password = params.get('password');
    const from = params.get('from');
    const to = params.get('to');

    const bodyObj = {
      taxPayerDni: taxPayerDni ?? undefined,
      taxPayerDv: taxPayerDv ?? undefined,
      password: password ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
    };

    const validation = validateRequiredFields(bodyObj, [
      'taxPayerDni',
      'taxPayerDv',
      'password',
      'from',
    ]);
    if (!validation.valid) {
      return validationError('Missing required query params', {
        missing: validation.missing.join(', '),
      });
    }

    if (!isValidPeriod(from)) {
      return validationError('from must be a period in YYYY-MM format');
    }

    if (to !== undefined && to !== null && to !== '' && !isValidPeriod(to)) {
      return validationError('to must be a period in YYYY-MM format');
    }

    const result = await getSiiInvoices({
      taxPayerDni: taxPayerDni!,
      taxPayerDv: taxPayerDv!,
      password: password!,
      from: from!,
      to: to && to !== '' ? to : undefined,
    });

    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
