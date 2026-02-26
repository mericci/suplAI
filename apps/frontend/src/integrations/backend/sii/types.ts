export type { Invoice } from '@supl/shared';

export interface GetSiiInvoicesParams {
  taxPayerDni: string;
  taxPayerDv: string;
  password: string;
  from: string;
  to?: string;
}
