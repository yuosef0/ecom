-- ================================================
-- Update Products to Add Slugs
-- تحديث المنتجات لإضافة slug لكل منتج
-- ================================================

-- دالة لتحويل النص العربي والإنجليزي إلى slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT, product_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- إزالة الأحرف الخاصة وتحويل المسافات إلى شرطات
  base_slug := LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);

  -- إذا كان الـ slug فارغ أو يحتوي على أحرف عربية فقط، استخدم ID
  IF base_slug = '' OR LENGTH(base_slug) < 3 THEN
    base_slug := 'product-' || SUBSTRING(product_id::TEXT, 1, 8);
  END IF;

  final_slug := base_slug;

  -- التحقق من عدم وجود تكرار
  WHILE EXISTS (SELECT 1 FROM products WHERE slug = final_slug AND id != product_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- تحديث جميع المنتجات التي ليس لديها slug
UPDATE products
SET slug = generate_slug(title, id)
WHERE slug IS NULL OR slug = '';

-- تحديث جميع المنتجات التي لديها slug مكرر
WITH duplicates AS (
  SELECT id, title, slug,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM products
  WHERE slug IS NOT NULL
)
UPDATE products p
SET slug = generate_slug(p.title, p.id)
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- إضافة unique constraint على slug إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_slug_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
END $$;

-- التحقق من النتائج
SELECT
  COUNT(*) as total_products,
  COUNT(slug) as products_with_slug,
  COUNT(*) - COUNT(slug) as products_without_slug
FROM products;

-- عرض بعض الأمثلة
SELECT id, title, slug FROM products LIMIT 10;
