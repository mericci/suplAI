/**
 * Create User Action
 *
 * Business logic for creating a new user within an organization.
 */

import { logger } from '../../../utils/logger.js';
import * as userDb from '../../../db/user.db.js';
import { validateCreateUser } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { Database, Json } from '../../../types/supabase.js';

type User = Database['public']['Tables']['users']['Row'];

export async function createUser(
  organizationId: string,
  userData: unknown,
): Promise<User> {
  try {
    logger.info('Creating new user', { organizationId });

    const validated = validateCreateUser(userData);

    const existingUser = await userDb.findByEmail(validated.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await userDb.create({
      organization_id: organizationId,
      email: validated.email,
      first_name: validated.firstName ?? null,
      last_name: validated.lastName ?? null,
      name: validated.name ?? null,
      avatar_url: validated.avatar_url ?? null,
      phone: validated.phone ?? null,
      role: validated.role,
      status: validated.status,
      metadata: validated.metadata as Json | null | undefined,
    });

    logger.info('User created successfully', {
      userId: user.id,
      organizationId,
    });

    return user;
  } catch (error) {
    logger.error('Error creating user', { error: getErrorMessage(error) });
    throw error;
  }
}
