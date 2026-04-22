ALTER TABLE rendiciones
  DROP CONSTRAINT IF EXISTS rendiciones_status_check;

ALTER TABLE rendiciones
  ADD CONSTRAINT rendiciones_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

ALTER TABLE rendiciones
  ALTER COLUMN status SET DEFAULT 'draft';
