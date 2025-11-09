-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Public can view slider images" ON slider_images;
DROP POLICY IF EXISTS "Admins can insert slider images" ON slider_images;
DROP POLICY IF EXISTS "Admins can update slider images" ON slider_images;
DROP POLICY IF EXISTS "Admins can delete slider images" ON slider_images;
DROP POLICY IF EXISTS "Anyone can view active slider images" ON slider_images;
DROP POLICY IF EXISTS "Admins can manage slider images" ON slider_images;

-- ✅ سياسة بسيطة: السماح للجميع بالقراءة
CREATE POLICY "allow_public_read"
  ON slider_images FOR SELECT
  TO public
  USING (true);

-- ✅ سياسة بسيطة: السماح لجميع المستخدمين المصرح لهم بالإضافة
-- (لأغراض التجربة فقط - يمكن تقييدها لاحقاً)
CREATE POLICY "allow_authenticated_insert"
  ON slider_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ✅ سياسة بسيطة: السماح لجميع المستخدمين المصرح لهم بالتحديث
CREATE POLICY "allow_authenticated_update"
  ON slider_images FOR UPDATE
  TO authenticated
  USING (true);

-- ✅ سياسة بسيطة: السماح لجميع المستخدمين المصرح لهم بالحذف
CREATE POLICY "allow_authenticated_delete"
  ON slider_images FOR DELETE
  TO authenticated
  USING (true);

-- ملاحظة: هذه سياسات مبسطة للتجربة
-- بعد التأكد من عملها، يمكن تقييدها للأدمن فقط
