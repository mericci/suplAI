-- Create organizations table
-- Represents client companies (tenants) in the multi-tenant system.
-- Tax authority credentials are stored AES-256-GCM encrypted in the application layer.

CREATE TABLE IF NOT EXISTS public.organizations (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name                  TEXT        NOT NULL,
  tax_identifier              TEXT        NOT NULL,
  tax_authority_username      TEXT,
  -- AES-256-GCM encrypted payload: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>
  -- Decrypted at runtime using the ENCRYPTION_MASTER_KEY environment variable.
  -- NEVER return this field in API responses.
  tax_authority_password_enc  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ
);

-- Active organizations must have unique tax identifiers.
-- Partial index: allows multiple soft-deleted rows with the same tax_identifier.
CREATE UNIQUE INDEX IF NOT EXISTS uq_organizations_tax_identifier_active
  ON public.organizations (tax_identifier)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_tax_identifier
  ON public.organizations (tax_identifier);

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at
  ON public.organizations (deleted_at);

DROP TRIGGER IF EXISTS handle_updated_at_organizations ON public.organizations;
CREATE TRIGGER handle_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

COMMENT ON TABLE public.organizations
  IS 'Client companies (tenants). Each organization is an isolated multi-tenant unit.';

COMMENT ON COLUMN public.organizations.tax_identifier
  IS 'Generic tax authority identifier (e.g. RUT, EIN, VAT number). Unique per active org.';

COMMENT ON COLUMN public.organizations.tax_authority_password_enc
  IS 'AES-256-GCM encrypted password for the external tax authority system. '
     'Format: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>. '
     'Encrypted with ENCRYPTION_MASTER_KEY. NEVER expose in API responses.';
