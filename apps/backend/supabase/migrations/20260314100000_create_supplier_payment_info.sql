CREATE TABLE public.supplier_payment_info (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id      UUID        NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_holder_name TEXT     NOT NULL,
  tax_identifier   TEXT        NOT NULL,
  bank             TEXT        NOT NULL,
  account_type     TEXT        NOT NULL,
  account_number   TEXT        NOT NULL,
  currency         TEXT        NOT NULL DEFAULT 'CLP',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE (supplier_id, organization_id)
);

CREATE INDEX idx_supplier_payment_info_supplier ON public.supplier_payment_info(supplier_id);
CREATE INDEX idx_supplier_payment_info_org ON public.supplier_payment_info(organization_id);
