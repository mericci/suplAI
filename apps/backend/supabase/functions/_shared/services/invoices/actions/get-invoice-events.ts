import * as invoiceDb from '../../../db/invoice.db.ts';
import * as eventDb from '../../../db/invoice-event.db.ts';
import type { InvoiceEventRow } from '../../../db/invoice-event.db.ts';

export interface TimelineEvent {
  id: string;
  eventType: string;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  synthetic: boolean;
}

export async function getInvoiceEvents(
  id: string,
  organizationId: string,
): Promise<TimelineEvent[]> {
  const existing = await invoiceDb.findById(id, organizationId);
  if (!existing) throw new Error('Invoice not found');

  const stored = await eventDb.findEventsByInvoiceId(id, organizationId);
  const storedEvents: TimelineEvent[] = stored.map((e: InvoiceEventRow) => ({
    id: e.id,
    eventType: e.event_type,
    actorUserId: e.actor_user_id,
    metadata: e.metadata,
    occurredAt: e.occurred_at,
    synthetic: false,
  }));

  const syntheticEvents: TimelineEvent[] = [];
  const storedTypes = new Set(storedEvents.map((e) => e.eventType));

  if (!storedTypes.has('created')) {
    syntheticEvents.push({
      id: `synthetic-created-${id}`,
      eventType: 'created',
      actorUserId: null,
      metadata: null,
      occurredAt: (existing as any).created_at,
      synthetic: true,
    });
  }

  if ((existing as any).ai_validation_status && !storedTypes.has('ai_validated')) {
    syntheticEvents.push({
      id: `synthetic-ai_validated-${id}`,
      eventType: 'ai_validated',
      actorUserId: null,
      metadata: {
        status: (existing as any).ai_validation_status,
        notes: (existing as any).ai_validation_notes,
      },
      occurredAt: (existing as any).updated_at,
      synthetic: true,
    });
  }

  if (
    (existing as any).approved_at &&
    !storedTypes.has('approved') &&
    !storedTypes.has('rejected')
  ) {
    syntheticEvents.push({
      id: `synthetic-status-${id}`,
      eventType: (existing as any).status === 'rejected' ? 'rejected' : 'approved',
      actorUserId: (existing as any).approved_by_user_id,
      metadata: null,
      occurredAt: (existing as any).approved_at,
      synthetic: true,
    });
  }

  if ((existing as any).paid_at && !storedTypes.has('paid')) {
    syntheticEvents.push({
      id: `synthetic-paid-${id}`,
      eventType: 'paid',
      actorUserId: null,
      metadata: null,
      occurredAt: (existing as any).paid_at,
      synthetic: true,
    });
  }

  return [...syntheticEvents, ...storedEvents].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}
