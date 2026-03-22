CREATE TYPE public.nomina_status AS ENUM ('pending', 'paid');

CREATE TABLE public.nominas (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_user_id  UUID          NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status              nomina_status NOT NULL DEFAULT 'pending',
  total_amount        BIGINT        NOT NULL,
  invoice_count       INT           NOT NULL,
  voucher_storage_path TEXT,
  voucher_storage_bucket TEXT,
  paid_at             TIMESTAMPTZ,
  paid_by_user_id     UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE TABLE public.nomina_invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomina_id   UUID NOT NULL REFERENCES public.nominas(id) ON DELETE CASCADE,
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nomina_id, invoice_id)
);

CREATE INDEX idx_nominas_org ON public.nominas(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nomina_invoices_nomina ON public.nomina_invoices(nomina_id);
CREATE INDEX idx_nomina_invoices_invoice ON public.nomina_invoices(invoice_id);
