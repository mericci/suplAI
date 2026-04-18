import { logger } from '../../../utils/logger.js';
import * as paymentInfoDb from '../../../db/user-payment-info.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function deleteUserPaymentInfo(id: string, userId: string): Promise<void> {
  try {
    logger.info('Deleting user payment info', { id, userId });
    const existing = await paymentInfoDb.findByIdAndUser(id, userId);
    if (!existing) throw new Error('Payment info not found');
    await paymentInfoDb.softDelete(id);
  } catch (error) {
    logger.error('Error deleting user payment info', { error: getErrorMessage(error) });
    throw error;
  }
}
