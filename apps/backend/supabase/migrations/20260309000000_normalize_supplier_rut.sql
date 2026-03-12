-- Normalize supplier tax_identifier: strip dots, merge duplicates
--
-- Problem: SII returns RUTs in different formats ("76124890-1" vs "76.124.890-1"),
-- causing duplicate supplier rows that bypass the unique partial index.
-- Solution: normalize to no-dots format, merge duplicates by migrating invoice
-- references to the oldest supplier record, then soft-delete the extras.

-- Step 1: Migrate invoice supplier_id references from duplicate suppliers to the
-- canonical (oldest) supplier in each duplicate group.
WITH normalized AS (
  SELECT
    id,
    created_at,
    REPLACE(tax_identifier, '.', '') AS normalized_rut
  FROM suppliers
  WHERE deleted_at IS NULL
),
ranked AS (
  SELECT
    id,
    normalized_rut,
    ROW_NUMBER() OVER (PARTITION BY normalized_rut ORDER BY created_at ASC) AS rn
  FROM normalized
),
keep AS (
  SELECT id AS keep_id, normalized_rut FROM ranked WHERE rn = 1
),
drop_ids AS (
  SELECT r.id AS drop_id, k.keep_id
  FROM ranked r
  JOIN keep k ON k.normalized_rut = r.normalized_rut
  WHERE r.rn > 1
)
UPDATE invoices
SET supplier_id = drop_ids.keep_id
FROM drop_ids
WHERE invoices.supplier_id = drop_ids.drop_id;

-- Step 2: Soft-delete duplicate supplier rows (keep only the oldest per RUT).
WITH normalized AS (
  SELECT
    id,
    created_at,
    REPLACE(tax_identifier, '.', '') AS normalized_rut
  FROM suppliers
  WHERE deleted_at IS NULL
),
ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY normalized_rut ORDER BY created_at ASC) AS rn
  FROM normalized
)
UPDATE suppliers
SET deleted_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 3: Normalize all active supplier tax_identifier values (strip dots).
UPDATE suppliers
SET tax_identifier = REPLACE(tax_identifier, '.', '')
WHERE deleted_at IS NULL
  AND tax_identifier LIKE '%.%';
