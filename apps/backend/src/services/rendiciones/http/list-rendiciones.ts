import { listRendiciones } from '../handlers/index.js';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import * as userDb from '../../../db/user.db.js';
import type { RequestContext } from '../../../types/api.js';

const PAGE_SIZE = 20;

export async function listRendicionesHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!context.email) return serverError('User email not available');

    const user = await userDb.findByEmail(context.email);
    if (!user) return notFoundResponse('User');

    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE), 10));
    const status = url.searchParams.get('status') ?? undefined;
    const viewAll = url.searchParams.get('viewAll') === 'true';
    const role = context.role as string | undefined;
    const canViewAll = viewAll && (role === 'admin' || role === 'super_admin' || role === 'aprobador');

    const result = await listRendiciones({
      organizationId: orgId,
      userId: user.id,
      viewAll: canViewAll,
      status,
      limit,
      offset: (page - 1) * limit,
    });

    return successResponse({
      rendiciones: result.rendiciones,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
