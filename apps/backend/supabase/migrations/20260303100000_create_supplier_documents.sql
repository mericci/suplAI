-- Create supplier_documents table
-- Stores documents (contracts, receipts, quotes) associated with suppliers
-- Each document may have AI-extracted service/tariff metadata

CREATE TABLE public.supplier_documents (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id          UUID        NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  file_name            TEXT        NOT NULL,
  storage_path         TEXT        NOT NULL,
  storage_bucket       TEXT        NOT NULL DEFAULT 'supplier-evidence',
  document_type        TEXT,
  service_category     TEXT,
  service_description  TEXT,
  tariff_type          TEXT,
  tariff_detail        TEXT,
  amounts              JSONB       NOT NULL DEFAULT '[]',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX idx_supplier_documents_supplier_id ON public.supplier_documents(supplier_id);
CREATE INDEX idx_supplier_documents_deleted_at  ON public.supplier_documents(deleted_at);
CREATE INDEX idx_supplier_documents_supplier_active
  ON public.supplier_documents(supplier_id)
  WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER handle_updated_at_supplier_documents
  BEFORE UPDATE ON public.supplier_documents
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
