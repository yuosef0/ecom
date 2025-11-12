-- ================================================
-- Storage Buckets Setup
-- إعداد مخازن الملفات (Storage Buckets)
-- ================================================
-- Run this in Supabase SQL Editor
-- نفذ هذا في Supabase SQL Editor
-- ================================================

-- ------------------------------------------------
-- PART 1: Create Storage Buckets
-- الجزء 1: إنشاء مخازن الملفات
-- ------------------------------------------------

-- 1. Products Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products-imges',
    'products-imges',
    true,
    52428800,  -- 50MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Category Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'category-images',
    'category-images',
    true,
    52428800,  -- 50MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Slider Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'slider-images',
    'slider-images',
    true,
    52428800,  -- 50MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 4. Profile Avatars Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ------------------------------------------------
-- PART 2: Storage Policies
-- الجزء 2: سياسات المخازن
-- ------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any file" ON storage.objects;

-- 1. Public can view all images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id IN (
        'products-imges',
        'category-images',
        'slider-images',
        'avatars'
    )
);

-- 2. Authenticated users can upload images
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN (
        'products-imges',
        'category-images',
        'slider-images',
        'avatars'
    )
);

-- 3. Users can update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid()::text = owner)
WITH CHECK (auth.uid()::text = owner);

-- 4. Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid()::text = owner);

-- 5. Admins can delete any file
CREATE POLICY "Admins can delete any file"
ON storage.objects FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- ------------------------------------------------
-- PART 3: Verify Setup
-- الجزء 3: التحقق من الإعداد
-- ------------------------------------------------

-- Check buckets
SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- Check storage policies
SELECT
    policyname,
    bucket_id,
    cmd as operation,
    permissive
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- ------------------------------------------------
-- PART 4: Test Upload (Optional)
-- الجزء 4: اختبار الرفع (اختياري)
-- ------------------------------------------------

/*
-- Test uploading a file using Supabase client:

const { data, error } = await supabase.storage
    .from('products-imges')
    .upload('test-image.jpg', file);

if (error) console.error('Upload failed:', error);
else console.log('Upload success:', data);
*/

-- ================================================
-- CLEANUP (if needed)
-- التنظيف (إذا لزم الأمر)
-- ================================================

/*
-- Delete all files from a bucket
DELETE FROM storage.objects
WHERE bucket_id = 'bucket-name';

-- Delete bucket (be careful!)
DELETE FROM storage.buckets
WHERE id = 'bucket-name';
*/

-- ================================================
-- NOTES
-- ملاحظات
-- ================================================

/*
File Size Limits:
- Products/Categories/Slider: 50MB
- Avatars: 5MB

Allowed MIME Types:
- JPEG, JPG, PNG, WebP, GIF

Security:
- Public can view all images (CDN-friendly)
- Only authenticated users can upload
- Users can manage their own uploads
- Admins can delete any file

CDN:
- All buckets are public for CDN access
- Supabase provides automatic CDN
- Use image transformations: ?width=800&height=600
*/

-- ================================================
-- DONE! 🎉
-- تم! 🎉
-- ================================================

-- You can now:
-- 1. Upload images from the admin panel
-- 2. Images will be publicly accessible via CDN
-- 3. Automatic image optimization available

-- Test in your app:
-- 1. Go to /admin/products
-- 2. Try uploading a product image
-- 3. Image should appear immediately
