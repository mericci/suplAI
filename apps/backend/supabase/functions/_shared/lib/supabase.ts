/**
 * Supabase Client Configuration
 *
 * Main Supabase client instance for the application.
 * Uses Deno.env for credentials (Edge Function environment).
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.ts';

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
const missing = requiredEnvVars.find((envVar) => !Deno.env.get(envVar));
if (missing) {
  throw new Error(`Missing required environment variable: ${missing}`);
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

/**
 * Main Supabase client with type safety
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Supabase client with service role (admin privileges)
 * Use with caution - bypasses RLS policies
 * Lazy singleton: created once on first call and reused.
 */
let _adminClient: ReturnType<typeof createClient<Database>> | null = null;
export const supabaseAdmin = (): ReturnType<typeof createClient<Database>> => {
  if (!_adminClient) {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client');
    }
    _adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _adminClient;
};
