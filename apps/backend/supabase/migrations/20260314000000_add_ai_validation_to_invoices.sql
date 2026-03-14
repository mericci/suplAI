ALTER TABLE public.invoices
  ADD COLUMN ai_validation_status TEXT
    CHECK (ai_validation_status IN ('ok', 'error')),
  ADD COLUMN ai_validation_notes TEXT;

CREATE INDEX idx_invoices_ai_validation_status
  ON public.invoices(ai_validation_status)
  WHERE deleted_at IS NULL;
