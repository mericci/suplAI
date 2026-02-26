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
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
const missing = requiredEnvVars.find((envVar) => !process.env[envVar]);
if (missing) {
  throw new Error(`Missing required environment variable: ${missing}`);
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

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
 */
export const supabaseAdmin = (): ReturnType<typeof createClient<Database>> => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
