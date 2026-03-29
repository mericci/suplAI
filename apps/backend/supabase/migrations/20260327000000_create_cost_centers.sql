-- cost_centers table
CREATE TABLE public.cost_centers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id      TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_cost_centers_org_external_id_active
  ON public.cost_centers(organization_id, external_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_cost_centers_org_active
  ON public.cost_centers(organization_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER handle_updated_at_cost_centers
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- cost_center_users: join table (no soft delete — just remove the row)
CREATE TABLE public.cost_center_users (
  cost_center_id  UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cost_center_id, user_id)
);

CREATE INDEX idx_cost_center_users_cc   ON public.cost_center_users(cost_center_id);
CREATE INDEX idx_cost_center_users_user ON public.cost_center_users(user_id);
