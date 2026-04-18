import * as paymentInfoDb from '../../../db/user-payment-info.db.ts';
import { validateUpdateUserPaymentInfo } from '../../../db/schemas/user-payment-info.schema.ts';
import type { Database } from '../../../types/supabase.ts';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];

export async function updateUserPaymentInfo(
  id: string,
  userId: string,
  data: unknown,
): Promise<UserPaymentInfoRow> {
  const existing = await paymentInfoDb.findByIdAndUser(id, userId);
  if (!existing) throw new Error('Payment info not found');
  const validated = validateUpdateUserPaymentInfo(data);
  if (validated.isDefault) await paymentInfoDb.clearDefaultForUser(userId);
  return paymentInfoDb.update(id, {
    bank: validated.bank,
    account_type: validated.accountType,
    account_number: validated.accountNumber,
    is_default: validated.isDefault,
  });
}
