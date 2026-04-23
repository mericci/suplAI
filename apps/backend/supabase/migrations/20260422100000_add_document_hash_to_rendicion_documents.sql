ALTER TABLE rendicion_documents
  ADD COLUMN IF NOT EXISTS document_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_rendicion_documents_hash
  ON rendicion_documents (organization_id, document_hash)
  WHERE deleted_at IS NULL;
