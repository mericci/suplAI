/**
 * Update User Action
 */

import { logger } from '../../../utils/logger.js';
import * as userDb from '../../../db/user.db.js';
import { validateUpdateUser } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { Database, Json } from '../../../types/supabase.js';

type User = Database['public']['Tables']['users']['Row'];

export async function updateUser(
  userId: string,
  updates: unknown,
): Promise<User> {
  try {
    logger.info('Updating user', { userId });

    const validated = validateUpdateUser(updates);

    const existing = await userDb.findById(userId);
    if (!existing) throw new Error('User not found');

    if (validated.email && validated.email !== existing.email) {
      const conflict = await userDb.findByEmail(validated.email);
      if (conflict) throw new Error('Email already in use by another user');
    }

    const dbUpdates: Record<string, unknown> = {};
    if (validated.email !== undefined) dbUpdates.email = validated.email;
    if (validated.firstName !== undefined) dbUpdates.first_name = validated.firstName;
    if (validated.lastName !== undefined) dbUpdates.last_name = validated.lastName;
    if (validated.name !== undefined) dbUpdates.name = validated.name;
    if (validated.avatar_url !== undefined) dbUpdates.avatar_url = validated.avatar_url;
    if (validated.phone !== undefined) dbUpdates.phone = validated.phone;
    if (validated.role !== undefined) dbUpdates.role = validated.role;
    if (validated.status !== undefined) dbUpdates.status = validated.status;
    if (validated.metadata !== undefined) dbUpdates.metadata = validated.metadata as Json;

    const user = await userDb.update(userId, dbUpdates as never);

    logger.info('User updated successfully', { userId });
    return user;
  } catch (error) {
    logger.error('Error updating user', {
      userId,
      error: getErrorMessage(error),
    });
    throw error;
  }
}
