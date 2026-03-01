/**
 * Generic HTTP client.
 *
 * Provides a reusable fetch wrapper with error handling, query-param
 * building, and typed responses.  Each integration creates its own
 * instance via `createHttpClient(baseUrl)`.
 */

/* ------------------------------------------------------------------ */
/*  Error                                                              */
/* ------------------------------------------------------------------ */

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>,
): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath = `${base}${normalizedPath}`;
  if (!params || !Object.keys(params).length) return fullPath;
  const qs = new URLSearchParams(params).toString();
  return `${fullPath}?${qs}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new HttpError(
      (body as Record<string, string>).error
        ?? (body as Record<string, string>).message
        ?? `Request failed with status ${response.status}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Client factory                                                     */
/* ------------------------------------------------------------------ */

export interface HttpClient {
  get: <T>(path: string, params?: Record<string, string>) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
  patch: <T>(path: string, body?: unknown) => Promise<T>;
  del: <T>(path: string) => Promise<T>;
}

export interface HttpClientOptions {
  defaultHeaders?: HeadersInit;
  getAuthToken?: () => Promise<string | null>;
}

export function createHttpClient(
  baseUrl: string,
  options: HttpClientOptions = {},
): HttpClient {
  const { defaultHeaders = { 'Content-Type': 'application/json' }, getAuthToken } = options;

  async function buildHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      ...(defaultHeaders as Record<string, string>),
    };
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async function get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const res = await fetch(buildUrl(baseUrl, path, params), {
      method: 'GET',
      headers: await buildHeaders(),
    });
    return handleResponse<T>(res);
  }

  async function post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(buildUrl(baseUrl, path), {
      method: 'POST',
      headers: await buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  }

  async function put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(buildUrl(baseUrl, path), {
      method: 'PUT',
      headers: await buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  }

  async function patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(buildUrl(baseUrl, path), {
      method: 'PATCH',
      headers: await buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  }

  async function del<T>(path: string): Promise<T> {
    const res = await fetch(buildUrl(baseUrl, path), {
      method: 'DELETE',
      headers: await buildHeaders(),
    });
    return handleResponse<T>(res);
  }

  return {
    get, post, put, patch, del,
  };
}
