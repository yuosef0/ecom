-- حذف جميع السياسات القديمة قبل تطبيق السياسات الجديدة
-- استخدم هذا الملف فقط إذا كنت تريد إعادة تعيين جميع السياسات

-- ============================================
-- حذف سياسات جدول المنتجات (products)
-- ============================================
DROP POLICY IF EXISTS "Allow admins to insert products" ON products;
DROP POLICY IF EXISTS "Allow admins to update products" ON products;
DROP POLICY IF EXISTS "Allow admins to delete products" ON products;
DROP POLICY IF EXISTS "Allow all to read products" ON products;

-- ============================================
-- حذف سياسات جدول الأقسام (categories)
-- ============================================
DROP POLICY IF EXISTS "Allow admins to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow admins to update categories" ON categories;
DROP POLICY IF EXISTS "Allow admins to delete categories" ON categories;
DROP POLICY IF EXISTS "Allow all to read active categories" ON categories;
DROP POLICY IF EXISTS "Allow admins to read all categories" ON categories;

-- ============================================
-- حذف سياسات جدول الطلبات (orders)
-- ============================================
DROP POLICY IF EXISTS "Allow users to insert own orders" ON orders;
DROP POLICY IF EXISTS "Allow admins to insert any order" ON orders;
DROP POLICY IF EXISTS "Allow users to read own orders" ON orders;
DROP POLICY IF EXISTS "Allow admins to read all orders" ON orders;
DROP POLICY IF EXISTS "Allow admins to update orders" ON orders;
DROP POLICY IF EXISTS "Allow admins to delete orders" ON orders;

-- ============================================
-- حذف سياسات جدول السلايدر (slider)
-- ============================================
DROP POLICY IF EXISTS "Allow admins to insert slides" ON slider;
DROP POLICY IF EXISTS "Allow admins to update slides" ON slider;
DROP POLICY IF EXISTS "Allow admins to delete slides" ON slider;
DROP POLICY IF EXISTS "Allow all to read active slides" ON slider;
DROP POLICY IF EXISTS "Allow admins to read all slides" ON slider;

-- ============================================
-- حذف سياسات جدول الكوبونات (coupons)
-- ============================================
DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
DROP POLICY IF EXISTS "Allow users to read active coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to read all coupons" ON coupons;

-- ============================================
-- التحقق من حذف السياسات
-- ============================================
-- يمكنك التحقق من أن السياسات تم حذفها باستخدام:
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('products', 'categories', 'orders', 'slider', 'coupons');
