-- إنشاء جدول صور السلايدر
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_slider_display_order ON slider_images(display_order);

-- تفعيل Row Level Security
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة - الجميع يمكنهم رؤية الصور النشطة
CREATE POLICY "Anyone can view active slider images"
  ON slider_images FOR SELECT
  TO public
  USING (is_active = true);

-- سياسة للأدمن لإدارة الصور
CREATE POLICY "Admins can manage slider images"
  ON slider_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_slider_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
CREATE TRIGGER slider_images_updated_at
  BEFORE UPDATE ON slider_images
  FOR EACH ROW
  EXECUTE FUNCTION update_slider_images_updated_at();

-- إضافة بعض الصور الافتراضية (اختياري)
INSERT INTO slider_images (image_url, title, display_order, is_active) VALUES
  ('/slider1.jpg', 'صورة السلايدر 1', 1, true),
  ('/slider2.jpg', 'صورة السلايدر 2', 2, true),
  ('/slider3.jpg', 'صورة السلايدر 3', 3, true)
ON CONFLICT DO NOTHING;
