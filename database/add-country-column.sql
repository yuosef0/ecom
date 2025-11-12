-- ================================================
-- Add Missing 'country' Column to profiles Table
-- إضافة عمود 'country' الناقص لجدول profiles
-- ================================================
-- Run this in Supabase SQL Editor
-- نفذ هذا في Supabase SQL Editor
-- ================================================

-- إضافة عمود country إذا لم يكن موجوداً
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country TEXT;

-- التحقق من الأعمدة في الجدول
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================
-- ✅ بعد التنفيذ يجب أن ترى:
-- - id
-- - full_name
-- - phone
-- - address
-- - city
-- - country  ← هذا العمود الجديد
-- - avatar_url
-- - created_at
-- - updated_at
-- ================================================
