-- ============================================
-- 🗄️ إعداد قاعدة البيانات من الصفر
-- ============================================
-- هذا الملف لإنشاء قاعدة بيانات جديدة تماماً
-- ⚠️ تحذير: لا تشغله على قاعدة بيانات موجودة
-- ============================================

-- ============================================
-- 1️⃣ إنشاء الجداول (Tables)
-- ============================================

-- جدول الفئات (Categories)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المنتجات (Products)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  cost_per_item DECIMAL(10, 2) CHECK (cost_per_item >= 0),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku TEXT,
  barcode TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الملفات الشخصية للمستخدمين (Profiles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'مصر',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المسؤولين (Admins)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الطلبات (Orders)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 30.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  coupon_code TEXT,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'paymob_card', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paymob_order_id TEXT,
  paymob_transaction_id TEXT,
  order_status TEXT DEFAULT 'processing' CHECK (order_status IN ('processing', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  items JSONB NOT NULL,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول قائمة الأمنيات (Wishlist)
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- جدول الكوبونات (Coupons)
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول استخدام الكوبونات (Coupon Usage)
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول رسائل الشريط العلوي (Top Bar Messages)
CREATE TABLE top_bar_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_ar TEXT NOT NULL,
  message_en TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول إعدادات الثيم (Theme Settings)
CREATE TABLE theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_label TEXT,
  setting_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2️⃣ الفهارس (Indexes) لتحسين الأداء
-- ============================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_wishlist_product ON wishlist(product_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);

-- ============================================
-- 3️⃣ الدوال (Functions)
-- ============================================

-- دالة للتحقق من كون المستخدم أدمن
CREATE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = $1
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث updated_at تلقائياً
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4️⃣ المحفزات (Triggers)
-- ============================================

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON theme_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5️⃣ تفعيل Row Level Security
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_bar_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6️⃣ سياسات الأمان (RLS Policies)
-- ============================================

-- ===== سياسات المنتجات (Products) =====
CREATE POLICY "الجميع يمكنهم مشاهدة المنتجات النشطة" ON products
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "الأدمن يمكنهم إضافة منتجات" ON products
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "الأدمن يمكنهم تعديل منتجات" ON products
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "الأدمن يمكنهم حذف منتجات" ON products
  FOR DELETE USING (is_admin(auth.uid()));

-- ===== سياسات الفئات (Categories) =====
CREATE POLICY "الجميع يمكنهم مشاهدة الفئات النشطة" ON categories
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "الأدمن يمكنهم إدارة الفئات" ON categories
  FOR ALL USING (is_admin(auth.uid()));

-- ===== سياسات الطلبات (Orders) =====
CREATE POLICY "المستخدمون يمكنهم رؤية طلباتهم" ON orders
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "المستخدمون يمكنهم إنشاء طلبات" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "الأدمن يمكنهم تعديل الطلبات" ON orders
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "الأدمن يمكنهم حذف الطلبات" ON orders
  FOR DELETE USING (is_admin(auth.uid()));

-- ===== سياسات الملفات الشخصية (Profiles) =====
CREATE POLICY "المستخدمون يمكنهم رؤية ملفاتهم" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "المستخدمون يمكنهم تعديل ملفاتهم" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "المستخدمون يمكنهم إنشاء ملفاتهم" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===== سياسات المسؤولين (Admins) =====
CREATE POLICY "الأدمن يمكنهم رؤية الأدمن الآخرين" ON admins
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "السوبر أدمن يمكنهم إضافة أدمن" ON admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

CREATE POLICY "السوبر أدمن يمكنهم تعديل أدمن" ON admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- ===== سياسات قائمة الأمنيات (Wishlist) =====
CREATE POLICY "المستخدمون يمكنهم رؤية قوائمهم" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة لقوائمهم" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف من قوائمهم" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ===== سياسات الكوبونات (Coupons) =====
CREATE POLICY "الجميع يمكنهم رؤية الكوبونات النشطة" ON coupons
  FOR SELECT USING (
    (is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
    OR is_admin(auth.uid())
  );

CREATE POLICY "الأدمن يمكنهم إدارة الكوبونات" ON coupons
  FOR ALL USING (is_admin(auth.uid()));

-- ===== سياسات استخدام الكوبونات (Coupon Usage) =====
CREATE POLICY "المستخدمون يمكنهم رؤية استخداماتهم" ON coupon_usage
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "النظام يمكنه إضافة استخدام" ON coupon_usage
  FOR INSERT WITH CHECK (true);

-- ===== سياسات رسائل الشريط العلوي (Top Bar Messages) =====
CREATE POLICY "الجميع يمكنهم رؤية الرسائل النشطة" ON top_bar_messages
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "الأدمن يمكنهم إدارة الرسائل" ON top_bar_messages
  FOR ALL USING (is_admin(auth.uid()));

-- ===== سياسات إعدادات الثيم (Theme Settings) =====
CREATE POLICY "الجميع يمكنهم رؤية إعدادات الثيم" ON theme_settings
  FOR SELECT USING (true);

CREATE POLICY "الأدمن يمكنهم تعديل إعدادات الثيم" ON theme_settings
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================
-- 7️⃣ البيانات الافتراضية (Default Data)
-- ============================================

-- إعدادات الثيم الافتراضية
INSERT INTO theme_settings (setting_key, setting_value, setting_label, setting_description)
VALUES
  ('primary_color', '#e60000', 'اللون الأساسي', 'اللون الأساسي للموقع والأزرار'),
  ('primary_hover', '#cc0000', 'لون التمرير الأساسي', 'اللون عند التمرير على الأزرار'),
  ('top_bar_bg', '#e60000', 'خلفية الشريط العلوي', 'لون خلفية الشريط العلوي'),
  ('button_text', '#ffffff', 'لون نص الأزرار', 'لون النص داخل الأزرار'),
  ('price_color', '#e60000', 'لون الأسعار', 'اللون المستخدم لعرض الأسعار في جميع أنحاء الموقع'),
  ('product_card_bg', '#ffffff', 'خلفية كارد المنتج', 'لون خلفية بطاقات المنتجات');

-- رسالة ترحيبية افتراضية
INSERT INTO top_bar_messages (message_ar, message_en, is_active, display_order)
VALUES
  ('🎉 مرحباً بكم في متجرنا! شحن مجاني للطلبات فوق 500 جنيه', 'Welcome! Free shipping on orders over 500 EGP', true, 1);

-- ============================================
-- ✅ انتهى الإعداد!
-- ============================================
-- الخطوة التالية: إضافة أول مسؤول (admin)
--
-- مثال:
-- INSERT INTO admins (user_id, email, full_name, role)
-- SELECT id, email, raw_user_meta_data->>'full_name', 'super_admin'
-- FROM auth.users
-- WHERE email = 'your-email@example.com';
-- ============================================
