-- إنشاء جدول admins إذا لم يكن موجوداً
-- نفذ هذا الملف فقط إذا ظهر خطأ "relation admins does not exist"

-- 1. إنشاء جدول admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',  -- super_admin, admin, moderator
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. إنشاء فهرس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- 3. تفعيل Row Level Security على جدول admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات RLS لجدول admins

-- السماح للجميع بقراءة معلومات المسؤولين (للتحقق فقط)
CREATE POLICY "Allow all authenticated users to read active admins"
ON admins
FOR SELECT
TO authenticated
USING (is_active = true);

-- السماح فقط للمسؤولين بإضافة مسؤولين جدد
CREATE POLICY "Allow admins to insert new admins"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
    AND admins.role IN ('super_admin', 'admin')
  )
);

-- السماح فقط للمسؤولين بتحديث بيانات المسؤولين
CREATE POLICY "Allow admins to update admins"
ON admins
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
    AND admins.role IN ('super_admin', 'admin')
  )
);

-- السماح فقط للمسؤولين بحذف مسؤولين
CREATE POLICY "Allow super admins to delete admins"
ON admins
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
    AND admins.role = 'super_admin'
  )
);

-- 5. إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. إنشاء trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. إنشاء view لعرض المسؤولين مع معلوماتهم
CREATE OR REPLACE VIEW admin_users_view AS
SELECT
  a.id,
  a.user_id,
  u.email,
  p.full_name,
  a.role,
  a.is_active,
  a.created_at,
  a.updated_at
FROM admins a
JOIN auth.users u ON u.id = a.user_id
LEFT JOIN profiles p ON p.id = a.user_id
WHERE a.is_active = true
ORDER BY a.created_at DESC;

-- 8. التحقق من إنشاء الجدول بنجاح
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- ملاحظة:
-- بعد إنشاء الجدول، ستحتاج إلى إضافة نفسك كمسؤول أول يدوياً
-- باستخدام service role key في Supabase SQL Editor:

-- مثال (استبدل البريد الإلكتروني):
-- INSERT INTO admins (user_id, role, is_active)
-- SELECT id, 'super_admin', true
-- FROM auth.users
-- WHERE email = 'your-email@example.com';
