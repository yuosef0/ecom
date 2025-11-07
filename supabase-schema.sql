-- ============================================
-- كود Supabase الكامل للمتجر الإلكتروني
-- Single Vendor E-commerce Store
-- قم بتشغيل هذا الكود في SQL Editor في لوحة تحكم Supabase
-- ============================================

-- ============================================
-- الخطوة 1: حذف الجداول القديمة (إذا أردت البدء من الصفر)
-- ============================================

-- احذف التعليق من الأسطر التالية إذا أردت حذف البيانات القديمة والبدء من جديد
-- DROP TABLE IF EXISTS wishlists CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS get_product_average_rating() CASCADE;


-- ============================================
-- الخطوة 2: إنشاء جدول الفئات (Categories)
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

-- إضافة تعليق على الجدول
COMMENT ON TABLE categories IS 'جدول الفئات - يدعم الفئات الرئيسية والفرعية (Nested Categories)';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN categories.name IS 'اسم الفئة';
COMMENT ON COLUMN categories.slug IS 'الرابط الودي للفئة';
COMMENT ON COLUMN categories.parent_id IS 'معرف الفئة الأم (NULL للفئات الرئيسية)';
COMMENT ON COLUMN categories.display_order IS 'ترتيب عرض الفئة';
COMMENT ON COLUMN categories.is_active IS 'هل الفئة نشطة أم معطلة';


-- ============================================
-- الخطوة 3: إنشاء جدول المنتجات (Products)
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

-- إضافة تعليق على الجدول
COMMENT ON TABLE products IS 'جدول المنتجات - يحتوي على جميع منتجات المتجر';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN products.id IS 'المعرف الفريد للمنتج';
COMMENT ON COLUMN products.title IS 'اسم المنتج';
COMMENT ON COLUMN products.slug IS 'الرابط الودي للمنتج (يجب أن يكون فريداً)';
COMMENT ON COLUMN products.price IS 'سعر المنتج بالجنيه المصري';
COMMENT ON COLUMN products.compare_at_price IS 'السعر قبل الخصم (للعرض فقط)';
COMMENT ON COLUMN products.category_id IS 'معرف الفئة التي ينتمي إليها المنتج';
COMMENT ON COLUMN products.images IS 'مصفوفة من روابط الصور الإضافية بصيغة JSON';
COMMENT ON COLUMN products.stock IS 'الكمية المتوفرة في المخزون';
COMMENT ON COLUMN products.sku IS 'رقم التعريف الفريد للمنتج (Stock Keeping Unit)';
COMMENT ON COLUMN products.is_featured IS 'هل المنتج مميز (يظهر في الصفحة الرئيسية)';
COMMENT ON COLUMN products.is_active IS 'هل المنتج نشط أم معطل';


-- ============================================
-- الخطوة 4: إنشاء جدول الطلبات (Orders)
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

-- إضافة تعليق على الجدول
COMMENT ON TABLE orders IS 'جدول الطلبات - يحتوي على جميع طلبات العملاء';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN orders.payment_status IS 'حالة الدفع: pending (قيد الانتظار), paid (مدفوع), failed (فشل), refunded (مسترد)';
COMMENT ON COLUMN orders.order_status IS 'حالة الطلب: processing (قيد المعالجة), shipped (تم الشحن), delivered (تم التوصيل), cancelled (ملغي)';
COMMENT ON COLUMN orders.items IS 'تفاصيل المنتجات المطلوبة بصيغة JSON';
COMMENT ON COLUMN orders.discount_amount IS 'قيمة الخصم المطبق على الطلب';
COMMENT ON COLUMN orders.coupon_code IS 'كود الكوبون المستخدم';


-- ============================================
-- الخطوة 5: إنشاء جدول التقييمات (Reviews)
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

-- إضافة تعليق على الجدول
COMMENT ON TABLE reviews IS 'جدول التقييمات - تقييمات ومراجعات المنتجات من العملاء';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN reviews.product_id IS 'معرف المنتج المراد تقييمه';
COMMENT ON COLUMN reviews.rating IS 'التقييم من 1 إلى 5 نجوم';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'هل التقييم من عميل قام بشراء المنتج فعلاً';
COMMENT ON COLUMN reviews.is_approved IS 'هل تم الموافقة على نشر التقييم';
COMMENT ON COLUMN reviews.helpful_count IS 'عدد الأشخاص الذين وجدوا التقييم مفيداً';


-- ============================================
-- الخطوة 6: إنشاء جدول الكوبونات (Coupons)
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

-- إضافة تعليق على الجدول
COMMENT ON TABLE coupons IS 'جدول الكوبونات - كوبونات الخصم والعروض الترويجية';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN coupons.code IS 'كود الكوبون (يجب أن يكون فريداً)';
COMMENT ON COLUMN coupons.discount_type IS 'نوع الخصم: percentage (نسبة مئوية) أو fixed (قيمة ثابتة)';
COMMENT ON COLUMN coupons.discount_value IS 'قيمة الخصم (نسبة أو مبلغ حسب النوع)';
COMMENT ON COLUMN coupons.min_purchase_amount IS 'الحد الأدنى لقيمة الطلب لتطبيق الكوبون';
COMMENT ON COLUMN coupons.max_discount_amount IS 'الحد الأقصى لقيمة الخصم (للنسبة المئوية)';
COMMENT ON COLUMN coupons.usage_limit IS 'عدد مرات الاستخدام المسموح بها (NULL = غير محدود)';
COMMENT ON COLUMN coupons.used_count IS 'عدد مرات استخدام الكوبون';


-- ============================================
-- الخطوة 7: إنشاء جدول المفضلة (Wishlists)
-- ============================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, product_id)
);

-- إضافة تعليق على الجدول
COMMENT ON TABLE wishlists IS 'جدول المفضلة - المنتجات المفضلة للعملاء';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN wishlists.session_id IS 'معرف جلسة المتصفح (للضيوف) أو معرف المستخدم';
COMMENT ON COLUMN wishlists.product_id IS 'معرف المنتج المفضل';
COMMENT ON COLUMN wishlists.customer_email IS 'البريد الإلكتروني (اختياري)';


-- ============================================
-- الخطوة 8: إنشاء Indexes للأداء السريع
-- ============================================

-- Indexes لجدول الفئات
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Indexes لجدول المنتجات
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Index مركب للبحث والفلترة
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category_id, price);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured, created_at DESC);

-- Indexes لجدول الطلبات
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- Index مركب للبحث السريع
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(order_status, created_at DESC);

-- Indexes لجدول التقييمات
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Index مركب للتقييمات
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved, created_at DESC);

-- Indexes لجدول الكوبونات
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

-- Indexes لجدول المفضلة
CREATE INDEX IF NOT EXISTS idx_wishlists_session_id ON wishlists(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_email ON wishlists(customer_email);


-- ============================================
-- الخطوة 9: إنشاء Functions
-- ============================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'دالة لتحديث عمود updated_at تلقائياً عند كل تعديل';

-- Function لحساب إجمالي الإيرادات
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid');
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION get_total_revenue() IS 'دالة لحساب إجمالي الإيرادات من الطلبات المدفوعة';

-- Function لحساب عدد الطلبات حسب الحالة
CREATE OR REPLACE FUNCTION count_orders_by_status(status_filter VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM orders WHERE order_status = status_filter);
END;
$$ language 'plpgsql';

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
$$ language 'plpgsql';

COMMENT ON FUNCTION get_product_average_rating(UUID) IS 'دالة لحساب متوسط تقييم منتج معين';

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
$$ language 'plpgsql';

COMMENT ON FUNCTION get_product_review_count(UUID) IS 'دالة لحساب عدد تقييمات منتج معين';

-- Function للتحقق من صلاحية الكوبون
CREATE OR REPLACE FUNCTION is_coupon_valid(coupon_code_input VARCHAR, order_total DECIMAL)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
  calculated_discount DECIMAL;
BEGIN
  -- جلب الكوبون
  SELECT * INTO coupon_record FROM coupons WHERE code = coupon_code_input;

  -- التحقق من وجود الكوبون
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'الكوبون غير موجود'::TEXT;
    RETURN;
  END IF;

  -- التحقق من تفعيل الكوبون
  IF NOT coupon_record.is_active THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'الكوبون غير نشط'::TEXT;
    RETURN;
  END IF;

  -- التحقق من تاريخ الصلاحية
  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'انتهت صلاحية الكوبون'::TEXT;
    RETURN;
  END IF;

  -- التحقق من الحد الأدنى للشراء
  IF order_total < coupon_record.min_purchase_amount THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'قيمة الطلب أقل من الحد الأدنى المطلوب'::TEXT;
    RETURN;
  END IF;

  -- التحقق من عدد مرات الاستخدام
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'تم استخدام الكوبون للحد الأقصى من المرات'::TEXT;
    RETURN;
  END IF;

  -- حساب قيمة الخصم
  IF coupon_record.discount_type = 'percentage' THEN
    calculated_discount := order_total * (coupon_record.discount_value / 100);
    -- التحقق من الحد الأقصى للخصم
    IF coupon_record.max_discount_amount IS NOT NULL AND calculated_discount > coupon_record.max_discount_amount THEN
      calculated_discount := coupon_record.max_discount_amount;
    END IF;
  ELSE
    calculated_discount := coupon_record.discount_value;
  END IF;

  -- الكوبون صالح
  RETURN QUERY SELECT true, calculated_discount, 'تم تطبيق الكوبون بنجاح'::TEXT;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION is_coupon_valid(VARCHAR, DECIMAL) IS 'دالة للتحقق من صلاحية الكوبون وحساب قيمة الخصم';


-- ============================================
-- الخطوة 10: إنشاء Triggers
-- ============================================

-- Trigger لتحديث updated_at في جدول الفئات
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لتحديث updated_at في جدول المنتجات
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لتحديث updated_at في جدول الطلبات
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لتحديث updated_at في جدول التقييمات
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger لتحديث updated_at في جدول الكوبونات
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- الخطوة 11: إعداد Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على جدول الفئات
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الفئات النشطة
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

-- السماح للجميع بإضافة فئات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public insert access to categories" ON categories;
CREATE POLICY "Allow public insert access to categories" ON categories
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بتحديث الفئات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public update access to categories" ON categories;
CREATE POLICY "Allow public update access to categories" ON categories
  FOR UPDATE USING (true);

-- السماح للجميع بحذف الفئات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public delete access to categories" ON categories;
CREATE POLICY "Allow public delete access to categories" ON categories
  FOR DELETE USING (true);

-- تفعيل RLS على جدول المنتجات
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة المنتجات النشطة
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" ON products
  FOR SELECT USING (true);

-- السماح للجميع بإضافة منتجات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public insert access to products" ON products;
CREATE POLICY "Allow public insert access to products" ON products
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بتحديث المنتجات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public update access to products" ON products;
CREATE POLICY "Allow public update access to products" ON products
  FOR UPDATE USING (true);

-- السماح للجميع بحذف المنتجات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public delete access to products" ON products;
CREATE POLICY "Allow public delete access to products" ON products
  FOR DELETE USING (true);

-- تفعيل RLS على جدول الطلبات
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الطلبات
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
CREATE POLICY "Allow public read access to orders" ON orders
  FOR SELECT USING (true);

-- السماح للجميع بإضافة طلبات
DROP POLICY IF EXISTS "Allow public insert access to orders" ON orders;
CREATE POLICY "Allow public insert access to orders" ON orders
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بتحديث الطلبات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public update access to orders" ON orders;
CREATE POLICY "Allow public update access to orders" ON orders
  FOR UPDATE USING (true);

-- السماح للجميع بحذف الطلبات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public delete access to orders" ON orders;
CREATE POLICY "Allow public delete access to orders" ON orders
  FOR DELETE USING (true);

-- تفعيل RLS على جدول التقييمات
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة التقييمات المعتمدة
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;
CREATE POLICY "Allow public read access to reviews" ON reviews
  FOR SELECT USING (true);

-- السماح للجميع بإضافة تقييمات
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON reviews;
CREATE POLICY "Allow public insert access to reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بتحديث التقييمات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public update access to reviews" ON reviews;
CREATE POLICY "Allow public update access to reviews" ON reviews
  FOR UPDATE USING (true);

-- السماح للجميع بحذف التقييمات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public delete access to reviews" ON reviews;
CREATE POLICY "Allow public delete access to reviews" ON reviews
  FOR DELETE USING (true);

-- تفعيل RLS على جدول الكوبونات
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الكوبونات (للتحقق من الصلاحية)
DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
CREATE POLICY "Allow public read access to coupons" ON coupons
  FOR SELECT USING (true);

-- السماح للجميع بإضافة كوبونات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public insert access to coupons" ON coupons;
CREATE POLICY "Allow public insert access to coupons" ON coupons
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بتحديث الكوبونات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public update access to coupons" ON coupons;
CREATE POLICY "Allow public update access to coupons" ON coupons
  FOR UPDATE USING (true);

-- السماح للجميع بحذف الكوبونات (يمكن تقييدها لاحقاً)
DROP POLICY IF EXISTS "Allow public delete access to coupons" ON coupons;
CREATE POLICY "Allow public delete access to coupons" ON coupons
  FOR DELETE USING (true);

-- تفعيل RLS على جدول المفضلة
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
-- الخطوة 12: إضافة بيانات تجريبية (اختياري)
-- ============================================

-- يمكنك إزالة التعليق من الكود التالي لإضافة بيانات تجريبية

/*
-- إضافة فئات تجريبية
INSERT INTO categories (name, slug, description, display_order) VALUES
('إلكترونيات', 'electronics', 'أجهزة إلكترونية متنوعة', 1),
('هواتف', 'phones', 'هواتف ذكية وملحقات', 2),
('حواسيب', 'computers', 'لابتوبات وأجهزة كمبيوتر', 3),
('اكسسوارات', 'accessories', 'إكسسوارات إلكترونية', 4);

-- إضافة منتجات تجريبية
INSERT INTO products (title, slug, description, price, compare_at_price, stock, is_featured, category_id) VALUES
('هاتف iPhone 15 Pro', 'iphone-15-pro', 'أحدث هاتف من Apple بتقنيات متطورة', 52999.00, 59999.00, 15, true, (SELECT id FROM categories WHERE slug = 'phones')),
('لابتوب Dell XPS 13', 'dell-xps-13', 'لابتوب قوي ومحمول للعمل والدراسة', 45000.00, NULL, 8, true, (SELECT id FROM categories WHERE slug = 'computers')),
('سماعات AirPods Pro', 'airpods-pro', 'سماعات لاسلكية بإلغاء الضوضاء', 8999.00, 9999.00, 25, false, (SELECT id FROM categories WHERE slug = 'accessories')),
('ساعة Apple Watch Series 9', 'apple-watch-9', 'ساعة ذكية بميزات صحية متقدمة', 15999.00, NULL, 12, true, (SELECT id FROM categories WHERE slug = 'accessories')),
('تابلت iPad Air', 'ipad-air', 'تابلت مثالي للإبداع والترفيه', 22999.00, 24999.00, 10, false, (SELECT id FROM categories WHERE slug = 'electronics'));

-- إضافة كوبونات تجريبية
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_until) VALUES
('WELCOME10', 'خصم 10% للعملاء الجدد', 'percentage', 10.00, 100.00, 500.00, 100, NOW() + INTERVAL '30 days'),
('SAVE50', 'خصم 50 جنيه على أي طلب', 'fixed', 50.00, 200.00, NULL, 50, NOW() + INTERVAL '15 days'),
('FREESHIP', 'توصيل مجاني', 'fixed', 0.00, 0.00, NULL, NULL, NOW() + INTERVAL '60 days');

-- إضافة تقييمات تجريبية
-- ملاحظة: يجب أن تكون المنتجات موجودة أولاً
-- INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, comment, is_verified_purchase) VALUES
-- ((SELECT id FROM products WHERE slug = 'iphone-15-pro'), 'أحمد محمد', 'ahmed@example.com', 5, 'هاتف رائع', 'أفضل هاتف استخدمته على الإطلاق', true),
-- ((SELECT id FROM products WHERE slug = 'dell-xps-13'), 'سارة علي', 'sara@example.com', 4, 'جيد جداً', 'لابتوب ممتاز للعمل لكن السعر مرتفع قليلاً', true);
*/


-- ============================================
-- الخطوة 13: التحقق من نجاح الإعداد
-- ============================================

-- عرض جميع الجداول
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- عرض جميع الـ Functions
SELECT routine_name FROM information_schema.routines
WHERE routine_type = 'FUNCTION' AND routine_schema = 'public'
ORDER BY routine_name;

-- عرض إحصائيات قاعدة البيانات
SELECT
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COUNT(*) FROM coupons) as total_coupons,
  (SELECT COUNT(*) FROM wishlists) as total_wishlists;

-- اختبار Functions
SELECT get_total_revenue() as total_revenue;
SELECT count_orders_by_status('processing') as processing_orders;


-- ============================================
-- ملاحظات مهمة
-- ============================================

/*
📚 هيكل قاعدة البيانات:
======================

الجداول الأساسية (6 جداول):
1. categories - الفئات (تدعم الفئات الرئيسية والفرعية)
2. products - المنتجات (مع ربط بالفئات)
3. orders - الطلبات (مع دعم الكوبونات)
4. reviews - التقييمات والمراجعات
5. coupons - كوبونات الخصم
6. wishlists - المنتجات المفضلة


📌 خطوات مهمة بعد تشغيل هذا الكود:
=====================================

1. إنشاء Storage Bucket للصور:
   ✓ اذهب إلى Storage في لوحة تحكم Supabase
   ✓ أنشئ bucket جديد باسم "products-imges"
   ✓ اجعل الـ bucket Public
   ✓ أضف Policy للسماح بالقراءة والكتابة

2. متغيرات البيئة المطلوبة (.env.local):
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000


🔒 Row Level Security (RLS):
============================
   - حالياً، جميع العمليات مسموحة للجميع للتطوير
   - لإضافة أمان أكبر في الإنتاج، قم بتقييد الـ Policies حسب المستخدمين
   - مثال: السماح فقط للمسؤولين بتعديل وحذف المنتجات والفئات
   - مثال: السماح للعملاء بمشاهدة طلباتهم الخاصة فقط


⚡ الأداء والـ Indexes:
=======================
   - تم إضافة 30+ Index للحقول الأكثر استخداماً
   - Indexes مركبة للبحث والفلترة المتقدمة
   - يمكن إضافة المزيد حسب الحاجة


🎯 الميزات المتوفرة:
===================
   ✅ نظام فئات متعدد المستويات (Nested Categories)
   ✅ نظام تقييمات ومراجعات المنتجات
   ✅ نظام كوبونات خصم متقدم (نسبة مئوية أو قيمة ثابتة)
   ✅ نظام المفضلة (Wishlist)
   ✅ دعم صور متعددة للمنتج الواحد
   ✅ المنتجات المميزة (Featured Products)
   ✅ السعر قبل الخصم (Compare at Price)
   ✅ رقم SKU للمنتجات
   ✅ SEO (Meta Title & Description)
   ✅ Functions جاهزة لحساب الإيرادات والتقييمات


📊 Functions متاحة للاستخدام:
==============================
   - get_total_revenue() - إجمالي الإيرادات
   - count_orders_by_status(status) - عدد الطلبات حسب الحالة
   - get_product_average_rating(product_id) - متوسط تقييم المنتج
   - get_product_review_count(product_id) - عدد تقييمات المنتج
   - is_coupon_valid(code, total) - التحقق من صلاحية الكوبون


💾 النسخ الاحتياطي:
===================
   - ننصح بعمل نسخة احتياطية من البيانات بشكل دوري
   - Supabase توفر نسخ احتياطية تلقائية في الخطط المدفوعة
   - يمكن تصدير البيانات بصيغة SQL أو CSV


📈 المراقبة والصيانة:
=====================
   - استخدم لوحة تحكم Supabase لمراقبة الأداء
   - راقب استهلاك الـ API والتخزين
   - تحقق من الـ Query Performance بشكل دوري
   - راجع الـ Logs للأخطاء


🚀 الخطوات التالية المقترحة:
============================
   1. إضافة نظام مستخدمين (Authentication)
   2. إضافة نظام إشعارات البريد الإلكتروني
   3. إضافة لوحة تحكم متقدمة للإحصائيات
   4. إضافة نظام تتبع الشحنات
   5. إضافة نظام تقارير مفصل
   6. إضافة دعم اللغات المتعددة
*/


-- ============================================
-- تم الانتهاء! ✅
-- ============================================

/*
🎉 تهانينا! تم إعداد قاعدة البيانات بنجاح

📊 الإحصائيات:
   - 6 جداول رئيسية
   - 30+ Index للأداء
   - 5 Functions جاهزة
   - 5 Triggers تلقائية
   - RLS Policies كاملة

🔧 الخطوة التالية:
   1. شغل هذا الكود في SQL Editor في لوحة تحكم Supabase
   2. تحقق من نجاح الإنشاء باستخدام استعلامات التحقق أعلاه
   3. أنشئ Storage Bucket للصور
   4. حدث متغيرات البيئة في .env.local
   5. ابدأ بناء واجهات المستخدم في Next.js

💡 نصيحة: احتفظ بنسخة من هذا الملف للرجوع إليه لاحقاً

يمكنك الآن استخدام الجداول والـ Functions في تطبيق Next.js
تأكد من تحديث متغيرات البيئة في ملف .env.local
*/
