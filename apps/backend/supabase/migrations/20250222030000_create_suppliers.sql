-- Create suppliers table.
-- Suppliers are GLOBAL (not per-organization).
-- A supplier with a given tax_identifier is a single row shared across all organizations.
-- Invoices from different organizations reference the same supplier row.

CREATE TABLE IF NOT EXISTS public.suppliers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name     TEXT        NOT NULL,
  tax_identifier TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- Active suppliers must have unique tax identifiers (deduplication across orgs).
-- Partial index: allows multiple soft-deleted rows with the same tax_identifier.
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_tax_identifier_active
  ON public.suppliers (tax_identifier)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_tax_identifier
  ON public.suppliers (tax_identifier);

CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at
  ON public.suppliers (deleted_at);

CREATE TRIGGER handle_updated_at_suppliers
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

COMMENT ON TABLE public.suppliers
  IS 'Global supplier registry. Suppliers are shared across all organizations to avoid duplication. '
     'Identified uniquely by tax_identifier.';

COMMENT ON COLUMN public.suppliers.tax_identifier
  IS 'Generic tax authority identifier for the supplier. Unique per active supplier.';
