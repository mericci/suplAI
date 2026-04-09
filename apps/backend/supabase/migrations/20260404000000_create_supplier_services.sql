-- Create supplier_services table (org-scoped, one entry per service per supplier per org)
CREATE TABLE public.supplier_services (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id         UUID        NOT NULL REFERENCES public.suppliers(id),
  organization_id     UUID        NOT NULL REFERENCES public.organizations(id),
  service_category    TEXT        NOT NULL,
  service_description TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

-- Prevent duplicate active services for the same supplier+org+category
CREATE UNIQUE INDEX supplier_services_unique_active
  ON public.supplier_services(supplier_id, organization_id, service_category)
  WHERE deleted_at IS NULL;

-- Link supplier_documents to a service (nullable for backward compat with existing documents)
ALTER TABLE public.supplier_documents
  ADD COLUMN service_id UUID REFERENCES public.supplier_services(id);
