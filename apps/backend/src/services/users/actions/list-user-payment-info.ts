import { logger } from '../../../utils/logger.js';
import * as paymentInfoDb from '../../../db/user-payment-info.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { Database } from '../../../types/supabase.js';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];

export async function listUserPaymentInfo(userId: string): Promise<UserPaymentInfoRow[]> {
  try {
    logger.info('Listing user payment info', { userId });
    return await paymentInfoDb.findAllByUser(userId);
  } catch (error) {
    logger.error('Error listing user payment info', { error: getErrorMessage(error) });
    throw error;
  }
}
