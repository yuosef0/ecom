-- إعداد نظام المسؤولين في قاعدة البيانات

-- 1. إضافة عمود is_admin إلى جدول profiles (إذا لم يكن موجوداً)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. إنشاء فهرس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- 3. جعل المستخدم الأول مسؤولاً (اختياري - قم بتعديل هذا بناءً على احتياجاتك)
-- يمكنك استخدام أحد الخيارات التالية:

-- خيار 1: جعل المستخدم بناءً على البريد الإلكتروني
-- استبدل 'admin@example.com' ببريدك الإلكتروني
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@example.com'
-- );

-- خيار 2: جعل أول مستخدم مسجل مسؤولاً
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = (
--   SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
-- );

-- خيار 3: جعل مستخدم محدد مسؤولاً بناءً على ID
-- استبدل 'user-uuid-here' بمعرف المستخدم
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = 'user-uuid-here';

-- 4. إنشاء دالة للتحقق من أن المستخدم مسؤول
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إنشاء عرض (view) لعرض جميع المسؤولين
CREATE OR REPLACE VIEW admin_users AS
SELECT
  p.id,
  p.full_name,
  u.email,
  p.created_at,
  u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true;

-- 6. سياسة للسماح للمسؤولين برؤية جميع المستخدمين
-- CREATE POLICY "Allow admins to view all profiles"
-- ON profiles
-- FOR SELECT
-- TO authenticated
-- USING (
--   is_admin() OR id = auth.uid()
-- );

-- ملاحظات:
-- - بعد تشغيل هذا الملف، قم بتفعيل أحد الخيارات (1، 2، أو 3) لجعل مستخدم مسؤولاً
-- - يمكنك التحقق من المسؤولين باستخدام: SELECT * FROM admin_users;
-- - للتحقق من أنك مسؤول: SELECT is_admin();
