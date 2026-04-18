import { logger } from '../../../utils/logger.js';
import * as userDb from '../../../db/user.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { validateUpdateRendicionRut } from '../../../db/schemas/rendicion.schema.js';
import type { Database } from '../../../types/supabase.js';

type User = Database['public']['Tables']['users']['Row'];

export async function updateUserRut(userId: string, data: unknown): Promise<User> {
  try {
    logger.info('Updating user RUT', { userId });
    const { rut } = validateUpdateRendicionRut(data);

    const user = await userDb.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.rut) throw new Error('RUT already set and cannot be changed');

    return await userDb.update(userId, { rut });
  } catch (error) {
    logger.error('Error updating user RUT', { error: getErrorMessage(error) });
    throw error;
  }
}
