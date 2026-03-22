/**
 * HTTP handler: PATCH /api/organizations/:orgId/nominas/:id/pay
 *
 * Admin only. Accepts multipart/form-data with a `file` field.
 * Returns 409 with { error: "amount_mismatch", data: { extracted, expected } } on mismatch.
 */

import { payNomina } from '../handlers/index.js';
import { AmountMismatchError } from '../actions/pay-nomina.js';
import * as userDb from '../../../db/user.db.js';
import {
  successResponse,
  validationError,
  errorResponse,
  notFoundResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import { HttpStatus } from '../../../types/api.js';
import type { RequestContext } from '../../../types/api.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return extMap[ext] ?? 'application/octet-stream';
}

export async function payNominaHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/nominas/:id/pay
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid nomina ID');

    // Admin check
    const user = await userDb.findById(context.userId!);
    if (!user || user.role !== 'admin') {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return validationError('Request must be multipart/form-data');
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return validationError('Missing required field: file');
    }

    if (file.size > MAX_FILE_SIZE) {
      return validationError('File size exceeds 10MB limit');
    }

    const mimeType = getMimeType(file);
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      return validationError(`Unsupported file type: ${mimeType}. Supported: PDF, JPEG, PNG, GIF, WebP`);
    }

    const buffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(buffer);

    const nomina = await payNomina(id, orgId, context.userId!, fileBytes, mimeType, file.name);
    return successResponse(nomina, 'Nomina marked as paid');
  } catch (error) {
    if (error instanceof AmountMismatchError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'amount_mismatch',
          data: { extracted: error.extracted, expected: error.expected },
        }),
        { status: HttpStatus.CONFLICT, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Nomina');
    if (msg.includes('cannot be paid')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
