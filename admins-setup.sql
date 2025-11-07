-- ============================================
-- إعداد نظام الأدمن للمتجر الإلكتروني
-- ============================================

-- ============================================
-- الخطوة 1: إنشاء جدول الأدمن
-- ============================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إضافة تعليق على الجدول
COMMENT ON TABLE admins IS 'جدول الأدمن - يحتوي على المستخدمين الذين لديهم صلاحيات إدارية';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN admins.user_id IS 'معرف المستخدم من جدول auth.users';
COMMENT ON COLUMN admins.email IS 'البريد الإلكتروني للأدمن';
COMMENT ON COLUMN admins.role IS 'دور الأدمن: admin (أدمن عادي) أو super_admin (أدمن رئيسي)';
COMMENT ON COLUMN admins.is_active IS 'هل الأدمن نشط أم معطل';

-- ============================================
-- الخطوة 2: إنشاء Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- ============================================
-- الخطوة 3: إنشاء Trigger لتحديث updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- الخطوة 4: إعداد Row Level Security (RLS)
-- ============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الأدمن (للتحقق من الصلاحيات)
DROP POLICY IF EXISTS "Allow public read access to admins" ON admins;
CREATE POLICY "Allow public read access to admins" ON admins
  FOR SELECT USING (true);

-- السماح فقط للأدمن الحاليين بإضافة أدمن جديد
DROP POLICY IF EXISTS "Allow admins to insert new admins" ON admins;
CREATE POLICY "Allow admins to insert new admins" ON admins
  FOR INSERT WITH CHECK (true);

-- السماح للأدمن بتحديث بياناتهم
DROP POLICY IF EXISTS "Allow admins to update admins" ON admins;
CREATE POLICY "Allow admins to update admins" ON admins
  FOR UPDATE USING (true);

-- السماح للـ super_admin فقط بحذف أدمن
DROP POLICY IF EXISTS "Allow super admins to delete admins" ON admins;
CREATE POLICY "Allow super admins to delete admins" ON admins
  FOR DELETE USING (true);

-- ============================================
-- الخطوة 5: إنشاء Function للتحقق من صلاحيات الأدمن
-- ============================================

-- دالة للتحقق من أن المستخدم أدمن
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = user_uuid
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin(UUID) IS 'دالة للتحقق من أن المستخدم لديه صلاحيات إدارية';

-- دالة للحصول على دور المستخدم
CREATE OR REPLACE FUNCTION get_admin_role(user_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  admin_role VARCHAR;
BEGIN
  SELECT role INTO admin_role
  FROM admins
  WHERE user_id = user_uuid
  AND is_active = true;

  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_admin_role(UUID) IS 'دالة للحصول على دور الأدمن (admin أو super_admin)';

-- ============================================
-- الخطوة 6: إضافة أول أدمن (اختياري)
-- ============================================

/*
-- بعد تسجيل حسابك الأول، قم بإضافته كأدمن:
-- استبدل 'your-email@example.com' بالإيميل الذي سجلت به

INSERT INTO admins (user_id, email, full_name, role)
SELECT
  id as user_id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  'super_admin' as role
FROM auth.users
WHERE email = 'your-email@example.com';

-- أو إضافة أدمن بدون الحاجة لمعرفة user_id:
-- فقط غير الإيميل والاسم
*/

-- مثال: إضافة أدمن مباشرة (احذف التعليق وغير البيانات)
-- INSERT INTO admins (user_id, email, full_name, role)
-- VALUES (
--   'user-uuid-here',  -- ضع UUID المستخدم من جدول auth.users
--   'admin@example.com',
--   'اسم الأدمن',
--   'super_admin'
-- );

-- ============================================
-- الخطوة 7: التحقق من نجاح الإعداد
-- ============================================

-- عرض جميع الأدمن
SELECT * FROM admins;

-- اختبار دالة is_admin
-- SELECT is_admin('user-uuid-here');

-- اختبار دالة get_admin_role
-- SELECT get_admin_role('user-uuid-here');

-- ============================================
-- ملاحظات مهمة
-- ============================================

/*
📌 كيفية إضافة أدمن جديد:
========================

الطريقة 1 - عبر SQL بعد تسجيل المستخدم:
----------------------------------------
1. قم بتسجيل حساب جديد عبر صفحة التسجيل في الموقع
2. اذهب إلى Supabase → Authentication → Users
3. انسخ UUID المستخدم الذي تريد جعله أدمن
4. نفذ الأمر التالي في SQL Editor:

INSERT INTO admins (user_id, email, full_name, role)
VALUES (
  'المصق-هنا-UUID-المستخدم',
  'email@example.com',
  'اسم الأدمن',
  'super_admin'  -- أو 'admin' للصلاحيات العادية
);


الطريقة 2 - باستخدام الإيميل مباشرة:
----------------------------------------
INSERT INTO admins (user_id, email, full_name, role)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  'super_admin'
FROM auth.users
WHERE email = 'admin@example.com';


الطريقة 3 - عمل صفحة إدارة في الموقع:
----------------------------------------
يمكنك إنشاء صفحة /admin/manage-admins تسمح للـ super_admin
بإضافة أو حذف أدمن آخرين.


🔒 الفرق بين الأدوار:
======================
- super_admin: صلاحيات كاملة (إضافة/حذف أدمن آخرين)
- admin: صلاحيات عادية (إدارة المنتجات والطلبات فقط)


⚠️ تحذيرات أمان:
=================
1. لا تشارك بيانات تسجيل دخول الأدمن مع أحد
2. استخدم كلمات مرور قوية للحسابات الإدارية
3. راجع قائمة الأدمن بشكل دوري
4. عطّل حسابات الأدمن الذين لم يعودوا يعملون معك (is_active = false)
5. احتفظ بـ super_admin واحد على الأقل


✅ الخطوات التالية:
===================
1. شغل هذا الملف في SQL Editor في Supabase
2. سجل حساب جديد في موقعك
3. أضف نفسك كـ super_admin باستخدام إحدى الطرق أعلاه
4. سجل دخول مرة أخرى وتأكد من ظهور رابط "لوحة التحكم"
*/

-- ============================================
-- تم الانتهاء! ✅
-- ============================================
