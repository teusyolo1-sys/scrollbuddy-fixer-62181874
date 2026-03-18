INSERT INTO storage.buckets (id, name, public)
VALUES ('company-wallpapers', 'company-wallpapers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin upload wallpapers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-wallpapers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone view wallpapers" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'company-wallpapers');

CREATE POLICY "Admin delete wallpapers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-wallpapers' AND public.has_role(auth.uid(), 'admin'));