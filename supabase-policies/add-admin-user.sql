-- إضافة مستخدم كمسؤول في جدول admins
-- استبدل 'your-email@example.com' ببريدك الإلكتروني الفعلي

-- الخطوة 1: التحقق من جدول admins موجود
-- (إذا ظهر خطأ، فالجدول غير موجود ويجب إنشاؤه أولاً)
SELECT * FROM admins LIMIT 1;

-- الخطوة 2: التحقق من معلوماتك الشخصية
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';
-- انسخ الـ id من النتيجة واستخدمه في الخطوة التالية

-- الخطوة 3: إضافة نفسك كمسؤول
-- ⚠️ استبدل 'your-user-id-here' بالـ id الذي حصلت عليه من الخطوة 2
-- أو استخدم البريد الإلكتروني مباشرة كما في المثال أدناه

-- خيار 1: باستخدام البريد الإلكتروني
INSERT INTO admins (user_id, role, is_active, created_at, updated_at)
SELECT
  id,
  'super_admin',  -- يمكن أن يكون: super_admin, admin, moderator
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = true, updated_at = NOW();

-- خيار 2: باستخدام الـ ID مباشرة (إذا كنت تعرفه)
-- INSERT INTO admins (user_id, role, is_active, created_at, updated_at)
-- VALUES (
--   'your-user-id-here',
--   'super_admin',
--   true,
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (user_id) DO UPDATE
-- SET is_active = true, updated_at = NOW();

-- الخطوة 4: التحقق من النتيجة
SELECT
  a.user_id,
  a.role,
  a.is_active,
  u.email,
  a.created_at
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id = auth.uid();

-- يجب أن ترى سجلاً واحداً مع:
-- - role: super_admin
-- - is_active: true
-- - email: بريدك الإلكتروني

-- ملاحظات:
-- 1. إذا ظهر خطأ "relation admins does not exist"، فالجدول غير موجود
--    ويجب إنشاؤه أولاً (انظر الملف create-admins-table.sql)
-- 2. إذا ظهر خطأ "duplicate key value"، فأنت موجود بالفعل في الجدول
--    ويمكنك تحديث حالتك فقط:
--    UPDATE admins SET is_active = true WHERE user_id = auth.uid();
