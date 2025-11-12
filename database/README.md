# Database Schema - E-Commerce Store
# قاعدة بيانات المتجر الإلكتروني

## 📋 المحتويات / Contents

- `complete-schema.sql` - ملف SQL شامل يحتوي على قاعدة البيانات كاملة
- `setup-admin.sql` - ملف لإضافة أول مسؤول (admin)

## 🚀 كيفية الاستخدام / How to Use

### الطريقة 1: في Supabase Dashboard (موصى بها)

1. **افتح Supabase Dashboard**
   - اذهب إلى https://app.supabase.com
   - اختر مشروعك (أو أنشئ مشروع جديد)

2. **افتح SQL Editor**
   - من القائمة الجانبية → SQL Editor
   - اضغط "New Query"

3. **نفذ الملفات بالترتيب:**

   **أ) نفذ complete-schema.sql**
   - افتح ملف `complete-schema.sql`
   - انسخ المحتوى كاملاً
   - الصقه في SQL Editor
   - اضغط "Run" أو `Ctrl+Enter`

   **ب) أضف نفسك كمسؤول**
   - افتح ملف `setup-admin.sql`
   - استبدل `'your-email@example.com'` ببريدك الإلكتروني
   - نفذ الكود

4. **تحقق من النتيجة**
   ```sql
   -- عرض جميع الجداول
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;

   -- عرض جميع الـ policies
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;

   -- تحقق من أنك admin
   SELECT * FROM admins WHERE user_id = auth.uid();
   ```

### الطريقة 2: باستخدام Supabase CLI

```bash
# 1. ثبت Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link مشروعك
supabase link --project-ref YOUR_PROJECT_REF

# 4. طبق Schema
supabase db push --file database/complete-schema.sql

# 5. أضف نفسك كمسؤول
supabase db push --file database/setup-admin.sql
```

---

## 📊 بنية قاعدة البيانات / Database Structure

### الجداول / Tables

1. **profiles** - ملفات تعريف المستخدمين
2. **admins** - المسؤولون
3. **categories** - أقسام المنتجات
4. **products** - المنتجات
5. **orders** - الطلبات
6. **reviews** - تقييمات المنتجات
7. **wishlists** - قائمة المفضلة
8. **coupons** - كوبونات الخصم
9. **slider_images** - صور السلايدر الرئيسي

### العلاقات / Relationships

```
auth.users (Supabase Auth)
    ├── profiles (1:1)
    └── admins (1:1)

categories
    ├── categories (self-referencing for sub-categories)
    └── products (1:n)

products
    ├── reviews (1:n)
    ├── wishlists (1:n)
    └── orders.items (JSONB reference)

orders
    └── items (JSONB array)
```

---

## 🔐 Row Level Security (RLS)

جميع الجداول محمية بـ RLS policies:

### Public Access (بدون تسجيل دخول)
- ✅ قراءة categories النشطة
- ✅ قراءة products النشطة
- ✅ قراءة reviews المعتمدة
- ✅ قراءة slider_images النشطة
- ✅ إنشاء orders (للشراء)
- ✅ إدارة wishlists

### Authenticated Users (مستخدمين مسجلين)
- ✅ قراءة/تحديث ملفهم الشخصي
- ✅ قراءة طلباتهم الخاصة
- ✅ إضافة تقييمات

### Admins (المسؤولون)
- ✅ إدارة كاملة لجميع الجداول
- ✅ قراءة جميع البيانات
- ✅ إضافة/تحديث/حذف

---

## 📦 Storage Buckets

يجب إنشاء Storage Buckets يدوياً في Supabase Dashboard:

### في Dashboard > Storage:

1. **products-imges** - صور المنتجات
2. **category-images** - صور الأقسام
3. **slider-images** - صور السلايدر
4. **avatars** - صور الملفات الشخصية

**الإعدادات:**
- ✅ Public: true (للوصول العام)
- ✅ File size limit: 50MB
- ✅ Allowed MIME types: image/*

---

## ⚙️ Environment Variables

تأكد من وجود هذه المتغيرات في ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

للحصول على service role key (للعمليات الإدارية):
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🔍 Verification Queries

### تحقق من الجداول
```sql
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### تحقق من RLS Policies
```sql
SELECT
    tablename,
    policyname,
    cmd as operation,
    permissive,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### تحقق من Indexes
```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### تحقق من Foreign Keys
```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## 🐛 Troubleshooting

### مشكلة: "relation already exists"
```sql
-- احذف الجدول الموجود أولاً (احذر: سيحذف جميع البيانات!)
DROP TABLE IF EXISTS table_name CASCADE;
```

### مشكلة: "policy already exists"
```sql
-- احذف الـ policy القديمة
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### مشكلة: "permission denied"
تأكد من:
1. أنك مسجل دخول كمستخدم له صلاحيات
2. RLS policies تسمح بالعملية
3. استخدم service_role key للعمليات الإدارية

---

## 📝 Notes

1. **Backup**: دائماً احفظ نسخة احتياطية قبل تطبيق تغييرات كبيرة
   ```sql
   -- في Supabase Dashboard: Database > Backups
   ```

2. **Migrations**: استخدم Supabase Migrations للتغييرات المستقبلية
   ```bash
   supabase migration new your_migration_name
   ```

3. **Security**: لا تشارك service_role_key أبداً في كود client-side

---

## 🆘 Support

إذا واجهت مشاكل:
1. راجع Supabase Logs: Dashboard > Logs
2. تحقق من PostgreSQL error messages
3. راجع Supabase Documentation: https://supabase.com/docs

---

## ✅ Checklist بعد التنفيذ

- [ ] جميع الجداول تم إنشاؤها
- [ ] RLS مفعل على جميع الجداول
- [ ] Policies تم إنشاؤها بنجاح
- [ ] Indexes تم إنشاؤها
- [ ] Storage Buckets تم إنشاؤها
- [ ] تم إضافة Super Admin الأول
- [ ] Environment variables تم تكوينها
- [ ] التطبيق يعمل بنجاح

---

**Created:** 2025-11-12
**Version:** 1.0.0
**Database:** PostgreSQL (Supabase)
