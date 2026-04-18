import { logger } from '../../../utils/logger.js';
import * as paymentInfoDb from '../../../db/user-payment-info.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { validateCreateUserPaymentInfo } from '../../../db/schemas/user-payment-info.schema.js';
import type { Database } from '../../../types/supabase.js';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];

export async function createUserPaymentInfo(
  userId: string,
  data: unknown,
): Promise<UserPaymentInfoRow> {
  try {
    logger.info('Creating user payment info', { userId });
    const validated = validateCreateUserPaymentInfo(data);

    if (validated.isDefault) {
      await paymentInfoDb.clearDefaultForUser(userId);
    }

    return await paymentInfoDb.create({
      user_id: userId,
      bank: validated.bank,
      account_type: validated.accountType,
      account_number: validated.accountNumber,
      is_default: validated.isDefault ?? false,
    });
  } catch (error) {
    logger.error('Error creating user payment info', { error: getErrorMessage(error) });
    throw error;
  }
}
