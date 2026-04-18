-- Rendiciones: employee expense reimbursement requests.
CREATE TABLE public.rendiciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  user_payment_info_id UUID REFERENCES public.user_payment_info(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ai_validated BOOLEAN NOT NULL DEFAULT false,
  total_amount NUMERIC,
  rejection_notes TEXT,
  approved_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX rendiciones_organization_id
  ON public.rendiciones(organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rendiciones_created_by_user_id
  ON public.rendiciones(created_by_user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rendiciones_status
  ON public.rendiciones(status)
  WHERE deleted_at IS NULL;

ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;
