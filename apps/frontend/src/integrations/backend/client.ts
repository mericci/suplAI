/**
 * Backend HTTP client instance.
 *
 * Configured with the backend base URL.  Service modules (users, sii, …)
 * import `backendClient` and call its methods directly.
 */

import { createHttpClient } from '@/lib/http';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export const backendClient = createHttpClient(API_BASE_URL, { getAuthToken });

/* ------------------------------------------------------------------ */
/*  Backend-specific response types (re-exported from @supl/shared)   */
/* ------------------------------------------------------------------ */

export type { ApiResponse, PaginatedResponse } from '@supl/shared';
