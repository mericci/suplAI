import * as paymentInfoDb from '../../../db/user-payment-info.db.ts';
import { validateCreateUserPaymentInfo } from '../../../db/schemas/user-payment-info.schema.ts';
import type { Database } from '../../../types/supabase.ts';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];

export async function createUserPaymentInfo(
  userId: string,
  data: unknown,
): Promise<UserPaymentInfoRow> {
  const validated = validateCreateUserPaymentInfo(data);
  if (validated.isDefault) await paymentInfoDb.clearDefaultForUser(userId);
  return paymentInfoDb.create({
    user_id: userId,
    bank: validated.bank,
    account_type: validated.accountType,
    account_number: validated.accountNumber,
    is_default: validated.isDefault ?? false,
  });
}
