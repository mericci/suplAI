-- Create organization_suppliers junction table
-- Tracks which suppliers have been associated with an organization through invoice sync.
-- Enables future "list suppliers by org" queries without scanning all invoices.

CREATE TABLE public.organization_suppliers (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id)     ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, supplier_id)
);

CREATE INDEX idx_org_suppliers_org_id      ON organization_suppliers(organization_id);
CREATE INDEX idx_org_suppliers_supplier_id ON organization_suppliers(supplier_id);

COMMENT ON TABLE public.organization_suppliers
  IS 'Junction table linking organizations to the suppliers they have received invoices from.';
