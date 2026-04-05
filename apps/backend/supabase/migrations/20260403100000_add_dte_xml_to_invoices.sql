-- Add dte_xml column to invoices table
-- Stores the raw DTE XML document fetched from SII portal.
-- NULL means XML has not yet been fetched or is unavailable for this document type.
ALTER TABLE public.invoices
  ADD COLUMN dte_xml TEXT;
