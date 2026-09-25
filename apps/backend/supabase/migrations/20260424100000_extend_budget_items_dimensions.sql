-- Extend budget_items with accounting_id and cost_center_id dimensions
-- Budgets can now be defined per supplier, per accounting ID, or per cost center (or any combination)

ALTER TABLE public.budget_items
  ADD COLUMN accounting_id UUID REFERENCES public.accounting_ids(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL;

CREATE INDEX idx_budget_items_accounting_id
  ON public.budget_items(accounting_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_budget_items_cost_center_id
  ON public.budget_items(cost_center_id) WHERE deleted_at IS NULL;
