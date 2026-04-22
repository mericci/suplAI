import { logger } from '../../../utils/logger.ts';
import * as rendicionDb from '../../../db/rendicion.db.ts';
import * as paymentInfoDb from '../../../db/user-payment-info.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { validateCreateRendicion } from '../../../db/schemas/rendicion.schema.ts';
import type { RendicionRow } from '../types/index.ts';

export async function createRendicion(
  organizationId: string,
  userId: string,
  data: unknown,
): Promise<RendicionRow> {
  try {
    logger.info('Creating rendicion', { organizationId, userId });
    const validated = validateCreateRendicion(data);

    const paymentInfo = await paymentInfoDb.findByIdAndUser(validated.userPaymentInfoId, userId);
    if (!paymentInfo) throw new Error('Payment info not found or does not belong to user');

    return await rendicionDb.create({
      organization_id: organizationId,
      created_by_user_id: userId,
      user_payment_info_id: validated.userPaymentInfoId,
      status: 'draft',
      ai_validated: false,
    });
  } catch (error) {
    logger.error('Error creating rendicion', { error: getErrorMessage(error) });
    throw error;
  }
}
