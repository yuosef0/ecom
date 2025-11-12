-- سياسات أمان شاملة لجميع جداول لوحة التحكم
-- يجب تطبيق هذه السياسات في Supabase SQL Editor

-- ============================================
-- 1. سياسات جدول المنتجات (products)
-- ============================================

-- السماح للمسؤولين بإضافة منتجات
CREATE POLICY "Allow admins to insert products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بتحديث المنتجات
CREATE POLICY "Allow admins to update products"
ON products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بحذف المنتجات
CREATE POLICY "Allow admins to delete products"
ON products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للجميع بقراءة المنتجات
CREATE POLICY "Allow all to read products"
ON products
FOR SELECT
TO public
USING (true);

-- ============================================
-- 2. سياسات جدول الأقسام (categories)
-- ============================================

-- السماح للمسؤولين بإضافة أقسام
CREATE POLICY "Allow admins to insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بتحديث الأقسام
CREATE POLICY "Allow admins to update categories"
ON categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بحذف الأقسام
CREATE POLICY "Allow admins to delete categories"
ON categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للجميع بقراءة الأقسام النشطة
CREATE POLICY "Allow all to read active categories"
ON categories
FOR SELECT
TO public
USING (is_active = true);

-- السماح للمسؤولين بقراءة جميع الأقسام
CREATE POLICY "Allow admins to read all categories"
ON categories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================
-- 3. سياسات جدول الطلبات (orders)
-- ============================================

-- السماح للمستخدمين بإضافة طلباتهم
CREATE POLICY "Allow users to insert own orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- السماح للمسؤولين بإضافة أي طلب
CREATE POLICY "Allow admins to insert any order"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمستخدمين بقراءة طلباتهم فقط
CREATE POLICY "Allow users to read own orders"
ON orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- السماح للمسؤولين بقراءة جميع الطلبات
CREATE POLICY "Allow admins to read all orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بتحديث أي طلب
CREATE POLICY "Allow admins to update orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بحذف الطلبات
CREATE POLICY "Allow admins to delete orders"
ON orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================
-- 4. سياسات جدول السلايدر (slider)
-- ============================================

-- السماح للمسؤولين بإضافة شرائح
CREATE POLICY "Allow admins to insert slides"
ON slider
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بتحديث الشرائح
CREATE POLICY "Allow admins to update slides"
ON slider
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بحذف الشرائح
CREATE POLICY "Allow admins to delete slides"
ON slider
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للجميع بقراءة الشرائح النشطة
CREATE POLICY "Allow all to read active slides"
ON slider
FOR SELECT
TO public
USING (is_active = true);

-- السماح للمسؤولين بقراءة جميع الشرائح
CREATE POLICY "Allow admins to read all slides"
ON slider
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================
-- 5. سياسات جدول الكوبونات (coupons)
-- ============================================

-- السماح للمسؤولين بإضافة كوبونات
CREATE POLICY "Allow admins to insert coupons"
ON coupons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بتحديث الكوبونات
CREATE POLICY "Allow admins to update coupons"
ON coupons
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمسؤولين بحذف الكوبونات
CREATE POLICY "Allow admins to delete coupons"
ON coupons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- السماح للمستخدمين بقراءة الكوبونات النشطة
CREATE POLICY "Allow users to read active coupons"
ON coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- السماح للمسؤولين بقراءة جميع الكوبونات
CREATE POLICY "Allow admins to read all coupons"
ON coupons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================
-- ملاحظات هامة:
-- ============================================
-- 1. تأكد من وجود عمود is_admin في جدول profiles قبل تطبيق هذه السياسات
-- 2. قد تحتاج لحذف السياسات القديمة أولاً إذا كانت موجودة
-- 3. بعض الجداول قد لا تحتوي على عمود is_active، قم بتعديل السياسات حسب الحاجة
