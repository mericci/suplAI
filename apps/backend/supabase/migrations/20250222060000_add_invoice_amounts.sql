-- Add monetary amount columns to invoices table.
-- All three columns are nullable so existing rows remain valid.

ALTER TABLE invoices
  ADD COLUMN net_amount   NUMERIC(15,2),
  ADD COLUMN tax_amount   NUMERIC(15,2),
  ADD COLUMN gross_amount NUMERIC(15,2);

-- Composite partial index for fast per-org, per-supplier aggregation
-- used by the list-suppliers-by-org query.
CREATE INDEX idx_invoices_org_supplier_status
  ON invoices(organization_id, supplier_id, status)
  WHERE deleted_at IS NULL;
