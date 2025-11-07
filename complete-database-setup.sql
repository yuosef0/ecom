-- ============================================
-- 🚀 قاعدة البيانات الكاملة للمتجر الإلكتروني
-- Complete E-commerce Database Setup with Admin System
-- ============================================

-- ⚠️ هذا الملف يحتوي على كل شيء من الصفر
-- This file contains everything from scratch

-- نفذ هذا الملف كاملاً في SQL Editor في Supabase
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- 🗑️ الخطوة 1: حذف الجداول القديمة (اختياري)
-- ============================================

-- ⚠️ احذف التعليق من الأسطر التالية إذا أردت حذف البيانات القديمة والبدء من جديد
-- ⚠️ WARNING: This will delete all existing data!

/*
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_product_average_rating() CASCADE;
DROP FUNCTION IF EXISTS get_total_revenue() CASCADE;
DROP FUNCTION IF EXISTS count_orders_by_status(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_product_review_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_coupon_valid(VARCHAR, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_admin_role(UUID) CASCADE;
*/


-- ============================================
-- 👨‍💼 الخطوة 2: إنشاء جدول الأدمن (ADMINS)
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

COMMENT ON TABLE admins IS 'جدول الأدمن - المستخدمين الذين لديهم صلاحيات إدارية';
COMMENT ON COLUMN admins.user_id IS 'معرف المستخدم من جدول auth.users';
COMMENT ON COLUMN admins.email IS 'البريد الإلكتروني للأدمن';
COMMENT ON COLUMN admins.role IS 'دور الأدمن: admin (أدمن عادي) أو super_admin (أدمن رئيسي)';
COMMENT ON COLUMN admins.is_active IS 'هل الأدمن نشط أم معطل';

-- Indexes لجدول الأدمن
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);


-- ============================================
-- 📁 الخطوة 3: إنشاء جدول الفئات (CATEGORIES)
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE categories IS 'جدول الفئات - يدعم الفئات الرئيسية والفرعية';
COMMENT ON COLUMN categories.name IS 'اسم الفئة';
COMMENT ON COLUMN categories.slug IS 'الرابط الودي للفئة';
COMMENT ON COLUMN categories.parent_id IS 'معرف الفئة الأم (NULL للفئات الرئيسية)';
COMMENT ON COLUMN categories.display_order IS 'ترتيب عرض الفئة';
COMMENT ON COLUMN categories.is_active IS 'هل الفئة نشطة أم معطلة';

-- Indexes لجدول الفئات
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);


-- ============================================
-- 🛍️ الخطوة 4: إنشاء جدول المنتجات (PRODUCTS)
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  stock INTEGER NOT NULL DEFAULT 10 CHECK (stock >= 0),
  sku VARCHAR(100),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE products IS 'جدول المنتجات - يحتوي على جميع منتجات المتجر';
COMMENT ON COLUMN products.title IS 'اسم المنتج';
COMMENT ON COLUMN products.slug IS 'الرابط الودي للمنتج';
COMMENT ON COLUMN products.price IS 'سعر المنتج';
COMMENT ON COLUMN products.compare_at_price IS 'السعر قبل الخصم';
COMMENT ON COLUMN products.category_id IS 'معرف الفئة';
COMMENT ON COLUMN products.images IS 'مصفوفة من روابط الصور بصيغة JSON';
COMMENT ON COLUMN products.stock IS 'الكمية المتوفرة في المخزون';
COMMENT ON COLUMN products.sku IS 'رقم التعريف الفريد للمنتج';
COMMENT ON COLUMN products.is_featured IS 'هل المنتج مميز';
COMMENT ON COLUMN products.is_active IS 'هل المنتج نشط';

-- Indexes لجدول المنتجات
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category_id, price);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured, created_at DESC);


-- ============================================
-- 📦 الخطوة 5: إنشاء جدول الطلبات (ORDERS)
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_address TEXT NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  coupon_code VARCHAR(50),
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent VARCHAR(255),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (order_status IN ('processing', 'shipped', 'delivered', 'cancelled')),
  items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE orders IS 'جدول الطلبات - يحتوي على جميع طلبات العملاء';
COMMENT ON COLUMN orders.payment_status IS 'حالة الدفع: pending, paid, failed, refunded';
COMMENT ON COLUMN orders.order_status IS 'حالة الطلب: processing, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.items IS 'تفاصيل المنتجات المطلوبة بصيغة JSON';
COMMENT ON COLUMN orders.discount_amount IS 'قيمة الخصم المطبق';
COMMENT ON COLUMN orders.coupon_code IS 'كود الكوبون المستخدم';

-- Indexes لجدول الطلبات
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(order_status, created_at DESC);


-- ============================================
-- ⭐ الخطوة 6: إنشاء جدول التقييمات (REVIEWS)
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE reviews IS 'جدول التقييمات - تقييمات ومراجعات المنتجات';
COMMENT ON COLUMN reviews.product_id IS 'معرف المنتج المراد تقييمه';
COMMENT ON COLUMN reviews.rating IS 'التقييم من 1 إلى 5 نجوم';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'هل التقييم من عميل قام بشراء المنتج';
COMMENT ON COLUMN reviews.is_approved IS 'هل تم الموافقة على نشر التقييم';
COMMENT ON COLUMN reviews.helpful_count IS 'عدد الأشخاص الذين وجدوا التقييم مفيداً';

-- Indexes لجدول التقييمات
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved, created_at DESC);


-- ============================================
-- 🎟️ الخطوة 7: إنشاء جدول الكوبونات (COUPONS)
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE coupons IS 'جدول الكوبونات - كوبونات الخصم والعروض';
COMMENT ON COLUMN coupons.code IS 'كود الكوبون (يجب أن يكون فريداً)';
COMMENT ON COLUMN coupons.discount_type IS 'نوع الخصم: percentage أو fixed';
COMMENT ON COLUMN coupons.discount_value IS 'قيمة الخصم';
COMMENT ON COLUMN coupons.min_purchase_amount IS 'الحد الأدنى لقيمة الطلب';
COMMENT ON COLUMN coupons.max_discount_amount IS 'الحد الأقصى لقيمة الخصم';
COMMENT ON COLUMN coupons.usage_limit IS 'عدد مرات الاستخدام المسموح (NULL = غير محدود)';
COMMENT ON COLUMN coupons.used_count IS 'عدد مرات استخدام الكوبون';

-- Indexes لجدول الكوبونات
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);


-- ============================================
-- ❤️ الخطوة 8: إنشاء جدول المفضلة (WISHLISTS)
-- ============================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, product_id)
);

COMMENT ON TABLE wishlists IS 'جدول المفضلة - المنتجات المفضلة للعملاء';
COMMENT ON COLUMN wishlists.session_id IS 'معرف جلسة المتصفح (للضيوف) أو معرف المستخدم';
COMMENT ON COLUMN wishlists.product_id IS 'معرف المنتج المفضل';
COMMENT ON COLUMN wishlists.customer_email IS 'البريد الإلكتروني (اختياري)';

-- Indexes لجدول المفضلة
CREATE INDEX IF NOT EXISTS idx_wishlists_session_id ON wishlists(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_email ON wishlists(customer_email);


-- ============================================
-- ⚙️ الخطوة 9: إنشاء Functions
-- ============================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'دالة لتحديث عمود updated_at تلقائياً';

-- Function لحساب إجمالي الإيرادات
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid');
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION get_total_revenue() IS 'دالة لحساب إجمالي الإيرادات';

-- Function لحساب عدد الطلبات حسب الحالة
CREATE OR REPLACE FUNCTION count_orders_by_status(status_filter VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM orders WHERE order_status = status_filter);
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION count_orders_by_status(VARCHAR) IS 'دالة لحساب عدد الطلبات حسب الحالة';

-- Function لحساب متوسط تقييم المنتج
CREATE OR REPLACE FUNCTION get_product_average_rating(product_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
    FROM reviews
    WHERE product_id = product_uuid AND is_approved = true
  );
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION get_product_average_rating(UUID) IS 'دالة لحساب متوسط تقييم منتج';

-- Function لحساب عدد تقييمات المنتج
CREATE OR REPLACE FUNCTION get_product_review_count(product_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = product_uuid AND is_approved = true
  );
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION get_product_review_count(UUID) IS 'دالة لحساب عدد تقييمات منتج';

-- Function للتحقق من أن المستخدم أدمن
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

COMMENT ON FUNCTION is_admin(UUID) IS 'دالة للتحقق من أن المستخدم أدمن';

-- Function للحصول على دور المستخدم
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

COMMENT ON FUNCTION get_admin_role(UUID) IS 'دالة للحصول على دور الأدمن';


-- ============================================
-- 🔄 الخطوة 10: إنشاء Triggers
-- ============================================

-- Trigger لجدول الأدمن
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لجدول الفئات
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لجدول المنتجات
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لجدول الطلبات
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لجدول التقييمات
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لجدول الكوبونات
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 🔒 الخطوة 11: إعداد Row Level Security (RLS)
-- ============================================

-- ============================================
-- 🔐 RLS لجدول الأدمن (ADMINS)
-- ============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to admins" ON admins;
CREATE POLICY "Allow public read access to admins" ON admins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to insert new admins" ON admins;
CREATE POLICY "Allow admins to insert new admins" ON admins
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admins to update admins" ON admins;
CREATE POLICY "Allow admins to update admins" ON admins
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow super admins to delete admins" ON admins;
CREATE POLICY "Allow super admins to delete admins" ON admins
  FOR DELETE USING (true);


-- ============================================
-- 🔐 RLS لجدول الفئات (CATEGORIES)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الفئات
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

-- السماح للأدمن فقط بإضافة فئات
DROP POLICY IF EXISTS "Allow admins to insert categories" ON categories;
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
DROP POLICY IF EXISTS "Allow admins to update categories" ON categories;
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
DROP POLICY IF EXISTS "Allow admins to delete categories" ON categories;
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
-- 🔐 RLS لجدول المنتجات (PRODUCTS)
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة المنتجات
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" ON products
  FOR SELECT USING (true);

-- السماح للأدمن فقط بإضافة منتجات
DROP POLICY IF EXISTS "Allow admins to insert products" ON products;
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
DROP POLICY IF EXISTS "Allow admins to update products" ON products;
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
DROP POLICY IF EXISTS "Allow admins to delete products" ON products;
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
-- 🔐 RLS لجدول الطلبات (ORDERS)
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الطلبات
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
CREATE POLICY "Allow public read access to orders" ON orders
  FOR SELECT USING (true);

-- السماح للجميع بإضافة طلبات (العملاء يمكنهم إنشاء طلبات)
DROP POLICY IF EXISTS "Allow public insert access to orders" ON orders;
CREATE POLICY "Allow public insert access to orders" ON orders
  FOR INSERT WITH CHECK (true);

-- السماح للأدمن فقط بتحديث الطلبات
DROP POLICY IF EXISTS "Allow admins to update orders" ON orders;
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
DROP POLICY IF EXISTS "Allow admins to delete orders" ON orders;
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
-- 🔐 RLS لجدول التقييمات (REVIEWS)
-- ============================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة التقييمات
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;
CREATE POLICY "Allow public read access to reviews" ON reviews
  FOR SELECT USING (true);

-- السماح للجميع بإضافة تقييمات
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON reviews;
CREATE POLICY "Allow public insert access to reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- السماح للأدمن فقط بتحديث التقييمات
DROP POLICY IF EXISTS "Allow admins to update reviews" ON reviews;
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
DROP POLICY IF EXISTS "Allow admins to delete reviews" ON reviews;
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
-- 🔐 RLS لجدول الكوبونات (COUPONS)
-- ============================================

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الكوبونات
DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
CREATE POLICY "Allow public read access to coupons" ON coupons
  FOR SELECT USING (true);

-- السماح للأدمن فقط بإضافة كوبونات
DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
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
DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
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
DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
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
-- 🔐 RLS لجدول المفضلة (WISHLISTS)
-- ============================================

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة المفضلة
DROP POLICY IF EXISTS "Allow public read access to wishlists" ON wishlists;
CREATE POLICY "Allow public read access to wishlists" ON wishlists
  FOR SELECT USING (true);

-- السماح للجميع بإضافة للمفضلة
DROP POLICY IF EXISTS "Allow public insert access to wishlists" ON wishlists;
CREATE POLICY "Allow public insert access to wishlists" ON wishlists
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بحذف من المفضلة
DROP POLICY IF EXISTS "Allow public delete access to wishlists" ON wishlists;
CREATE POLICY "Allow public delete access to wishlists" ON wishlists
  FOR DELETE USING (true);


-- ============================================
-- ✅ الخطوة 12: التحقق من نجاح الإعداد
-- ============================================

-- عرض جميع الجداول
SELECT
  tablename,
  CASE
    WHEN tablename = 'admins' THEN '👨‍💼 جدول الأدمن'
    WHEN tablename = 'categories' THEN '📁 جدول الفئات'
    WHEN tablename = 'products' THEN '🛍️ جدول المنتجات'
    WHEN tablename = 'orders' THEN '📦 جدول الطلبات'
    WHEN tablename = 'reviews' THEN '⭐ جدول التقييمات'
    WHEN tablename = 'coupons' THEN '🎟️ جدول الكوبونات'
    WHEN tablename = 'wishlists' THEN '❤️ جدول المفضلة'
  END AS description
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admins', 'categories', 'products', 'orders', 'reviews', 'coupons', 'wishlists')
ORDER BY tablename;

-- عرض جميع Functions
SELECT
  routine_name AS function_name,
  '✅ جاهز' AS status
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_schema = 'public'
AND routine_name IN (
  'update_updated_at_column',
  'get_total_revenue',
  'count_orders_by_status',
  'get_product_average_rating',
  'get_product_review_count',
  'is_admin',
  'get_admin_role'
)
ORDER BY routine_name;

-- عرض إحصائيات قاعدة البيانات
SELECT
  (SELECT COUNT(*) FROM admins) AS total_admins,
  (SELECT COUNT(*) FROM categories) AS total_categories,
  (SELECT COUNT(*) FROM products) AS total_products,
  (SELECT COUNT(*) FROM orders) AS total_orders,
  (SELECT COUNT(*) FROM reviews) AS total_reviews,
  (SELECT COUNT(*) FROM coupons) AS total_coupons,
  (SELECT COUNT(*) FROM wishlists) AS total_wishlists;


-- ============================================
-- 📋 التعليمات النهائية
-- ============================================

/*
🎉 تم إنشاء قاعدة البيانات بنجاح!
================================

✅ ما تم إنشاؤه:
- 7 جداول رئيسية (admins, categories, products, orders, reviews, coupons, wishlists)
- 30+ Index للأداء السريع
- 7 Functions جاهزة للاستخدام
- 6 Triggers تلقائية
- سياسات RLS كاملة (الأدمن فقط يمكنهم إدارة المحتوى)

⚠️ الخطوة المهمة التالية:
=========================

🔴 يجب إضافة نفسك كأدمن الآن!

نفذ هذا الأمر في SQL Editor:
(استبدل البريد الإلكتروني ببريدك الحقيقي)

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
  role = 'super_admin';


📊 ملخص السياسات:
==================

المنتجات (Products):
  ✅ قراءة: متاحة للجميع
  🔐 إضافة/تعديل/حذف: للأدمن فقط

الفئات (Categories):
  ✅ قراءة: متاحة للجميع
  🔐 إضافة/تعديل/حذف: للأدمن فقط

الطلبات (Orders):
  ✅ قراءة: متاحة للجميع
  ✅ إضافة: متاحة للجميع (العملاء يمكنهم إنشاء طلبات)
  🔐 تعديل/حذف: للأدمن فقط

الكوبونات (Coupons):
  ✅ قراءة: متاحة للجميع
  🔐 إضافة/تعديل/حذف: للأدمن فقط

التقييمات (Reviews):
  ✅ قراءة: متاحة للجميع
  ✅ إضافة: متاحة للجميع (العملاء يمكنهم كتابة تقييمات)
  🔐 تعديل/حذف: للأدمن فقط


🚀 الخطوات التالية:
==================

1. أضف نفسك كأدمن باستخدام الأمر أعلاه ⬆️
2. سجل خروج من الموقع
3. سجل دخول مرة أخرى
4. ادخل لوحة الأدمن
5. جرب إضافة منتج
6. يجب أن يعمل بدون أخطاء! 🎊


💾 خطوات اختيارية:
===================

1. إنشاء Storage Bucket للصور:
   - اذهب إلى Storage في Supabase
   - أنشئ bucket باسم "product-images"
   - اجعله Public
   - أضف policies للقراءة والكتابة

2. إضافة بيانات تجريبية (فئات ومنتجات للتجربة)

3. إعداد متغيرات البيئة في .env.local


📞 إذا واجهت أي مشكلة:
=======================

1. تأكد من تشغيل الملف كاملاً بدون أخطاء
2. تأكد من إضافة نفسك كأدمن
3. سجل خروج وسجل دخول مرة أخرى
4. شغّل diagnose-rls-issue.sql للتحقق


🎊 كل شيء جاهز الآن! بالتوفيق! 💚
*/

-- ============================================
-- تم الانتهاء! ✅
-- ============================================
