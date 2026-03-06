ALTER TABLE supplier_documents
  ADD COLUMN document_role TEXT NOT NULL DEFAULT 'cost_contract'
    CHECK (document_role IN ('cost_contract', 'additional')),
  ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark the most-recent existing doc per supplier as current
UPDATE supplier_documents sd
SET is_current = true
WHERE id IN (
  SELECT DISTINCT ON (supplier_id) id
  FROM supplier_documents
  WHERE deleted_at IS NULL
  ORDER BY supplier_id, created_at DESC
);
