import type { NominaWithInvoiceIds } from '@supl/shared';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface PayNominaAmountMismatch {
  extracted: number;
  expected: number;
}

export interface PayNominaResult {
  success: boolean;
  data?: NominaWithInvoiceIds;
  error?: string;
  /** Present when error === 'amount_mismatch' */
  mismatch?: PayNominaAmountMismatch;
}

export async function payNomina(
  orgId: string,
  nominaId: string,
  file: File,
): Promise<PayNominaResult> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${API_BASE_URL}/api/organizations/${orgId}/nominas/${nominaId}/pay`,
    {
      method: 'PATCH',
      headers,
      body: formData,
    },
  );

  const body = await response.json() as {
    success: boolean;
    data?: NominaWithInvoiceIds;
    error?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };

  if (!response.ok) {
    if (response.status === 409 && body.error === 'amount_mismatch') {
      return {
        success: false,
        error: 'amount_mismatch',
        mismatch: body.data as unknown as PayNominaAmountMismatch,
      };
    }
    return { success: false, error: body.error ?? `Request failed with status ${response.status}` };
  }

  return { success: true, data: body.data };
}
