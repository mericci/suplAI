import { backendClient, type ApiResponse } from '../client';

export interface TimelineEvent {
  id: string;
  eventType: string;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  synthetic: boolean;
}

export async function getInvoiceEvents(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<TimelineEvent[]>> {
  return backendClient.get<ApiResponse<TimelineEvent[]>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/events`,
  );
}
