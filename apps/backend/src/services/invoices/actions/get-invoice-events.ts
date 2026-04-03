/**
 * Get Invoice Events Action
 *
 * Returns timeline events for an invoice. Combines stored events
 * with synthetic events derived from existing invoice timestamps.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as eventDb from '../../../db/invoice-event.db.js';
import type { InvoiceEventRow } from '../../../db/invoice-event.db.js';
import { getErrorMessage } from '../../../utils/error.js';

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
  try {
    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    // Stored events (logged from approve/reject/pay/nomina actions)
    const stored = await eventDb.findEventsByInvoiceId(id, organizationId);
    const storedEvents: TimelineEvent[] = stored.map((e: InvoiceEventRow) => ({
      id: e.id,
      eventType: e.event_type,
      actorUserId: e.actor_user_id,
      metadata: e.metadata as Record<string, unknown> | null,
      occurredAt: e.occurred_at,
      synthetic: false,
    }));

    // Synthetic events derived from invoice timestamps (for invoices predating the events table)
    const syntheticEvents: TimelineEvent[] = [];
    const storedTypes = new Set(storedEvents.map((e) => e.eventType));

    if (!storedTypes.has('created')) {
      syntheticEvents.push({
        id: `synthetic-created-${id}`,
        eventType: 'created',
        actorUserId: null,
        metadata: null,
        occurredAt: existing.created_at,
        synthetic: true,
      });
    }

    if (existing.ai_validation_status && !storedTypes.has('ai_validated')) {
      syntheticEvents.push({
        id: `synthetic-ai_validated-${id}`,
        eventType: 'ai_validated',
        actorUserId: null,
        metadata: {
          status: existing.ai_validation_status,
          notes: existing.ai_validation_notes,
        },
        occurredAt: existing.updated_at,
        synthetic: true,
      });
    }

    if (
      existing.approved_at &&
      !storedTypes.has('approved') &&
      !storedTypes.has('rejected')
    ) {
      syntheticEvents.push({
        id: `synthetic-status-${id}`,
        eventType: existing.status === 'rejected' ? 'rejected' : 'approved',
        actorUserId: existing.approved_by_user_id,
        metadata: null,
        occurredAt: existing.approved_at,
        synthetic: true,
      });
    }

    if (existing.paid_at && !storedTypes.has('paid')) {
      syntheticEvents.push({
        id: `synthetic-paid-${id}`,
        eventType: 'paid',
        actorUserId: null,
        metadata: null,
        occurredAt: existing.paid_at,
        synthetic: true,
      });
    }

    // Merge and sort by time
    const allEvents = [...syntheticEvents, ...storedEvents].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    return allEvents;
  } catch (error) {
    logger.error('Error getting invoice events', { error: getErrorMessage(error) });
    throw error;
  }
}
