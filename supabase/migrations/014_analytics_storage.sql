-- Insert analytics exports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('analytics-exports', 'analytics-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for analytics exports
CREATE POLICY "Users can access their org's analytics exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'analytics-exports' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Users can create analytics exports for their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'analytics-exports' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE profile_id = auth.uid()
  )
);