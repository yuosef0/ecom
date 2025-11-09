-- حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS orders CASCADE;

-- إنشاء جدول الطلبات
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- معلومات الدفع
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paymob_order_id TEXT,
  paymob_transaction_id TEXT,

  -- معلومات الطلب
  items JSONB NOT NULL,

  -- معلومات العميل
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city TEXT NOT NULL,

  -- التوقيت
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paymob_order_id ON orders(paymob_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- تفعيل Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة - المستخدمون يمكنهم رؤية طلباتهم فقط
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسة للإضافة - المستخدمون يمكنهم إنشاء طلبات
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- سياسة للأدمن لقراءة جميع الطلبات
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- سياسة للأدمن لتحديث الطلبات (تغيير الحالة)
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );
