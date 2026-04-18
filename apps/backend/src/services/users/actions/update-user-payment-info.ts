import { logger } from '../../../utils/logger.js';
import * as paymentInfoDb from '../../../db/user-payment-info.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { validateUpdateUserPaymentInfo } from '../../../db/schemas/user-payment-info.schema.js';
import type { Database } from '../../../types/supabase.js';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];

export async function updateUserPaymentInfo(
  id: string,
  userId: string,
  data: unknown,
): Promise<UserPaymentInfoRow> {
  try {
    logger.info('Updating user payment info', { id, userId });
    const existing = await paymentInfoDb.findByIdAndUser(id, userId);
    if (!existing) throw new Error('Payment info not found');

    const validated = validateUpdateUserPaymentInfo(data);

    if (validated.isDefault) {
      await paymentInfoDb.clearDefaultForUser(userId);
    }

    return await paymentInfoDb.update(id, {
      bank: validated.bank,
      account_type: validated.accountType,
      account_number: validated.accountNumber,
      is_default: validated.isDefault,
    });
  } catch (error) {
    logger.error('Error updating user payment info', { error: getErrorMessage(error) });
    throw error;
  }
}
