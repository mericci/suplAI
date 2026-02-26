-- Add 'paid' to the invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'paid';

-- Track when we last fetched invoices from SII
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_sii_sync_at TIMESTAMPTZ;
