-- Add service_id to invoices (links an invoice to a specific supplier service)
ALTER TABLE public.invoices
  ADD COLUMN service_id UUID REFERENCES public.supplier_services(id) ON DELETE SET NULL;
