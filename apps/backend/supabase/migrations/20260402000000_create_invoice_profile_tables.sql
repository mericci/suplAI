-- Invoice Comments: per-invoice thread of comments and rejection reasons.
CREATE TABLE public.invoice_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'rejection')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX invoice_comments_invoice_id
  ON public.invoice_comments(invoice_id)
  WHERE deleted_at IS NULL;

CREATE INDEX invoice_comments_organization_id
  ON public.invoice_comments(organization_id)
  WHERE deleted_at IS NULL;

-- Invoice Events: audit trail for lifecycle transitions.
-- event_type values: 'created' | 'ai_validated' | 'approved' | 'rejected' | 'nomina_associated' | 'paid'
-- metadata: JSONB for extra context (e.g., nomina_id, ai_notes)
CREATE TABLE public.invoice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invoice_events_invoice_id
  ON public.invoice_events(invoice_id);

CREATE INDEX invoice_events_organization_id
  ON public.invoice_events(organization_id);

-- Invoice Documents: invoice-specific file attachments (separate from supplier_documents).
CREATE TABLE public.invoice_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  description TEXT,
  uploaded_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX invoice_documents_invoice_id
  ON public.invoice_documents(invoice_id)
  WHERE deleted_at IS NULL;
