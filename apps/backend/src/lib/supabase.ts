/**
 * Supabase Client Configuration
 *
 * Main Supabase client instance for the application.
 * Uses environment variables for credentials.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.js';
import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const missing = requiredEnvVars.find((envVar) => !process.env[envVar]);
if (missing) {
  throw new Error(`Missing required environment variable: ${missing}`);
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Main Supabase client with type safety.
 * Uses service role key to bypass RLS — auth is enforced at the HTTP layer.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
