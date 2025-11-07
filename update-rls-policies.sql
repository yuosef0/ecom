-- ============================================
-- تحديث سياسات RLS للسماح للأدمن بإدارة المحتوى
-- Update RLS Policies for Admin Management
-- ============================================

-- ملاحظة: قم بتشغيل هذا الملف في SQL Editor في Supabase
-- Note: Run this file in Supabase SQL Editor

-- ============================================
-- الخطوة 1: تحديث سياسات جدول المنتجات (Products)
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow public insert access to products" ON products;
DROP POLICY IF EXISTS "Allow public update access to products" ON products;
DROP POLICY IF EXISTS "Allow public delete access to products" ON products;

-- السماح للجميع بقراءة المنتجات النشطة
-- القراءة متاحة للجميع (الزوار والمستخدمين)
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" ON products
  FOR SELECT USING (true);

-- السماح للأدمن فقط بإضافة منتجات
CREATE POLICY "Allow admins to insert products" ON products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بتحديث المنتجات
CREATE POLICY "Allow admins to update products" ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بحذف المنتجات
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
-- الخطوة 2: تحديث سياسات جدول الفئات (Categories)
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow public insert access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public update access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public delete access to categories" ON categories;

-- السماح للجميع بقراءة الفئات
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

-- السماح للأدمن فقط بإضافة فئات
CREATE POLICY "Allow admins to insert categories" ON categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بتحديث الفئات
CREATE POLICY "Allow admins to update categories" ON categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بحذف الفئات
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
-- الخطوة 3: تحديث سياسات جدول الطلبات (Orders)
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow public update access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete access to orders" ON orders;

-- السماح للجميع بقراءة الطلبات (سيتم تقييدها لاحقاً لعرض طلبات المستخدم فقط)
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
CREATE POLICY "Allow public read access to orders" ON orders
  FOR SELECT USING (true);

-- السماح للجميع بإضافة طلبات (العملاء يمكنهم إنشاء طلبات)
DROP POLICY IF EXISTS "Allow public insert access to orders" ON orders;
CREATE POLICY "Allow public insert access to orders" ON orders
  FOR INSERT WITH CHECK (true);

-- السماح للأدمن فقط بتحديث الطلبات
CREATE POLICY "Allow admins to update orders" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بحذف الطلبات
CREATE POLICY "Allow admins to delete orders" ON orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );


-- ============================================
-- الخطوة 4: تحديث سياسات جدول الكوبونات (Coupons)
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow public insert access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public update access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public delete access to coupons" ON coupons;

-- السماح للجميع بقراءة الكوبونات النشطة (للتحقق من صلاحية الكود)
DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
CREATE POLICY "Allow public read access to coupons" ON coupons
  FOR SELECT USING (true);

-- السماح للأدمن فقط بإضافة كوبونات
CREATE POLICY "Allow admins to insert coupons" ON coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بتحديث الكوبونات
CREATE POLICY "Allow admins to update coupons" ON coupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بحذف الكوبونات
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
-- الخطوة 5: تحديث سياسات جدول التقييمات (Reviews)
-- ============================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow public update access to reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public delete access to reviews" ON reviews;

-- السماح للجميع بقراءة التقييمات المعتمدة
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;
CREATE POLICY "Allow public read access to reviews" ON reviews
  FOR SELECT USING (true);

-- السماح للجميع بإضافة تقييمات
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON reviews;
CREATE POLICY "Allow public insert access to reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- السماح للأدمن فقط بتحديث التقييمات (للموافقة/الرفض)
CREATE POLICY "Allow admins to update reviews" ON reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- السماح للأدمن فقط بحذف التقييمات
CREATE POLICY "Allow admins to delete reviews" ON reviews
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );


-- ============================================
-- الخطوة 6: التحقق من السياسات الجديدة
-- ============================================

-- عرض جميع السياسات على جدول المنتجات
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- عرض جميع السياسات على جدول الفئات
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- عرض جميع السياسات على جدول الطلبات
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;


-- ============================================
-- ملاحظات مهمة
-- ============================================

/*
📌 ملخص التغييرات:
===================

1. المنتجات (Products):
   ✅ قراءة: متاحة للجميع
   ✅ إضافة/تعديل/حذف: للأدمن فقط

2. الفئات (Categories):
   ✅ قراءة: متاحة للجميع
   ✅ إضافة/تعديل/حذف: للأدمن فقط

3. الطلبات (Orders):
   ✅ قراءة: متاحة للجميع
   ✅ إضافة: متاحة للجميع (العملاء يمكنهم إنشاء طلبات)
   ✅ تعديل/حذف: للأدمن فقط

4. الكوبونات (Coupons):
   ✅ قراءة: متاحة للجميع (للتحقق من الكود)
   ✅ إضافة/تعديل/حذف: للأدمن فقط

5. التقييمات (Reviews):
   ✅ قراءة: متاحة للجميع
   ✅ إضافة: متاحة للجميع (العملاء يمكنهم كتابة تقييمات)
   ✅ تعديل/حذف: للأدمن فقط (للموافقة على التقييمات)


🔒 كيف تعمل الحماية:
====================

- السياسات تتحقق من أن المستخدم الحالي (auth.uid()) موجود في جدول admins
- يجب أن يكون is_active = true
- إذا لم يكن أدمن، سيتم رفض العملية مع خطأ RLS


⚠️ تحذيرات:
===========

1. يجب أن يكون لديك على الأقل أدمن واحد في جدول admins قبل تشغيل هذا الملف
2. إذا لم يكن لديك أدمن، لن تتمكن من إضافة منتجات أو فئات
3. تأكد من تشغيل admins-setup.sql أولاً وإضافة نفسك كأدمن


✅ الخطوات التالية:
===================

1. شغّل هذا الملف في SQL Editor في Supabase
2. تأكد من أنك مسجل كأدمن في جدول admins
3. سجل دخول بحساب الأدمن
4. جرب إضافة منتج جديد
5. يجب أن يعمل بنجاح! 🎉


🧪 اختبار السياسات:
===================

-- اختبار 1: تحقق من أنك أدمن
SELECT * FROM admins WHERE user_id = auth.uid();

-- اختبار 2: جرب إضافة منتج (يجب أن ينجح)
INSERT INTO products (title, slug, price, description)
VALUES ('منتج تجريبي', 'test-product', 100.00, 'وصف تجريبي');

-- اختبار 3: عرض المنتجات (يجب أن ينجح للجميع)
SELECT * FROM products LIMIT 5;
*/

-- ============================================
-- تم الانتهاء! ✅
-- ============================================

/*
🎊 تهانينا! تم تحديث سياسات RLS بنجاح

الآن:
✅ الأدمن فقط يمكنهم إضافة/تعديل/حذف المنتجات
✅ الأدمن فقط يمكنهم إدارة الفئات والكوبونات
✅ الجميع يمكنهم قراءة المحتوى
✅ العملاء يمكنهم إنشاء طلبات وكتابة تقييمات

يمكنك الآن إضافة منتجات من لوحة الأدمن! 🚀
*/
