INSERT INTO storage.buckets (id, name, public)
VALUES ('showcase-products', 'showcase-products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Admins can upload showcase product images" ON storage.objects;
CREATE POLICY "Admins can upload showcase product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'showcase-products'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update showcase product images" ON storage.objects;
CREATE POLICY "Admins can update showcase product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'showcase-products'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'showcase-products'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can delete showcase product images" ON storage.objects;
CREATE POLICY "Admins can delete showcase product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'showcase-products'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Anyone can view showcase product images" ON storage.objects;
CREATE POLICY "Anyone can view showcase product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'showcase-products');
