import * as paymentInfoDb from '../../../db/user-payment-info.db.ts';

export async function deleteUserPaymentInfo(id: string, userId: string): Promise<void> {
  const existing = await paymentInfoDb.findByIdAndUser(id, userId);
  if (!existing) throw new Error('Payment info not found');
  await paymentInfoDb.softDelete(id);
}
