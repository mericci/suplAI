import * as paymentInfoDb from '../../../db/user-payment-info.db.ts';
import type { Database } from '../../../types/supabase.ts';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];

export async function listUserPaymentInfo(userId: string): Promise<UserPaymentInfoRow[]> {
  return paymentInfoDb.findAllByUser(userId);
}
