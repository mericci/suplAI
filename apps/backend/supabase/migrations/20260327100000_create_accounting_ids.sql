-- accounting_ids table
CREATE TABLE public.accounting_ids (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id      TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_accounting_ids_org_external_id_active
  ON public.accounting_ids(organization_id, external_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_accounting_ids_org_active
  ON public.accounting_ids(organization_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER handle_updated_at_accounting_ids
  BEFORE UPDATE ON public.accounting_ids
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
