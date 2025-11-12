-- ================================================
-- Create Profiles Table
-- إنشاء جدول الملفات الشخصية للمستخدمين
-- ================================================
-- Run this in Supabase SQL Editor
-- نفذ هذا في Supabase SQL Editor
-- ================================================

-- ------------------------------------------------
-- إنشاء جدول profiles
-- ------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';

-- ------------------------------------------------
-- إنشاء trigger لتحديث updated_at تلقائياً
-- ------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- حذف الـ trigger لو موجود وإعادة إنشائه
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------
-- Row Level Security (RLS) Policies
-- ------------------------------------------------

-- تفعيل RLS على الجدول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- حذف الـ policies القديمة لو موجودة
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- المستخدمون يمكنهم رؤية ملفهم الشخصي فقط
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- المستخدمون يمكنهم إنشاء ملفهم الشخصي
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- المستخدمون يمكنهم تحديث ملفهم الشخصي
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------
-- التحقق من النتيجة
-- ------------------------------------------------

-- عرض معلومات الجدول
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- عرض الـ policies
SELECT
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY policyname;

-- ================================================
-- ملاحظات
-- ================================================

/*
✅ بعد تنفيذ هذا الـ SQL:

1. جدول profiles سيكون جاهزاً للاستخدام
2. كل مستخدم يمكنه رؤية وتعديل ملفه الشخصي فقط
3. الـ updated_at سيتحدث تلقائياً عند أي تعديل
4. الجدول مرتبط بـ auth.users (الـ id هو نفس id المستخدم)

📝 لإنشاء profile للمستخدم الحالي:
INSERT INTO profiles (id, full_name, phone, address, city, country)
VALUES (
    auth.uid(),  -- معرف المستخدم الحالي
    'الاسم الكامل',
    'رقم الهاتف',
    'العنوان',
    'المدينة',
    'البلد'
)
ON CONFLICT (id) DO NOTHING;
*/
