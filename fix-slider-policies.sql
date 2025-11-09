-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Anyone can view active slider images" ON slider_images;
DROP POLICY IF EXISTS "Admins can manage slider images" ON slider_images;

-- سياسة للقراءة - الجميع يمكنهم رؤية جميع الصور (نشطة وغير نشطة) للأدمن
CREATE POLICY "Public can view slider images"
  ON slider_images FOR SELECT
  TO public
  USING (true);

-- سياسة للإدراج - الأدمن فقط
CREATE POLICY "Admins can insert slider images"
  ON slider_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- سياسة للتحديث - الأدمن فقط
CREATE POLICY "Admins can update slider images"
  ON slider_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- سياسة للحذف - الأدمن فقط
CREATE POLICY "Admins can delete slider images"
  ON slider_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );
