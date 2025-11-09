-- حذف السياسات القديمة للـ Storage إذا كانت موجودة
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any image" ON storage.objects;

-- سياسة للسماح للجميع بقراءة الصور من bucket product-images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- سياسة للسماح للمستخدمين المصرح لهم برفع الصور
CREATE POLICY "Authenticated users can upload to product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- سياسة للسماح للمستخدمين بحذف صورهم
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- سياسة للسماح للمستخدمين بتحديث صورهم
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');
