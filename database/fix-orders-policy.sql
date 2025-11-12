-- ================================================
-- Fix Orders RLS Policies
-- إصلاح سياسات RLS لجدول الطلبات
-- ================================================
-- Run this in Supabase SQL Editor
-- نفذ هذا في Supabase SQL Editor
-- ================================================

-- ------------------------------------------------
-- حذف الـ policy القديمة التي تسبب مشكلة
-- ------------------------------------------------

DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- ------------------------------------------------
-- إنشاء policy جديدة باستخدام auth.email()
-- ------------------------------------------------

-- المستخدمون يمكنهم رؤية طلباتهم الخاصة (باستخدام auth.email() بدلاً من SELECT من auth.users)
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    TO authenticated
    USING (customer_email = auth.email());

-- ------------------------------------------------
-- التحقق من الـ policies
-- ------------------------------------------------

-- عرض جميع الـ policies على جدول orders
SELECT
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE tablename = 'orders'
AND schemaname = 'public'
ORDER BY policyname;

-- ================================================
-- ملاحظات مهمة
-- ================================================

/*
المشكلة:
- الـ policy القديمة كانت تستخدم:
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
- هذا يسبب خطأ "permission denied for table users"

الحل:
- استخدام auth.email() مباشرة بدلاً من SELECT من auth.users
- auth.email() هي دالة آمنة توفرها Supabase للحصول على بريد المستخدم الحالي

الآن يجب أن تعمل الـ policies بشكل صحيح:
1. المستخدمون العاديون: يرون طلباتهم فقط
2. المسؤولون (في جدول admins): يرون جميع الطلبات
*/
