-- سكريبت للتحقق من صلاحيات المستخدم الحالي
-- نفذ هذا السكريبت بعد تسجيل الدخول

-- 1. عرض معلومات المستخدم الحالي
SELECT
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 2. عرض بيانات المستخدم من جدول auth.users
SELECT
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'is_admin' as is_admin_value,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- 3. التحقق من السياسات الموجودة على جدول slider_images
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'slider_images';

-- 4. عرض جميع صور السلايدر (للتأكد من إمكانية القراءة)
SELECT * FROM slider_images ORDER BY display_order;
