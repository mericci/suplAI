import * as userDb from '../../../db/user.db.ts';
import { validateUpdateRendicionRut } from '../../../db/schemas/rendicion.schema.ts';

export async function updateUserRut(email: string, data: unknown): Promise<unknown> {
  const { rut } = validateUpdateRendicionRut(data);

  const user = await userDb.findByEmail(email);
  if (!user) throw new Error('User not found');
  if (user.rut) throw new Error('RUT already set and cannot be changed');

  return userDb.update(user.id, { rut });
}
