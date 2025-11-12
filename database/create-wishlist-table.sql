-- ================================================
-- Create Wishlist Table
-- إنشاء جدول قائمة الرغبات
-- ================================================

-- إنشاء جدول wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- منع التكرار: كل مستخدم يمكنه إضافة نفس المنتج مرة واحدة فقط
);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- ================================================
-- Row Level Security (RLS) Policies
-- ================================================

-- تفعيل RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدمون يمكنهم قراءة المفضلة الخاصة بهم فقط
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
CREATE POLICY "Users can view own wishlist"
    ON wishlist FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- سياسة: المستخدمون يمكنهم إضافة للمفضلة
DROP POLICY IF EXISTS "Users can add to wishlist" ON wishlist;
CREATE POLICY "Users can add to wishlist"
    ON wishlist FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- سياسة: المستخدمون يمكنهم حذف من المفضلة الخاصة بهم
DROP POLICY IF EXISTS "Users can remove from wishlist" ON wishlist;
CREATE POLICY "Users can remove from wishlist"
    ON wishlist FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ================================================
-- التحقق من الجدول
-- ================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'wishlist'
AND table_schema = 'public'
ORDER BY ordinal_position;
