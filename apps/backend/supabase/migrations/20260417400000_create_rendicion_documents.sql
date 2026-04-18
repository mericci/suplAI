-- Rendicion documents: backup documents uploaded to support a rendición.
CREATE TABLE public.rendicion_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rendicion_id UUID NOT NULL REFERENCES public.rendiciones(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  backing_type TEXT CHECK (backing_type IN ('boleta', 'factura', 'comprobante', 'ticket', 'otro')),
  service_type TEXT,
  amount NUMERIC,
  corrected_amount NUMERIC,
  ai_validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_validation_status IN ('pending', 'valid', 'invalid')),
  ai_validation_notes TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  accounting_id UUID REFERENCES public.accounting_ids(id) ON DELETE SET NULL,
  is_pending_distribution BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX rendicion_documents_rendicion_id
  ON public.rendicion_documents(rendicion_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rendicion_documents_organization_id
  ON public.rendicion_documents(organization_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.rendicion_documents ENABLE ROW LEVEL SECURITY;
