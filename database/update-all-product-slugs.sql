-- ================================================
-- Update ALL Product Slugs to Use Product ID
-- تحديث جميع الـ slugs لتستخدم ID المنتج
-- ================================================

-- تحديث جميع المنتجات بدون استثناء
-- استخدام ID المنتج كـ slug لضمان أنه دائماً صالح
UPDATE products
SET slug = CONCAT('product-', REPLACE(id::text, '-', ''))
WHERE TRUE; -- تحديث الكل بدون شروط

-- التحقق من النتائج - يجب أن تكون جميع الـ slugs صالحة الآن
SELECT
  id,
  title,
  slug,
  CASE
    WHEN slug ~ '[^\x00-\x7F]' THEN '❌ يحتوي على عربي'
    WHEN slug IS NULL THEN '❌ NULL'
    WHEN slug = '' THEN '❌ فارغ'
    WHEN slug ~ '^product-[a-z0-9]+$' THEN '✅ صالح'
    ELSE '⚠️ غير عادي'
  END as حالة_الslug
FROM products
ORDER BY created_at DESC;

-- إحصائيات
SELECT
  COUNT(*) as "إجمالي المنتجات",
  COUNT(CASE WHEN slug ~ '^product-[a-z0-9]+$' THEN 1 END) as "منتجات بـ slug صالح",
  COUNT(CASE WHEN slug ~ '[^\x00-\x7F]' THEN 1 END) as "منتجات بـ slug عربي",
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as "منتجات بدون slug"
FROM products;
