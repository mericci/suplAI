-- Add email column to supplier_payment_info table
ALTER TABLE supplier_payment_info
  ADD COLUMN IF NOT EXISTS email TEXT;
