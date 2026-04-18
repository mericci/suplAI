import { uploadRendicionDocument } from '../handlers/index.ts';
import { successResponse, validationError, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadRendicionDocumentHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];
    const documentsIdx = segments.lastIndexOf('documents');
    const rendicionId = segments[documentsIdx - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!rendicionId || !isValidUUID(rendicionId)) return validationError('Invalid rendicion ID');

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return validationError('Request must be multipart/form-data');
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) return validationError('Missing required field: file');
    if (file.size > MAX_FILE_SIZE) return validationError('File size exceeds 10MB limit');

    const result = await uploadRendicionDocument(rendicionId, orgId, file);
    return successResponse(result, 'Document uploaded', 201);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found') || msg.includes('Unsupported')) return validationError(msg);
    return serverError(msg);
  }
}
