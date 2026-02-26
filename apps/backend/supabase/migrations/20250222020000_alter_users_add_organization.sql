-- Extend users table for multi-tenant organization membership.
-- Adds: organization_id (FK → organizations), first_name, last_name, deleted_at (soft delete).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS organization_id  UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS first_name       TEXT,
  ADD COLUMN IF NOT EXISTS last_name        TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_organization_id
  ON public.users (organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON public.users (deleted_at);

COMMENT ON COLUMN public.users.organization_id
  IS 'Every user belongs to exactly one organization. '
     'RESTRICT prevents deleting an org that still has active users.';

COMMENT ON COLUMN public.users.first_name
  IS 'User''s first name.';

COMMENT ON COLUMN public.users.last_name
  IS 'User''s last name.';

COMMENT ON COLUMN public.users.deleted_at
  IS 'Soft delete timestamp. Non-null means the user is logically deleted.';
