# سياسات أمان Supabase (Row Level Security)

هذا المجلد يحتوي على سياسات أمان Row Level Security (RLS) للجداول في قاعدة البيانات.

## المشكلة

عند محاولة إضافة أو تعديل البيانات في جداول معينة (مثل `coupons`)، قد تظهر الرسالة:
```
new row violates row-level security policy for table "coupons"
```

هذا يعني أن الجدول محمي بسياسات RLS، ولا توجد سياسة تسمح للمستخدم الحالي بتنفيذ العملية.

## الحل

### الخطوة 1: التحقق من وجود عمود `is_admin` في جدول `profiles`

قبل تطبيق السياسات، تأكد من أن جدول `profiles` يحتوي على عمود `is_admin`:

```sql
-- تحقق من وجود العمود
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- إذا لم يكن موجوداً، أضفه:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### الخطوة 2: جعل المستخدم الحالي مسؤولاً

ستحتاج إلى تعيين `is_admin = true` للمستخدم الذي تريد أن يكون مسؤولاً:

```sql
-- استبدل 'your-user-id' بمعرف المستخدم الخاص بك
UPDATE profiles
SET is_admin = true
WHERE id = 'your-user-id';

-- أو إذا كنت تعرف البريد الإلكتروني:
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

### الخطوة 3: تطبيق سياسات RLS

1. افتح **Supabase Dashboard**
2. اذهب إلى **SQL Editor** من القائمة الجانبية
3. افتح ملف `coupons-rls-policies.sql`
4. انسخ محتوى الملف والصقه في SQL Editor
5. اضغط على **Run** لتنفيذ الاستعلامات

## السياسات المطبقة

### لجدول `coupons`:

1. **السماح للمسؤولين بإضافة كوبونات**: يسمح فقط للمستخدمين الذين `is_admin = true` بإضافة كوبونات جديدة
2. **السماح للمسؤولين بتحديث الكوبونات**: يسمح فقط للمسؤولين بتعديل الكوبونات
3. **السماح للمسؤولين بحذف الكوبونات**: يسمح فقط للمسؤولين بحذف الكوبونات
4. **السماح للمستخدمين بقراءة الكوبونات النشطة**: يسمح لجميع المستخدمين المسجلين بقراءة الكوبونات النشطة فقط
5. **السماح للمسؤولين بقراءة جميع الكوبونات**: يسمح للمسؤولين برؤية جميع الكوبونات (نشطة وغير نشطة)

## التحقق من تطبيق السياسات

بعد تطبيق السياسات، تحقق من أنها تعمل بشكل صحيح:

```sql
-- عرض جميع السياسات على جدول coupons
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'coupons';
```

## حذف السياسات (إذا لزم الأمر)

إذا كنت بحاجة لإعادة تطبيق السياسات أو حذفها:

```sql
DROP POLICY IF EXISTS "Allow admins to insert coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to update coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to delete coupons" ON coupons;
DROP POLICY IF EXISTS "Allow users to read active coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admins to read all coupons" ON coupons;
```

## جداول أخرى قد تحتاج سياسات مشابهة

إذا واجهت نفس المشكلة مع جداول أخرى مثل:
- `products`
- `categories`
- `orders`
- `slider`

يمكنك تطبيق نفس المنهجية عليها.

## الأمان

⚠️ **هام**: تأكد من أن سياسات RLS مطبقة بشكل صحيح لحماية بياناتك. لا تقم بتعطيل RLS على الجداول التي تحتوي على بيانات حساسة.

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من أن المستخدم الحالي لديه `is_admin = true`
2. تحقق من أن السياسات مطبقة بشكل صحيح
3. راجع سجلات الأخطاء في Supabase Dashboard
