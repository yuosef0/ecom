-- سياسات أمان Row Level Security لجدول الكوبونات
-- يجب تطبيق هذه السياسات في Supabase SQL Editor

-- 1. السماح للمسؤولين بإضافة كوبونات جديدة
CREATE POLICY "Allow admins to insert coupons"
ON coupons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 2. السماح للمسؤولين بتحديث الكوبونات
CREATE POLICY "Allow admins to update coupons"
ON coupons
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 3. السماح للمسؤولين بحذف الكوبونات
CREATE POLICY "Allow admins to delete coupons"
ON coupons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 4. السماح للجميع (بما في ذلك المستخدمين العاديين) بقراءة الكوبونات النشطة
CREATE POLICY "Allow users to read active coupons"
ON coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. السماح للمسؤولين بقراءة جميع الكوبونات (بما في ذلك غير النشطة)
CREATE POLICY "Allow admins to read all coupons"
ON coupons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ملاحظة: إذا لم يكن عمود is_admin موجوداً في جدول profiles، يجب إضافته أولاً:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- لتطبيق هذه السياسات:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى SQL Editor
-- 3. قم بنسخ ولصق هذا الكود
-- 4. اضغط على Run

-- للتحقق من وجود RLS على الجدول:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'coupons';

-- لحذف السياسات القديمة (إذا لزم الأمر):
-- DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
-- DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
-- DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
-- DROP POLICY IF EXISTS "Allow users to read active coupons" ON coupons;
-- DROP POLICY IF EXISTS "Allow admins to read all coupons" ON coupons;
