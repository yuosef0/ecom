# دليل الإعداد الكامل لنظام الكوبونات - Complete Setup Guide

## المشكلة / The Problem

كنت تواجه خطأ `TypeError: fetch failed` عند محاولة إضافة كوبونات. السبب كان:
1. **API routes كانت تستخدم Supabase client غير مصادق عليه (unauthenticated)**
2. **سياسات RLS موجودة لكن حسابك ليس admin**

---

## ✅ التغييرات التي تمت في الكود / Code Changes Made

### 1. تم إنشاء ملف Server Client جديد
**File:** `/src/lib/supabaseServer.ts`

هذا الملف يحتوي على دالة `createServerClient()` التي تنشئ Supabase client مصادق عليه يستخدم session المستخدم من الـ cookies.

### 2. تم تحديث API Routes
تم تحديث الملفات التالية لاستخدام الـ authenticated client:
- `/src/app/api/coupons/route.ts` (GET, POST)
- `/src/app/api/coupons/[id]/route.ts` (GET, PUT, DELETE)

**ملاحظة مهمة:** الآن API routes تستخدم session المستخدم المسجل، لذلك ستعمل سياسات RLS بشكل صحيح!

---

## 🔧 الخطوات المطلوبة منك الآن / Required Steps

### الخطوة 1: افتح Supabase SQL Editor
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. من القائمة الجانبية، اختر **SQL Editor**

### الخطوة 2: نفذ هذا الكود SQL (بهذا الترتيب)

#### أ) حذف السياسات القديمة إذا كانت موجودة
```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
DROP POLICY IF EXISTS "Allow users to read active coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to read all coupons" ON coupons;
```

#### ب) إضافة عمود is_admin إلى جدول profiles
```sql
-- إضافة عمود is_admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- إنشاء فهرس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
```

#### ج) جعل حسابك مسؤولاً (admin)
**⚠️ استبدل 'your-email@example.com' ببريدك الإلكتروني الفعلي!**

```sql
-- جعل حسابك admin
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- التحقق من النتيجة
SELECT
  u.email,
  p.full_name,
  p.is_admin
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';
```

**يجب أن ترى:** `is_admin = true` في النتيجة

#### د) إنشاء سياسات RLS للكوبونات
```sql
-- 1. السماح للمسؤولين بإضافة كوبونات
CREATE POLICY "Allow admins to insert coupons"
ON coupons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 2. السماح للمسؤولين بتحديث الكوبونات
CREATE POLICY "Allow admins to update coupons"
ON coupons
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 3. السماح للمسؤولين بحذف الكوبونات
CREATE POLICY "Allow admins to delete coupons"
ON coupons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 4. السماح للمستخدمين بقراءة الكوبونات النشطة
CREATE POLICY "Allow users to read active coupons"
ON coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. السماح للمسؤولين بقراءة جميع الكوبونات
CREATE POLICY "Allow admins to read all coupons"
ON coupons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

---

## 🧪 التحقق من الإعداد / Verification

### 1. تحقق من أن السياسات تم إنشاؤها بنجاح
```sql
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;
```

**يجب أن ترى 5 سياسات:**
1. Allow admins to delete coupons
2. Allow admins to insert coupons
3. Allow admins to read all coupons
4. Allow admins to update coupons
5. Allow users to read active coupons

### 2. تحقق من أن حسابك admin
```sql
SELECT is_admin FROM profiles WHERE id = auth.uid();
```

**يجب أن ترى:** `true`

### 3. جرب إضافة كوبون تجريبي
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
**إذا فشل:** راجع الخطوات أعلاه

---

## 🎯 الاختبار النهائي / Final Test

1. **سجل الخروج وسجل الدخول مرة أخرى** في التطبيق
2. انتقل إلى صفحة **إدارة الكوبونات**
3. اضغط على **"إضافة كوبون جديد"**
4. املأ النموذج وجرب إضافة كوبون

**النتيجة المتوقعة:**
- ✅ يجب أن يعمل النموذج بنجاح
- ✅ يجب أن ترى رسالة "تم إضافة الكوبون بنجاح!"
- ✅ يجب أن يظهر الكوبون في الجدول

---

## 🔍 استكشاف الأخطاء / Troubleshooting

### إذا استمر الخطأ "fetch failed"

1. **تحقق من تسجيل الدخول:**
   - تأكد أنك مسجل دخول في التطبيق
   - جرب تسجيل الخروج وتسجيل الدخول مرة أخرى

2. **تحقق من is_admin:**
   ```sql
   SELECT u.email, p.is_admin
   FROM auth.users u
   JOIN profiles p ON p.id = u.id
   WHERE u.id = auth.uid();
   ```

3. **تحقق من السياسات:**
   ```sql
   SELECT COUNT(*) FROM pg_policies WHERE tablename = 'coupons';
   ```
   يجب أن ترى: `5`

4. **تحقق من RLS مفعل:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'coupons';
   ```
   يجب أن ترى: `rowsecurity = true`

### إذا كنت ترى خطأ "column is_admin does not exist"
- نفذ الخطوة (ب) مرة أخرى من الخطوات المطلوبة أعلاه

### إذا كنت ترى خطأ "policy already exists"
- نفذ الخطوة (أ) أولاً لحذف السياسات القديمة

---

## 📝 ملاحظات إضافية / Additional Notes

### جداول أخرى قد تحتاج نفس الإعداد
إذا واجهت نفس المشكلة مع جداول أخرى، يمكنك استخدام:
- `supabase-policies/all-admin-policies.sql` - سياسات شاملة لجميع جداول الـ admin
- الجداول: products, categories, orders, slider, coupons

### نصيحة أمنية
⚠️ **لا تعطل RLS على الجداول الحساسة**
⚠️ **تأكد دائماً من أن السياسات تعمل بشكل صحيح قبل النشر للإنتاج**

---

## 🎉 انتهى!

بعد تنفيذ هذه الخطوات، يجب أن يعمل نظام الكوبونات بشكل كامل!

إذا واجهت أي مشاكل، تحقق من:
1. Console في المتصفح (F12)
2. Logs في Supabase Dashboard
3. تأكد من تنفيذ جميع الخطوات بالترتيب الصحيح
