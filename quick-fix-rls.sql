-- ============================================
-- 🚀 الحل السريع الكامل لمشكلة RLS
-- Quick Fix for "new row violates row-level security policy"
-- ============================================

-- ⚠️ تحذير: قم بتشغيل هذه الأوامر واحداً تلو الآخر
-- Warning: Run these commands one by one

-- ============================================
-- ✅ الخطوة 1: إنشاء جدول admins (إذا لم يكن موجوداً)
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

-- إنشاء Index
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- تفعيل RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة
DROP POLICY IF EXISTS "Allow public read access to admins" ON admins;
CREATE POLICY "Allow public read access to admins" ON admins
  FOR SELECT USING (true);

-- سياسة الإضافة
DROP POLICY IF EXISTS "Allow admins to insert new admins" ON admins;
CREATE POLICY "Allow admins to insert new admins" ON admins
  FOR INSERT WITH CHECK (true);

-- سياسة التحديث
DROP POLICY IF EXISTS "Allow admins to update admins" ON admins;
CREATE POLICY "Allow admins to update admins" ON admins
  FOR UPDATE USING (true);

-- سياسة الحذف
DROP POLICY IF EXISTS "Allow super admins to delete admins" ON admins;
CREATE POLICY "Allow super admins to delete admins" ON admins
  FOR DELETE USING (true);


-- ============================================
-- ✅ الخطوة 2: إضافة نفسك كأدمن
-- ============================================

-- ⚠️ استبدل 'YOUR-EMAIL@EXAMPLE.COM' ببريدك الإلكتروني الذي سجلت به
-- ⚠️ Replace 'YOUR-EMAIL@EXAMPLE.COM' with your actual email

INSERT INTO admins (user_id, email, full_name, role)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  'super_admin'
FROM auth.users
WHERE email = 'YOUR-EMAIL@EXAMPLE.COM'
ON CONFLICT (user_id) DO UPDATE
SET
  is_active = true,
  role = 'super_admin',
  updated_at = NOW();

-- ✅ إذا نجح: Success. Rows returned: 1
-- ❌ إذا فشل: تحقق من البريد الإلكتروني


-- ============================================
-- ✅ الخطوة 3: تحديث سياسات products
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow public insert access to products" ON products;
DROP POLICY IF EXISTS "Allow public update access to products" ON products;
DROP POLICY IF EXISTS "Allow public delete access to products" ON products;

-- إعادة إنشاء سياسة القراءة
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" ON products
  FOR SELECT USING (true);

-- سياسة الإضافة (للأدمن فقط)
CREATE POLICY "Allow admins to insert products" ON products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسة التحديث (للأدمن فقط)
CREATE POLICY "Allow admins to update products" ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسة الحذف (للأدمن فقط)
CREATE POLICY "Allow admins to delete products" ON products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );


-- ============================================
-- ✅ الخطوة 4: تحديث سياسات categories
-- ============================================

DROP POLICY IF EXISTS "Allow public insert access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public update access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public delete access to categories" ON categories;

DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to insert categories" ON categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Allow admins to update categories" ON categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Allow admins to delete categories" ON categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );


-- ============================================
-- ✅ الخطوة 5: تحديث سياسات coupons
-- ============================================

DROP POLICY IF EXISTS "Allow public insert access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public update access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public delete access to coupons" ON coupons;

DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
CREATE POLICY "Allow public read access to coupons" ON coupons
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to insert coupons" ON coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Allow admins to update coupons" ON coupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Allow admins to delete coupons" ON coupons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );


-- ============================================
-- ✅ الخطوة 6: التحقق من النجاح
-- ============================================

-- التحقق من أنك مسجل كأدمن
SELECT
  email,
  role,
  is_active,
  'أنت الآن أدمن! ✅' AS status
FROM admins
WHERE user_id = auth.uid();

-- التحقق من السياسات
SELECT
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('products', 'categories', 'coupons')
ORDER BY tablename, cmd;


-- ============================================
-- 📋 التعليمات النهائية
-- ============================================

/*
✅ بعد تشغيل هذا الملف:

1. تحقق من ظهور بياناتك في "التحقق من أنك مسجل كأدمن" أعلاه
2. سجل خروج من الموقع
3. سجل دخول مرة أخرى
4. اذهب إلى لوحة الأدمن
5. جرب إضافة منتج
6. يجب أن يعمل الآن! 🎉

❌ إذا استمرت المشكلة:
1. تأكد من تغيير 'YOUR-EMAIL@EXAMPLE.COM' في الخطوة 2
2. تأكد من تسجيل دخولك بنفس البريد الإلكتروني
3. امسح cache المتصفح (Ctrl+Shift+R)
4. شغّل diagnose-rls-issue.sql وشارك النتائج

⚠️ ملاحظات مهمة:
- استخدم بريدك الإلكتروني الذي سجلت به في الموقع
- تأكد من تسجيل الدخول قبل محاولة إضافة منتج
- إذا كانت المشكلة في رفع الصور، تحتاج لإعداد Storage في Supabase
*/

-- ============================================
-- تم الانتهاء! ✅
-- ============================================
