/**
 * Authentication Service
 *
 * Handles user authentication operations
 */

import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';
import { getErrorMessage } from '../utils/error.js';
import { isValidEmail, isValidPassword } from '../utils/validation.js';

interface SignUpInput {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

interface SignInInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

/**
 * Sign up a new user
 */
export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  try {
    // Validate input
    if (!isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    if (!isValidPassword(input.password)) {
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase, and number',
      );
    }

    logger.info('Signing up new user', { email: input.email });

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: input.metadata ?? {},
      },
    });

    if (error) {
      logger.error('Sign up error', {
        email: input.email,
        error: getErrorMessage(error),
      });
      throw new Error(getErrorMessage(error));
    }

    if (!data.user || !data.session) {
      throw new Error('Sign up failed');
    }

    logger.info('User signed up successfully', { userId: data.user.id });

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
      },
    };
  } catch (error) {
    logger.error('Sign up failed', {
      email: input.email,
      error: getErrorMessage(error),
    });
    throw error;
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(input: SignInInput): Promise<AuthResponse> {
  try {
    logger.info('Signing in user', { email: input.email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      logger.error('Sign in error', {
        email: input.email,
        error: getErrorMessage(error),
      });
      throw new Error('Invalid credentials');
    }

    if (!data.user || !data.session) {
      throw new Error('Sign in failed');
    }

    logger.info('User signed in successfully', { userId: data.user.id });

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
      },
    };
  } catch (error) {
    logger.error('Sign in failed', {
      email: input.email,
      error: getErrorMessage(error),
    });
    throw error;
  }
}

/**
 * Sign out a user
 */
export async function signOut(): Promise<void> {
  try {
    logger.info('Signing out user');

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Sign out error', { error: getErrorMessage(error) });
      throw new Error(getErrorMessage(error));
    }

    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Sign out failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Refresh session
 */
export async function refreshSession(
  refreshToken: string,
): Promise<AuthResponse> {
  try {
    logger.info('Refreshing session');

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      logger.error('Session refresh error', { error: getErrorMessage(error) });
      throw new Error('Failed to refresh session');
    }

    logger.info('Session refreshed successfully', { userId: data.user.id });

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in ?? 3600,
      },
    };
  } catch (error) {
    logger.error('Session refresh failed', { error: getErrorMessage(error) });
    throw error;
  }
}
