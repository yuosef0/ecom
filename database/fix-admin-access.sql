-- ================================================
-- Fix Admin Access to Orders
-- إصلاح صلاحيات الأدمن للوصول للطلبات
-- ================================================
-- Run this in Supabase SQL Editor
-- نفذ هذا في Supabase SQL Editor
-- ================================================

-- ------------------------------------------------
-- الخطوة 1: إضافة نفسك كـ admin بشكل صحيح
-- ------------------------------------------------

-- احذف أي إدخالات قديمة غير صحيحة (لو موجودة)
DELETE FROM admins WHERE user_id IS NULL;

-- أضف نفسك كـ admin مع user_id الصحيح
-- ⚠️ استبدل 'your-email@example.com' ببريدك الإلكتروني!
INSERT INTO admins (user_id, email, full_name, role, is_active)
SELECT
    id as user_id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    'super_admin' as role,
    true as is_active
FROM auth.users
WHERE email = 'your-email@example.com'  -- ⚠️ غير هنا!
ON CONFLICT (user_id)
DO UPDATE SET
    email = EXCLUDED.email,
    role = 'super_admin',
    is_active = true;

-- ------------------------------------------------
-- الخطوة 2: التحقق من إضافة الأدمن
-- ------------------------------------------------

SELECT
    a.id,
    a.user_id,
    a.email,
    a.role,
    a.is_active,
    u.email as auth_email
FROM admins a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- ================================================
-- ملاحظات مهمة
-- ================================================

/*
الآن يجب أن تعمل صفحة الطلبات بشكل صحيح لأن:

1. ✅ حذفنا الـ policy القديمة "Users can read own orders"
2. ✅ الـ policy "Admins can read all orders" بتستخدم:
   WHERE user_id = auth.uid()
3. ✅ أنت الآن مضاف في جدول admins مع user_id الصحيح

الـ policies اللي شغالة دلوقتي على جدول orders:
- Users can view own orders: للمستخدمين العاديين (يشوفوا طلباتهم بس)
- Users can create orders: أي حد يقدر يعمل طلب
- Admins can read all orders: الأدمن يشوف كل الطلبات
- Admins can update orders: الأدمن يقدر يحدث الطلبات
- Admins can delete orders: الأدمن يقدر يحذف الطلبات (لو موجودة)

⚠️ مهم جداً: لازم تكون مسجل دخول في الموقع بنفس البريد الإلكتروني
   اللي حطيته في الـ SQL عشان تقدر تشوف كل الطلبات!
*/
