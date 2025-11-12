-- ================================================
-- E-Commerce Database - Complete Schema
-- تصميم قاعدة بيانات متجر إلكتروني كامل
-- ================================================
-- Created: 2025-11-12
-- Database: PostgreSQL (Supabase)
-- ================================================

-- ================================================
-- PART 1: EXTENSIONS
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- PART 2: CUSTOM TYPES & ENUMS
-- ================================================

-- Order status enum
DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM (
        'processing',
        'shipped',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment status enum
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'pending',
        'paid',
        'failed',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discount type enum (for coupons)
DO $$ BEGIN
    CREATE TYPE discount_type_enum AS ENUM (
        'percentage',
        'fixed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin role enum
DO $$ BEGIN
    CREATE TYPE admin_role_enum AS ENUM (
        'super_admin',
        'admin',
        'moderator'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================================
-- PART 3: TABLES
-- ================================================

-- ------------------------------------------------
-- 3.1: Profiles Table (extends auth.users)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';

-- ------------------------------------------------
-- 3.2: Admins Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

COMMENT ON TABLE admins IS 'Admin users with elevated privileges';
COMMENT ON COLUMN admins.role IS 'Role: super_admin, admin, or moderator';

-- ------------------------------------------------
-- 3.3: Categories Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Product categories with hierarchical structure';
COMMENT ON COLUMN categories.parent_id IS 'Parent category for nested categories';

-- ------------------------------------------------
-- 3.4: Products Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    stock INTEGER DEFAULT 0,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Products catalog';
COMMENT ON COLUMN products.images IS 'Array of image URLs in JSONB format';
COMMENT ON COLUMN products.sizes IS 'Available sizes as JSONB array: ["S", "M", "L", "XL"]';
COMMENT ON COLUMN products.colors IS 'Available colors as JSONB array: [{"name": "أبيض", "hex": "#FFFFFF"}]';
COMMENT ON COLUMN products.compare_at_price IS 'Original price for showing discounts';

-- ------------------------------------------------
-- 3.5: Orders Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'processing',
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON COLUMN orders.items IS 'Order items as JSONB array with product details';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN orders.order_status IS 'Order status: processing, shipped, delivered, cancelled';

-- ------------------------------------------------
-- 3.6: Reviews Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    is_approved BOOLEAN DEFAULT true,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reviews IS 'Product reviews and ratings';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'Whether the reviewer actually purchased the product';

-- ------------------------------------------------
-- 3.7: Wishlists Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, product_id)
);

COMMENT ON TABLE wishlists IS 'User wishlist/favorites';
COMMENT ON COLUMN wishlists.session_id IS 'Session ID for guest users or user ID for authenticated users';

-- ------------------------------------------------
-- 3.8: Coupons Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (discount_value > 0),
    CHECK (used_count >= 0)
);

COMMENT ON TABLE coupons IS 'Discount coupons';
COMMENT ON COLUMN coupons.discount_type IS 'Discount type: percentage or fixed';
COMMENT ON COLUMN coupons.usage_limit IS 'Maximum number of times this coupon can be used (NULL = unlimited)';

-- ------------------------------------------------
-- 3.9: Slider Images Table
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS slider_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE slider_images IS 'Homepage slider/carousel images';

-- ================================================
-- PART 4: INDEXES
-- ================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Admins indexes
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_session_id ON wishlists(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_email ON wishlists(customer_email);

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

-- Slider images indexes
CREATE INDEX IF NOT EXISTS idx_slider_images_is_active ON slider_images(is_active);
CREATE INDEX IF NOT EXISTS idx_slider_images_display_order ON slider_images(display_order);

-- ================================================
-- PART 5: FUNCTIONS
-- ================================================

-- ------------------------------------------------
-- 5.1: Update updated_at timestamp function
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update updated_at timestamp';

-- ------------------------------------------------
-- 5.2: Check if user is admin function
-- ------------------------------------------------
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

COMMENT ON FUNCTION is_admin IS 'Check if a user has admin privileges';

-- ================================================
-- PART 6: TRIGGERS
-- ================================================

-- Profiles triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Admins triggers
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Categories triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Products triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Reviews triggers
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Coupons triggers
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Slider images triggers
DROP TRIGGER IF EXISTS update_slider_images_updated_at ON slider_images;
CREATE TRIGGER update_slider_images_updated_at
    BEFORE UPDATE ON slider_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- ================================================

-- ------------------------------------------------
-- 7.1: Enable RLS on all tables
-- ------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------
-- 7.2: Profiles Policies
-- ------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------
-- 7.3: Admins Policies
-- ------------------------------------------------

-- Anyone can read active admins (for verification)
CREATE POLICY "Anyone can read active admins"
    ON admins FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only super admins can insert new admins
CREATE POLICY "Super admins can insert admins"
    ON admins FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role = 'super_admin'
        )
    );

-- Admins can update admins
CREATE POLICY "Admins can update admins"
    ON admins FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role IN ('super_admin', 'admin')
        )
    );

-- Only super admins can delete admins
CREATE POLICY "Super admins can delete admins"
    ON admins FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role = 'super_admin'
        )
    );

-- ------------------------------------------------
-- 7.4: Categories Policies
-- ------------------------------------------------

-- Everyone can view active categories
CREATE POLICY "Anyone can view active categories"
    ON categories FOR SELECT
    TO public
    USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all categories"
    ON categories FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can insert categories
CREATE POLICY "Admins can insert categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update categories
CREATE POLICY "Admins can update categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can delete categories
CREATE POLICY "Admins can delete categories"
    ON categories FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ------------------------------------------------
-- 7.5: Products Policies
-- ------------------------------------------------

-- Everyone can view active products
CREATE POLICY "Anyone can view active products"
    ON products FOR SELECT
    TO public
    USING (is_active = true);

-- Admins can view all products
CREATE POLICY "Admins can view all products"
    ON products FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can insert products
CREATE POLICY "Admins can insert products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update products
CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can delete products
CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ------------------------------------------------
-- 7.6: Orders Policies
-- ------------------------------------------------

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    TO authenticated
    USING (customer_email = auth.email());

-- Anyone can create orders (for checkout)
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    TO public
    WITH CHECK (true);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update orders
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
    ON orders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ------------------------------------------------
-- 7.7: Reviews Policies
-- ------------------------------------------------

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
    ON reviews FOR SELECT
    TO public
    USING (is_approved = true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ------------------------------------------------
-- 7.8: Wishlists Policies
-- ------------------------------------------------

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
    ON wishlists FOR SELECT
    TO public
    USING (true);

-- Users can add to wishlist
CREATE POLICY "Users can add to wishlist"
    ON wishlists FOR INSERT
    TO public
    WITH CHECK (true);

-- Users can remove from wishlist
CREATE POLICY "Users can remove from wishlist"
    ON wishlists FOR DELETE
    TO public
    USING (true);

-- ------------------------------------------------
-- 7.9: Coupons Policies
-- ------------------------------------------------

-- Admins can view all coupons
CREATE POLICY "Admins can view all coupons"
    ON coupons FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Users can view active coupons
CREATE POLICY "Users can view active coupons"
    ON coupons FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admins can insert coupons
CREATE POLICY "Admins can insert coupons"
    ON coupons FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update coupons
CREATE POLICY "Admins can update coupons"
    ON coupons FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can delete coupons
CREATE POLICY "Admins can delete coupons"
    ON coupons FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ------------------------------------------------
-- 7.10: Slider Images Policies
-- ------------------------------------------------

-- Everyone can view active slider images
CREATE POLICY "Anyone can view active slider images"
    ON slider_images FOR SELECT
    TO public
    USING (is_active = true);

-- Admins can view all slider images
CREATE POLICY "Admins can view all slider images"
    ON slider_images FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can insert slider images
CREATE POLICY "Admins can insert slider images"
    ON slider_images FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update slider images
CREATE POLICY "Admins can update slider images"
    ON slider_images FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can delete slider images
CREATE POLICY "Admins can delete slider images"
    ON slider_images FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ================================================
-- PART 8: STORAGE BUCKETS (Run in Supabase Dashboard)
-- ================================================

-- Note: These commands should be run in Supabase Dashboard > Storage
-- They are provided here for reference only

/*
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products-imges', 'products-imges', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for slider images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slider-images', 'slider-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to uploaded images
CREATE POLICY "Public Access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('products-imges', 'category-images', 'slider-images', 'avatars'));

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('products-imges', 'category-images', 'slider-images', 'avatars'));

-- Allow authenticated users to update their uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid()::text = owner);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid()::text = owner);
*/

-- ================================================
-- PART 9: SAMPLE DATA (Optional - for testing)
-- ================================================

-- Insert sample super admin (replace with your email)
-- Note: User must exist in auth.users first
/*
INSERT INTO admins (user_id, email, full_name, role, is_active)
SELECT
    id,
    email,
    'Super Admin',
    'super_admin',
    true
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = true, role = 'super_admin', updated_at = NOW();
*/

-- ================================================
-- END OF SCHEMA
-- ================================================

-- To verify the setup, run:
-- SELECT tablename, schemaname FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
