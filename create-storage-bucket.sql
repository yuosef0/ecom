-- إنشاء Storage Bucket للصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- سياسة للسماح للجميع بقراءة الصور
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- سياسة للسماح للمستخدمين المصرح لهم برفع الصور
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- سياسة للسماح للمستخدمين بحذف صورهم
CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- سياسة للسماح للأدمن بحذف أي صورة
CREATE POLICY "Admins can delete any image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);
