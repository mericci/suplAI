/**
 * HTTP handler: POST /api/organizations/:orgId/invoices/:id/comments
 */

import { createInvoiceComment } from '../handlers/index.js';
import * as userDb from '../../../db/user.db.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { RequestContext } from '../../../types/api.js';

export async function createInvoiceCommentHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/comments
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const body = await req.json().catch(() => ({}));
    const { content, type } = body as { content?: string; type?: string };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return validationError('content is required');
    }
    if (type && type !== 'comment' && type !== 'rejection') {
      return validationError('type must be "comment" or "rejection"');
    }

    const user = await userDb.findByEmail(context.email);
    if (!user) return unauthorizedResponse();

    const comment = await createInvoiceComment(
      id,
      orgId,
      user.id,
      content.trim(),
      (type as 'comment' | 'rejection') ?? 'comment',
    );
    return successResponse(comment, 'Comment added');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    return serverError(msg);
  }
}
