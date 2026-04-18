-- User payment info: personal bank accounts used for expense reimbursements.
-- Multiple accounts per user allowed; at most one can be marked as default.
CREATE TABLE public.user_payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  bank TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cuenta_corriente', 'cuenta_vista', 'cuenta_ahorro', 'cuenta_rut')),
  account_number TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- At most one active default account per user.
CREATE UNIQUE INDEX user_payment_info_one_default_per_user
  ON public.user_payment_info(user_id)
  WHERE is_default = true AND deleted_at IS NULL;

CREATE INDEX user_payment_info_user_id
  ON public.user_payment_info(user_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.user_payment_info ENABLE ROW LEVEL SECURITY;
