import { logger } from '../../../utils/logger.js';
import * as rendicionDb from '../../../db/rendicion.db.js';
import * as paymentInfoDb from '../../../db/user-payment-info.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { validateCreateRendicion } from '../../../db/schemas/rendicion.schema.js';
import type { RendicionRow } from '../types/index.js';

export async function createRendicion(
  organizationId: string,
  userId: string,
  data: unknown,
): Promise<RendicionRow> {
  try {
    logger.info('Creating rendicion', { organizationId, userId });
    const validated = validateCreateRendicion(data);

    const paymentInfo = await paymentInfoDb.findByIdAndUser(
      validated.userPaymentInfoId,
      userId,
    );
    if (!paymentInfo) throw new Error('Payment info not found or does not belong to user');

    return await rendicionDb.create({
      organization_id: organizationId,
      created_by_user_id: userId,
      user_payment_info_id: validated.userPaymentInfoId,
      status: 'pending',
      ai_validated: false,
    });
  } catch (error) {
    logger.error('Error creating rendicion', { error: getErrorMessage(error) });
    throw error;
  }
}
