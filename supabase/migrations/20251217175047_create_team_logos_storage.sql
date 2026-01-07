/*
  # Create team logos storage bucket

  1. Storage Bucket
    - Create `team-logos` bucket for storing team logo images
    - Public bucket (images accessible via URL)
    - Size limit: 2MB per file
    - Allowed types: image/png, image/jpeg, image/webp

  2. Security
    - Users can upload logos to their own folder
    - Users can update their own logos
    - Users can delete their own logos
    - Anyone can view logos (public bucket)
*/

-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos to their own folder
CREATE POLICY "Users can upload logos to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view logos (public bucket)
CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-logos');