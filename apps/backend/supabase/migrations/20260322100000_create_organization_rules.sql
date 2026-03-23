-- Organization Rules Table
-- Stores configurable rules per org, optionally per supplier and amount range.
-- Drives invoice validation tolerance, SII notification toggles, mérito actions, and AI auto-approve.

CREATE TABLE organization_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    UUID NOT NULL REFERENCES organizations(id),
  supplier_id               UUID REFERENCES suppliers(id),   -- NULL = global rule
  min_amount                NUMERIC NOT NULL DEFAULT 0,
  max_amount                NUMERIC,                         -- NULL = no upper limit

  -- AI Validation
  ai_tolerance_pct          INTEGER NOT NULL DEFAULT 5,
  ai_max_amount             NUMERIC,                         -- NULL = validate all amounts

  -- Approval/Rejection SII notifications
  notify_sii_on_approve     BOOLEAN NOT NULL DEFAULT false,
  notify_sii_on_reject      BOOLEAN NOT NULL DEFAULT false,

  -- Título Ejecutivo (Mérito) action
  merito_action             TEXT NOT NULL DEFAULT 'nothing',
    -- 'nothing' | 'reject_sii_and_supl' | 'reject_supl_only'
  merito_days_before        INTEGER,                         -- NULL = on the day

  -- Mérito alert (independent of action)
  merito_alert_enabled      BOOLEAN NOT NULL DEFAULT false,
  merito_alert_days_before  INTEGER,
  merito_alert_emails       TEXT[],

  -- Invoices that complete mérito with no manual action
  merito_completed_action   TEXT NOT NULL DEFAULT 'wait_manual',
    -- 'nothing' | 'wait_manual' | 'auto_approve'

  -- AI auto-approve
  ai_approve_action         TEXT NOT NULL DEFAULT 'nothing',
    -- 'nothing' | 'mark_approved'

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX idx_organization_rules_org_id
  ON organization_rules (org_id)
  WHERE deleted_at IS NULL;
