# دليل الإعداد الكامل لنظام الكوبونات - Complete Setup Guide (UPDATED)

## ⚠️ المشكلة الحقيقية / The Real Problem

كنت تواجه خطأ `TypeError: fetch failed` عند محاولة إضافة كوبونات. الأسباب:

1. **API routes كانت تستخدم Supabase client غير مصادق عليه** ✅ **تم إصلاحه**
2. **سياسات RLS تستخدم جدول خاطئ** ❌ **اكتشفنا المشكلة!**

### 🔍 اكتشاف مهم!

التطبيق يستخدم جدول **`admins`** للتحقق من صلاحيات المسؤول، وليس `profiles.is_admin`!

انظر الملف `/src/contexts/AuthContext.tsx` في السطر 53-58:
```javascript
const { data, error } = await supabase
  .from("admins")  // ← يستخدم جدول admins!
  .select("role, is_active")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .single();
```

---

## ✅ التغييرات التي تمت في الكود / Code Changes Made

### 1. تم إنشاء ملف Server Client جديد ✅
**File:** `/src/lib/supabaseServer.ts`

دالة `createServerClient()` تنشئ Supabase client مصادق عليه يستخدم session المستخدم من cookies.

### 2. تم تحديث API Routes ✅
تم تحديث الملفات التالية لاستخدام الـ authenticated client:
- `/src/app/api/coupons/route.ts` (GET, POST)
- `/src/app/api/coupons/[id]/route.ts` (GET, PUT, DELETE)

### 3. تم إنشاء سياسات RLS المحدثة ✅
**File:** `/supabase-policies/coupons-rls-policies-FIXED.sql`

السياسات الآن تستخدم جدول **`admins`** بدلاً من `profiles.is_admin` ← هذا هو الصحيح!

---

## 🔧 الخطوات المطلوبة منك الآن / Required Steps

### الخطوة 1: افتح Supabase SQL Editor
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. من القائمة الجانبية، اختر **SQL Editor**

---

### الخطوة 2: تحقق من وجود جدول admins

```sql
-- تحقق من وجود جدول admins
SELECT * FROM admins LIMIT 1;
```

**إذا ظهر خطأ `relation "admins" does not exist`:**
- نفذ ملف `create-admins-table.sql` أولاً (انتقل إلى الخطوة 2.1)

**إذا عمل الاستعلام بنجاح:**
- انتقل مباشرة إلى الخطوة 3

#### الخطوة 2.1: إنشاء جدول admins (إذا لم يكن موجوداً)

استخدم ملف `/supabase-policies/create-admins-table.sql` أو نفذ هذا الكود:

```sql
-- إنشاء جدول admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- إنشاء فهارس
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- تفعيل RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
```

---

### الخطوة 3: أضف نفسك كمسؤول

**⚠️ استبدل 'your-email@example.com' ببريدك الإلكتروني الفعلي!**

```sql
-- إضافة نفسك كمسؤول
INSERT INTO admins (user_id, role, is_active)
SELECT
  id,
  'super_admin',
  true
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = true, role = 'super_admin', updated_at = NOW();

-- التحقق من النتيجة
SELECT
  a.user_id,
  a.role,
  a.is_active,
  u.email
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE u.email = 'your-email@example.com';
```

**يجب أن ترى:**
- `role`: super_admin
- `is_active`: true
- `email`: بريدك الإلكتروني

---

### الخطوة 4: تطبيق سياسات RLS المحدثة للكوبونات

استخدم ملف `/supabase-policies/coupons-rls-policies-FIXED.sql` أو نفذ هذا الكود:

```sql
-- 1. حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
DROP POLICY IF EXISTS "Allow users to read active coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to read all coupons" ON coupons;

-- 2. إنشاء سياسات جديدة تستخدم جدول admins

-- السماح للمسؤولين بإضافة كوبونات
CREATE POLICY "Allow admins to insert coupons"
ON coupons FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- السماح للمسؤولين بتحديث الكوبونات
CREATE POLICY "Allow admins to update coupons"
ON coupons FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- السماح للمسؤولين بحذف الكوبونات
CREATE POLICY "Allow admins to delete coupons"
ON coupons FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- السماح للجميع بقراءة الكوبونات النشطة
CREATE POLICY "Allow users to read active coupons"
ON coupons FOR SELECT TO authenticated
USING (is_active = true);

-- السماح للمسؤولين بقراءة جميع الكوبونات
CREATE POLICY "Allow admins to read all coupons"
ON coupons FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);
```

---

## 🧪 التحقق من الإعداد / Verification

### 1. تحقق من أنك admin في جدول admins
```sql
SELECT
  a.role,
  a.is_active,
  u.email
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id = auth.uid();
```

**يجب أن ترى:**
- `role`: super_admin أو admin
- `is_active`: true
- `email`: بريدك الإلكتروني

### 2. تحقق من السياسات
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;
```

**يجب أن ترى 5 سياسات:**
1. Allow admins to delete coupons (DELETE)
2. Allow admins to insert coupons (INSERT)
3. Allow admins to read all coupons (SELECT)
4. Allow admins to update coupons (UPDATE)
5. Allow users to read active coupons (SELECT)

### 3. اختبار إضافة كوبون مباشرة في SQL
```sql
INSERT INTO coupons (
  code,
  description,
  discount_type,
  discount_value,
  min_purchase_amount,
  is_active,
  used_count
) VALUES (
  'TEST10',
  'كوبون تجريبي',
  'percentage',
  10,
  0,
  true,
  0
);
```

**إذا نجح:** حسابك admin ويعمل بشكل صحيح! ✅
**إذا فشل:** راجع الخطوات أعلاه، تأكد أنك في جدول admins

---

## 🎯 الاختبار النهائي / Final Test

1. **سجل الخروج وسجل الدخول مرة أخرى** في التطبيق
2. انتقل إلى صفحة **إدارة الكوبونات** (`/admin/coupons`)
3. اضغط على **"إضافة كوبون جديد"**
4. املأ النموذج:
   - الكود: `SAVE20`
   - نوع الخصم: نسبة مئوية
   - قيمة الخصم: 20
5. اضغط "إضافة الكوبون"

**النتيجة المتوقعة:**
- ✅ لا يظهر خطأ `TypeError: fetch failed`
- ✅ تظهر رسالة "تم إضافة الكوبون بنجاح!"
- ✅ يظهر الكوبون في الجدول

---

## 🔍 استكشاف الأخطاء / Troubleshooting

### إذا استمر الخطأ "TypeError: fetch failed"

#### 1. تحقق من session في المتصفح
افتح Console (F12) ونفذ:
```javascript
const { data } = await (await fetch('/api/coupons')).json();
console.log('API Response:', data);
```

#### 2. تحقق من أنك في جدول admins
```sql
SELECT COUNT(*) as admin_count
FROM admins
WHERE user_id = auth.uid() AND is_active = true;
```
**يجب أن يكون:** `admin_count = 1`

#### 3. تحقق من session في Supabase
في Console المتصفح:
```javascript
import { supabase } from '../lib/supabaseClient';
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session?.user?.email);
```

#### 4. تحقق من Logs في Supabase Dashboard
- اذهب إلى **Logs** في Supabase Dashboard
- انظر إلى API Logs
- ابحث عن أخطاء RLS

### إذا كنت ترى خطأ "relation admins does not exist"
- نفذ الخطوة 2.1 (إنشاء جدول admins)

### إذا كنت ترى خطأ "new row violates row-level security policy"
- تأكد من وجودك في جدول admins:
  ```sql
  SELECT * FROM admins WHERE user_id = auth.uid();
  ```
- إذا لم تكن موجوداً، نفذ الخطوة 3 (إضافة نفسك كمسؤول)

---

## 📝 ملاحظات إضافية / Additional Notes

### الفرق بين الطريقتين

**❌ الطريقة القديمة (خاطئة):**
```sql
-- كانت تستخدم profiles.is_admin
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
```

**✅ الطريقة الصحيحة (محدثة):**
```sql
-- تستخدم جدول admins
EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)
```

### جداول أخرى قد تحتاج نفس التحديث
إذا واجهت نفس المشكلة مع جداول أخرى (products, categories, orders, slider)، استخدم نفس المنطق:
- استبدل `profiles.is_admin = true` بـ
- `EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)`

### ملفات SQL المساعدة
- `create-admins-table.sql` - إنشاء جدول admins إذا لم يكن موجوداً
- `add-admin-user.sql` - إضافة مستخدم كمسؤول
- `coupons-rls-policies-FIXED.sql` - سياسات RLS المحدثة
- `drop-all-policies.sql` - حذف جميع السياسات القديمة

---

## 🎉 انتهى!

بعد تنفيذ هذه الخطوات **بالترتيب الصحيح**، يجب أن يعمل نظام الكوبونات بشكل كامل!

**التدفق الكامل:**
```
User Login → Session Stored in Cookies → API Route gets session →
createServerClient() extracts session → Supabase query with user context →
RLS checks admins table → User is admin → Query succeeds! ✅
```

إذا واجهت أي مشاكل بعد تنفيذ جميع الخطوات:
1. تحقق من Console في المتصفح (F12)
2. تحقق من Logs في Supabase Dashboard
3. تأكد من تنفيذ جميع الخطوات بالترتيب المذكور أعلاه
4. تأكد من استبدال البريد الإلكتروني ببريدك الفعلي!
