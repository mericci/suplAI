-- Invoice Cost Center Distributions: records how a specific invoice's amount
-- is split across cost centers. Created automatically for 'average'/'percentage'
-- distribution types, or manually by the user for 'manual' distribution.

CREATE TABLE public.invoice_cost_center_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  -- amount: in the same currency unit as invoices.net_amount (integer pesos).
  -- All distribution rows for the same invoice must sum to invoice.net_amount.
  amount INTEGER NOT NULL,
  percentage NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invoice_cost_center_distributions_invoice_id
  ON public.invoice_cost_center_distributions(invoice_id);

-- Invoice Accounting ID Distributions: same concept for accounting IDs

CREATE TABLE public.invoice_accounting_id_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  accounting_id UUID NOT NULL REFERENCES public.accounting_ids(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  amount INTEGER NOT NULL,
  percentage NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invoice_accounting_id_distributions_invoice_id
  ON public.invoice_accounting_id_distributions(invoice_id);
