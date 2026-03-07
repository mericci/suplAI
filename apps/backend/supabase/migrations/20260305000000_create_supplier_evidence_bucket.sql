-- Create supplier-evidence storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-evidence', 'supplier-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload objects
CREATE POLICY "Authenticated users can upload supplier evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'supplier-evidence');

-- Allow authenticated users to read objects
CREATE POLICY "Authenticated users can read supplier evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'supplier-evidence');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete supplier evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'supplier-evidence');
