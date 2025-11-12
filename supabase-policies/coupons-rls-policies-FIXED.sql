-- سياسات أمان Row Level Security لجدول الكوبونات (محدثة)
-- تستخدم جدول admins بدلاً من profiles.is_admin
-- يجب تطبيق هذه السياسات في Supabase SQL Editor

-- 1. حذف السياسات القديمة أولاً
DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
DROP POLICY IF EXISTS "Allow users to read active coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to read all coupons" ON coupons;

-- 2. إنشاء السياسات الجديدة باستخدام جدول admins

-- السماح للمسؤولين بإضافة كوبونات جديدة
CREATE POLICY "Allow admins to insert coupons"
ON coupons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- السماح للمسؤولين بتحديث الكوبونات
CREATE POLICY "Allow admins to update coupons"
ON coupons
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- السماح للمسؤولين بحذف الكوبونات
CREATE POLICY "Allow admins to delete coupons"
ON coupons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- السماح للجميع (بما في ذلك المستخدمين العاديين) بقراءة الكوبونات النشطة
CREATE POLICY "Allow users to read active coupons"
ON coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- السماح للمسؤولين بقراءة جميع الكوبونات (بما في ذلك غير النشطة)
CREATE POLICY "Allow admins to read all coupons"
ON coupons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- 3. التحقق من تطبيق السياسات
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;

-- ملاحظة: تأكد من أن جدول admins يحتوي على سجل لحسابك:
-- SELECT * FROM admins WHERE user_id = auth.uid();
