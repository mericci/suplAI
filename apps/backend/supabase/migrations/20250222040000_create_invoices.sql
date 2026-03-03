-- Create invoice status enum, then the invoices table.
-- Invoices belong to an Organization and are issued by a global Supplier.
-- document_type is stored as TEXT (the SII human-readable description, e.g. "Factura Electronica").
-- document_type_number is the SII numeric code (e.g. 33).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id                      UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID                     NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  supplier_id             UUID                     NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,

  -- SHA-256 hex hash of: receiver_tax_identifier:issuer_tax_identifier:document_type:document_number
  -- All components lowercased and trimmed before hashing.
  -- Used for idempotent upserts when syncing from the external tax authority system.
  external_unique_key     TEXT                     NOT NULL,

  issuer_tax_identifier   TEXT                     NOT NULL,
  receiver_tax_identifier TEXT                     NOT NULL,
  document_type           TEXT                     NOT NULL,
  document_type_number    INTEGER                  NOT NULL,
  document_number         TEXT                     NOT NULL,
  issue_date              DATE                     NOT NULL,
  due_date                DATE,

  -- Computed column: issue_date + 8 calendar days.
  -- Represents the legal executive title date. Never set manually.
  executive_title_date    DATE GENERATED ALWAYS AS (issue_date + INTERVAL '8 days') STORED,

  status                  public.invoice_status    NOT NULL DEFAULT 'pending',
  approved_by_user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at             TIMESTAMPTZ,

  created_at              TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- Unique active invoices by external key (prevents duplicate syncs).
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_external_unique_key_active
  ON public.invoices (external_unique_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_external_unique_key
  ON public.invoices (external_unique_key);

-- Multi-tenant query performance: filter by org + soft delete.
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id
  ON public.invoices (organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id
  ON public.invoices (supplier_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON public.invoices (status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_issue_date
  ON public.invoices (issue_date);

CREATE TRIGGER handle_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

COMMENT ON TABLE public.invoices
  IS 'Invoices received from external tax authority system. '
     'Belong to one Organization, issued by a global Supplier. '
     'Synced via upsert keyed on external_unique_key.';

COMMENT ON COLUMN public.invoices.external_unique_key
  IS 'SHA-256 hex hash of: receiver_tax_identifier:issuer_tax_identifier:document_type:document_number. '
     'All components lowercased+trimmed before hashing. Used for idempotent upserts.';

COMMENT ON COLUMN public.invoices.executive_title_date
  IS 'Auto-computed: issue_date + 8 calendar days. Legal executive title date.';

COMMENT ON COLUMN public.invoices.approved_by_user_id
  IS 'User who approved or rejected the invoice. SET NULL if user is deleted.';
