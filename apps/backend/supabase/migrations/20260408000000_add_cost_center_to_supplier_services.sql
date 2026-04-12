-- Add cost_center_id to supplier_services (links a service to its responsible cost center)
ALTER TABLE public.supplier_services
  ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL;
