-- Alter invoices table:
-- 1. Change document_type from ENUM to TEXT (SII human-readable description)
-- 2. Add document_type_number INTEGER (SII numeric code, e.g. 33)

-- Change document_type column from ENUM to TEXT
ALTER TABLE public.invoices
  ALTER COLUMN document_type TYPE TEXT USING document_type::TEXT;

-- Drop the now-unused ENUM type (if it exists)
DROP TYPE IF EXISTS public.document_type;

-- Add document_type_number column
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS document_type_number INTEGER NOT NULL DEFAULT 0;

-- Remove the default now that the column exists
ALTER TABLE public.invoices
  ALTER COLUMN document_type_number DROP DEFAULT;
