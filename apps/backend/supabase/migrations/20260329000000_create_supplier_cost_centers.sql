-- Supplier Cost Centers: links a supplier to one or more cost centers for an org,
-- with a configurable distribution strategy for invoice amount splitting.

CREATE TABLE public.supplier_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id),
  -- distribution_type: how invoice amounts are distributed across linked cost centers.
  -- 'single'     → the only cost center; all invoice amount goes here (auto-assigned).
  -- 'average'    → split evenly across all cost centers (integer, sum = invoice amount).
  -- 'percentage' → split by the given percentage column; all rows must sum to 100.
  -- 'manual'     → user assigns amounts manually via /accounting pending-distributions tab.
  distribution_type TEXT NOT NULL DEFAULT 'single',
  -- percentage: only populated when distribution_type = 'percentage' (0-100, 2 decimal places)
  percentage NUMERIC(5,2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Prevent duplicate active links between same supplier, org, and cost center
CREATE UNIQUE INDEX supplier_cost_centers_unique_active
  ON public.supplier_cost_centers(supplier_id, organization_id, cost_center_id)
  WHERE deleted_at IS NULL;

-- Supplier Accounting IDs: same structure, linking suppliers to accounting IDs

CREATE TABLE public.supplier_accounting_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  accounting_id UUID NOT NULL REFERENCES public.accounting_ids(id),
  distribution_type TEXT NOT NULL DEFAULT 'single',
  percentage NUMERIC(5,2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX supplier_accounting_ids_unique_active
  ON public.supplier_accounting_ids(supplier_id, organization_id, accounting_id)
  WHERE deleted_at IS NULL;
