-- Add paid_at timestamp to invoices table
-- Recorded when an invoice status transitions from 'approved' to 'paid'

ALTER TABLE invoices
  ADD COLUMN paid_at TIMESTAMPTZ;
