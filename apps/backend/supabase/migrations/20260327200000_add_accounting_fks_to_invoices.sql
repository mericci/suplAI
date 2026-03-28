-- Add cost_center_id and accounting_id FK columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  ADD COLUMN accounting_id UUID REFERENCES public.accounting_ids(id) ON DELETE SET NULL;

CREATE INDEX idx_invoices_cost_center ON public.invoices(cost_center_id)
  WHERE cost_center_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_invoices_accounting_id ON public.invoices(accounting_id)
  WHERE accounting_id IS NOT NULL AND deleted_at IS NULL;
