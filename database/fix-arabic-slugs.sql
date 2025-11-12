-- ================================================
-- Fix Arabic Slugs in Products
-- إصلاح الـ slugs العربية في المنتجات
-- ================================================

-- تحديث جميع المنتجات التي لديها slug يحتوي على أحرف غير إنجليزية
-- استخدام ID المنتج كـ slug بدلاً من النص العربي

UPDATE products
SET slug = CONCAT('product-', id::text)
WHERE slug ~ '[^\x00-\x7F]' -- يحتوي على أحرف غير ASCII (عربي)
   OR slug IS NULL
   OR slug = '';

-- التحقق من النتائج
SELECT
  id,
  title,
  slug,
  CASE
    WHEN slug ~ '[^\x00-\x7F]' THEN 'Contains Arabic'
    WHEN slug IS NULL THEN 'NULL'
    WHEN slug = '' THEN 'Empty'
    ELSE 'Valid'
  END as slug_status
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- عرض عدد المنتجات التي تم إصلاحها
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN slug ~ '[^\x00-\x7F]' THEN 1 END) as arabic_slugs,
  COUNT(CASE WHEN slug !~ '[^\x00-\x7F]' AND slug IS NOT NULL AND slug != '' THEN 1 END) as valid_slugs
FROM products;
