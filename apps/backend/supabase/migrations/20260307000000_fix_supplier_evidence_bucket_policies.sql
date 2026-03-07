-- Fix supplier-evidence storage bucket policies
-- Scope SELECT and DELETE to the object owner (uploader) only.
-- The INSERT policy is unchanged — any authenticated user may upload.
-- Note: the backend always generates signed URLs via service role,
-- so the SELECT restriction does not break the preview flow.

DROP POLICY IF EXISTS "Authenticated users can read supplier evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete supplier evidence" ON storage.objects;

-- Only the uploader (owner) can read their own objects directly.
-- (Signed URL generation on the backend uses service role and bypasses this.)
CREATE POLICY "Owners can read their supplier evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'supplier-evidence' AND owner = auth.uid());

-- Only the uploader (owner) can delete their own objects.
CREATE POLICY "Owners can delete their supplier evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'supplier-evidence' AND owner = auth.uid());
