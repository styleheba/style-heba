-- ============================================================
-- Style Heba - Storage Bucket & Policies
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('site', 'site', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Products bucket: anyone can view, admins can upload/delete
CREATE POLICY "products_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "products_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "products_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "products_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Site bucket: same pattern
CREATE POLICY "site_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site');

CREATE POLICY "site_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "site_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "site_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid() AND is_active = TRUE
    )
  );
