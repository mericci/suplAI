-- Create rendicion-evidence storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rendicion-evidence', 'rendicion-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload rendicion evidence
CREATE POLICY "Authenticated users can upload rendicion evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rendicion-evidence');

-- Only the uploader (owner) can read their own objects directly.
-- (Signed URL generation on the backend uses service role and bypasses this.)
CREATE POLICY "Owners can read their rendicion evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rendicion-evidence' AND owner = auth.uid());

-- Only the uploader (owner) can delete their own objects.
CREATE POLICY "Owners can delete their rendicion evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'rendicion-evidence' AND owner = auth.uid());
