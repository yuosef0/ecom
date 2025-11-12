-- ================================================
-- Setup First Admin User
-- إعداد أول مسؤول في النظام
-- ================================================
-- Run this AFTER complete-schema.sql
-- نفذ هذا بعد تنفيذ complete-schema.sql
-- ================================================

-- ⚠️ IMPORTANT: Replace 'your-email@example.com' with your actual email
-- ⚠️ مهم: استبدل 'your-email@example.com' ببريدك الإلكتروني الفعلي

-- ------------------------------------------------
-- STEP 1: Verify user exists
-- الخطوة 1: تحقق من وجود المستخدم
-- ------------------------------------------------

-- Check if user exists in auth.users
SELECT
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'your-email@example.com';

-- If no results, you need to sign up first:
-- إذا لم تظهر نتائج، يجب التسجيل أولاً:
-- 1. Go to your app: http://localhost:3000/signup
-- 2. Sign up with your email
-- 3. Then run this script again

-- ------------------------------------------------
-- STEP 2: Add user as Super Admin
-- الخطوة 2: إضافة المستخدم كمسؤول رئيسي
-- ------------------------------------------------

INSERT INTO admins (user_id, email, full_name, role, is_active, created_at, updated_at)
SELECT
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        'Super Admin'
    ),
    'super_admin',
    true,
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE
SET
    is_active = true,
    role = 'super_admin',
    email = EXCLUDED.email,
    updated_at = NOW();

-- ------------------------------------------------
-- STEP 3: Create profile if not exists
-- الخطوة 3: إنشاء ملف شخصي إذا لم يكن موجوداً
-- ------------------------------------------------

INSERT INTO profiles (id, full_name, created_at, updated_at)
SELECT
    id,
    COALESCE(
        raw_user_meta_data->>'full_name',
        'Admin User'
    ),
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE
SET
    updated_at = NOW();

-- ------------------------------------------------
-- STEP 4: Verify setup
-- الخطوة 4: التحقق من الإعداد
-- ------------------------------------------------

-- Check admin status
SELECT
    a.id,
    a.email,
    a.full_name,
    a.role,
    a.is_active,
    u.email as auth_email,
    a.created_at
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.email = 'your-email@example.com';

-- Expected result / النتيجة المتوقعة:
-- ✅ role: super_admin
-- ✅ is_active: true
-- ✅ email: your email

-- ------------------------------------------------
-- STEP 5: Test admin permissions
-- الخطوة 5: اختبار صلاحيات المسؤول
-- ------------------------------------------------

-- Test if you can view all data (should work as admin)
SELECT COUNT(*) as admin_check
FROM admins
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
AND is_active = true;

-- Result should be 1
-- النتيجة يجب أن تكون 1

-- ================================================
-- OPTIONAL: Add more admins
-- اختياري: إضافة مسؤولين آخرين
-- ================================================

/*
-- Add another admin (not super_admin)
INSERT INTO admins (user_id, email, full_name, role, is_active)
SELECT
    id,
    email,
    'Admin Name',
    'admin',  -- or 'moderator'
    true
FROM auth.users
WHERE email = 'another-admin@example.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = true, updated_at = NOW();
*/

-- ================================================
-- TROUBLESHOOTING
-- استكشاف الأخطاء
-- ================================================

/*
-- Problem: User not found
-- المشكلة: المستخدم غير موجود

Solution:
1. Sign up at /signup first
2. Check auth.users table:
   SELECT * FROM auth.users;
3. Use the correct email
*/

/*
-- Problem: "duplicate key value violates unique constraint"
-- المشكلة: "المفتاح مكرر"

Solution: User already exists in admins table
-- الحل: المستخدم موجود بالفعل في جدول admins

-- Update existing admin:
UPDATE admins
SET is_active = true, role = 'super_admin', updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
*/

/*
-- Problem: Permission denied / RLS blocking
-- المشكلة: صلاحيات غير كافية

Solution: Run this with service_role key or in Supabase SQL Editor
-- الحل: نفذ هذا باستخدام service_role key أو في Supabase SQL Editor
*/

-- ================================================
-- CLEANUP (if needed)
-- تنظيف (إذا لزم الأمر)
-- ================================================

/*
-- Remove admin status (be careful!)
DELETE FROM admins
WHERE email = 'email-to-remove@example.com';

-- Deactivate admin (safer)
UPDATE admins
SET is_active = false
WHERE email = 'email-to-deactivate@example.com';
*/

-- ================================================
-- DONE! 🎉
-- تم! 🎉
-- ================================================

-- You can now:
-- يمكنك الآن:
-- 1. Login to your app / تسجيل الدخول للتطبيق
-- 2. Access admin panel at /admin / الوصول للوحة الإدارة على /admin
-- 3. Manage products, categories, orders, etc. / إدارة المنتجات، الأقسام، الطلبات، إلخ

-- ================================================
-- Next Steps
-- الخطوات التالية
-- ================================================

-- 1. Create Storage Buckets in Supabase Dashboard:
--    - products-imges
--    - category-images
--    - slider-images
--    - avatars

-- 2. Add sample data (optional):
--    - Categories
--    - Products
--    - Slider images

-- 3. Test the application:
--    - Try creating a product
--    - Try creating a category
--    - Try viewing orders

-- 4. Configure environment variables:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
