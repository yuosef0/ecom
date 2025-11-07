-- ============================================
-- سكريبت تشخيصي لمشكلة RLS
-- Diagnostic Script for RLS Issues
-- ============================================

-- 🔍 الخطوة 1: التحقق من وجود جدول admins
-- ============================================

SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'admins'
) AS admins_table_exists;

-- ✅ يجب أن يظهر: true
-- ❌ إذا ظهر false: شغّل ملف admins-setup.sql أولاً


-- ============================================
-- 🔍 الخطوة 2: التحقق من المستخدم الحالي
-- ============================================

SELECT
  auth.uid() AS current_user_id,
  auth.email() AS current_user_email;

-- ✅ يجب أن يظهر UUID والإيميل
-- ❌ إذا ظهر NULL: أنت لست مسجل دخول، سجل دخول في الموقع أولاً


-- ============================================
-- 🔍 الخطوة 3: التحقق من وجودك في جدول admins
-- ============================================

SELECT
  id,
  user_id,
  email,
  role,
  is_active,
  created_at
FROM admins
WHERE user_id = auth.uid();

-- ✅ يجب أن يظهر صف واحد مع بياناتك
-- ❌ إذا لم يظهر شيء: أنت لست مسجل كأدمن، نفذ الخطوة 4


-- ============================================
-- 🔍 الخطوة 4: عرض جميع المستخدمين (للمساعدة)
-- ============================================

SELECT
  id AS user_id,
  email,
  raw_user_meta_data->>'full_name' AS full_name,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ✅ يجب أن يظهر حسابك هنا
-- انسخ user_id واستخدمه في الخطوة 5


-- ============================================
-- 🔧 الخطوة 5: إضافة نفسك كأدمن (إذا لم تكن مسجل)
-- ============================================

-- استبدل 'YOUR-EMAIL@EXAMPLE.COM' ببريدك الإلكتروني
/*
INSERT INTO admins (user_id, email, full_name, role)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  'super_admin'
FROM auth.users
WHERE email = 'YOUR-EMAIL@EXAMPLE.COM'
ON CONFLICT (user_id) DO NOTHING;
*/


-- ============================================
-- 🔍 الخطوة 6: التحقق من سياسات RLS على جدول products
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd AS operation,
  CASE
    WHEN cmd = 'SELECT' THEN 'قراءة'
    WHEN cmd = 'INSERT' THEN 'إضافة'
    WHEN cmd = 'UPDATE' THEN 'تعديل'
    WHEN cmd = 'DELETE' THEN 'حذف'
    ELSE cmd
  END AS operation_arabic
FROM pg_policies
WHERE tablename = 'products'
ORDER BY
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ✅ يجب أن تظهر 4 سياسات:
--    1. Allow public read access to products (SELECT/قراءة)
--    2. Allow admins to insert products (INSERT/إضافة)
--    3. Allow admins to update products (UPDATE/تعديل)
--    4. Allow admins to delete products (DELETE/حذف)

-- ❌ إذا ظهرت سياسات مختلفة: شغّل ملف update-rls-policies.sql


-- ============================================
-- 🔍 الخطوة 7: اختبار السياسة (تحقق من صلاحياتك)
-- ============================================

-- هذا الاستعلام يتحقق من أنك أدمن
SELECT EXISTS (
  SELECT 1 FROM admins
  WHERE user_id = auth.uid()
  AND is_active = true
) AS i_am_admin;

-- ✅ يجب أن يظهر: true
-- ❌ إذا ظهر false: أنت لست أدمن أو is_active = false


-- ============================================
-- 🔍 الخطوة 8: اختبار إضافة منتج (بدون تنفيذ فعلي)
-- ============================================

-- هذا الاستعلام يتحقق فقط من إمكانية الإضافة بدون إضافة فعلية
SELECT
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  ) AS can_insert_products;

-- ✅ يجب أن يظهر: true
-- ❌ إذا ظهر false: المشكلة في صلاحيات الأدمن


-- ============================================
-- 🔍 الخطوة 9: التحقق من RLS مفعّل على products
-- ============================================

SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'products';

-- ✅ يجب أن يظهر: rls_enabled = true
-- ❌ إذا ظهر false: RLS غير مفعّل (شغّل update-rls-policies.sql)


-- ============================================
-- 📊 تقرير شامل
-- ============================================

SELECT
  '1. جدول admins موجود' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'admins'
    ) THEN '✅ نعم'
    ELSE '❌ لا - شغّل admins-setup.sql'
  END AS status

UNION ALL

SELECT
  '2. أنت مسجل دخول' AS check_name,
  CASE
    WHEN auth.uid() IS NOT NULL THEN '✅ نعم - ' || COALESCE(auth.email(), 'unknown')
    ELSE '❌ لا - سجل دخول في الموقع'
  END AS status

UNION ALL

SELECT
  '3. أنت مسجل كأدمن' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    ) THEN '✅ نعم'
    ELSE '❌ لا - أضف نفسك في جدول admins'
  END AS status

UNION ALL

SELECT
  '4. حسابك نشط (is_active)' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true
    ) THEN '✅ نعم'
    ELSE '❌ لا - فعّل حسابك في جدول admins'
  END AS status

UNION ALL

SELECT
  '5. سياسات RLS صحيحة' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'products'
      AND policyname = 'Allow admins to insert products'
    ) THEN '✅ نعم'
    ELSE '❌ لا - شغّل update-rls-policies.sql'
  END AS status

UNION ALL

SELECT
  '6. يمكنك إضافة منتجات' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid() AND is_active = true
    ) THEN '✅ نعم'
    ELSE '❌ لا - راجع الخطوات السابقة'
  END AS status;


-- ============================================
-- 📋 ملخص المشكلة والحل
-- ============================================

/*
✅ إذا كانت جميع الاختبارات تظهر ✅:
   - المشكلة ليست من السياسات
   - قد تكون المشكلة في رفع الصورة إلى Storage
   - شارك الخطأ الكامل من Console

❌ إذا كان أي اختبار يظهر ❌:
   - اتبع التعليمات المكتوبة بجانب كل اختبار
   - نفذ الخطوات المطلوبة
   - أعد تشغيل هذا السكريبت للتحقق

🔧 الخطوات الأساسية للحل:
   1. شغّل admins-setup.sql (مرة واحدة فقط)
   2. أضف نفسك كأدمن باستخدام الخطوة 5 أعلاه
   3. شغّل update-rls-policies.sql (مرة واحدة فقط)
   4. سجل خروج وسجل دخول مرة أخرى
   5. جرب إضافة منتج

📞 إذا استمرت المشكلة:
   - شارك نتائج "التقرير الشامل" أعلاه
   - شارك نص الخطأ الكامل من Console
*/


-- ============================================
-- تم الانتهاء من التشخيص! ✅
-- ============================================
