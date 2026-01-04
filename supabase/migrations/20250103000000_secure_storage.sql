-- Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-images', 'dish-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policy for viewing objects
DROP POLICY IF EXISTS "Authenticated users can select dish images" ON storage.objects;
CREATE POLICY "Authenticated users can select dish images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'dish-images');

-- Policy for uploading objects
DROP POLICY IF EXISTS "Authenticated users can upload dish images" ON storage.objects;
CREATE POLICY "Authenticated users can upload dish images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dish-images');

-- Policy for updating/deleting objects
DROP POLICY IF EXISTS "Authenticated users can update dish images" ON storage.objects;
CREATE POLICY "Authenticated users can update dish images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'dish-images');

DROP POLICY IF EXISTS "Authenticated users can delete dish images" ON storage.objects;
CREATE POLICY "Authenticated users can delete dish images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'dish-images');

-- Data Migration: Convert legacy public URLs to paths
-- Legacy URL format: http.../storage/v1/object/public/dish-images/<path>
-- We want to extract <path>
UPDATE dishes
SET image_url = regexp_replace(image_url, '^.*/storage/v1/object/public/dish-images/', '')
WHERE image_url LIKE '%/storage/v1/object/public/dish-images/%';
