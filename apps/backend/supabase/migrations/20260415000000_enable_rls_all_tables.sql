-- Enable Row-Level Security on all tables that lack it.
-- The backend uses the service role key for all DB queries, which bypasses RLS automatically.
-- Enabling RLS blocks direct anon-key access to the Supabase REST API, resolving the
-- "Table publicly accessible" and "Sensitive data publicly accessible" security alerts.

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_center_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_accounting_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_cost_center_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_accounting_id_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomina_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_services ENABLE ROW LEVEL SECURITY;
