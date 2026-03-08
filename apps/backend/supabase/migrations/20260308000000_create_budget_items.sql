-- Create budget_items table
-- Stores budget line items for organizations, optionally linked to a supplier

CREATE TABLE public.budget_items (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  amount           NUMERIC     NOT NULL CHECK (amount >= 0),
  currency         TEXT        NOT NULL DEFAULT 'CLP',
  periodicity      TEXT        NOT NULL DEFAULT 'monthly' CHECK (periodicity IN ('monthly', 'quarterly', 'annual')),
  supplier_id      UUID        REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX idx_budget_items_org_id     ON public.budget_items(organization_id);
CREATE INDEX idx_budget_items_org_active ON public.budget_items(organization_id) WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER handle_updated_at_budget_items
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
