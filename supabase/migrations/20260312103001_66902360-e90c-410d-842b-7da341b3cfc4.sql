INSERT INTO storage.buckets (id, name, public) VALUES ('scheduled-media', 'scheduled-media', true);

CREATE POLICY "Authenticated users can upload scheduled media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scheduled-media');

CREATE POLICY "Anyone can read scheduled media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'scheduled-media');

CREATE POLICY "Users can delete own scheduled media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'scheduled-media' AND (storage.foldername(name))[1] = auth.uid()::text);