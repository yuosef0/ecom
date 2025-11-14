# 🚀 دليل نشر المتجر على الإنتاج (Production)

## 📋 نظرة عامة

هذا الدليل الشامل يشرح كيفية نشر متجرك الإلكتروني على الإنترنت خطوة بخطوة.

---

## 🎯 الخيارات المتاحة للنشر

### 1. **Vercel** ⭐ (موصى به)
- ✅ **مجاني** للمشاريع الشخصية
- ✅ **سهل جداً** - نقرات قليلة فقط
- ✅ **سريع** - CDN عالمي
- ✅ **مصمم خصيصاً** لـ Next.js
- ✅ **Domain مجاني** (.vercel.app)
- ✅ **SSL مجاني** (HTTPS تلقائياً)

### 2. **Netlify**
- ✅ مجاني للمشاريع الشخصية
- ✅ سهل الاستخدام
- ✅ SSL مجاني

### 3. **Railway / Render**
- ✅ مناسب للمشاريع الأكبر
- ⚠️ قد يتطلب اشتراك مدفوع

---

## 🚀 الطريقة الموصى بها: النشر على Vercel

---

## 📝 الخطوة 1: تجهيز المشروع

### 1.1 التأكد من نظافة الكود

```bash
# تأكد أنك في مجلد المشروع
cd /path/to/ecom

# اختبر المشروع محلياً
npm run build
npm run start

# افتح http://localhost:3000 وتأكد أن كل شيء يعمل
```

### 1.2 إنشاء ملف `.gitignore` (إذا لم يكن موجوداً)

تأكد أن الملف يحتوي على:

```
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next
out
build
dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### 1.3 رفع المشروع على GitHub

```bash
# إذا لم تكن قد أنشأت git repository بعد:
git init
git add .
git commit -m "Initial commit"

# أنشئ repository جديد على GitHub
# ثم:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## 🎯 الخطوة 2: النشر على Vercel

### 2.1 إنشاء حساب على Vercel

1. اذهب إلى [https://vercel.com](https://vercel.com)
2. اضغط **Sign Up**
3. سجل باستخدام **GitHub** (موصى به)

### 2.2 استيراد المشروع

1. من لوحة تحكم Vercel، اضغط **Add New** → **Project**
2. اختر **Import Git Repository**
3. اختر الـ repository الخاص بمشروعك
4. اضغط **Import**

### 2.3 إعدادات المشروع

Vercel سيكتشف تلقائياً أنه مشروع Next.js:

- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅

**لا تحتاج لتغيير شيء هنا!**

### 2.4 إضافة المتغيرات البيئية (Environment Variables)

⚠️ **هذا الجزء مهم جداً!**

اضغط على **Environment Variables** وأضف المتغيرات التالية:

#### أ) Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### ب) Base URL:
```
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```
⚠️ **ملاحظة:** سنعدل هذا لاحقاً بعد معرفة الرابط النهائي

#### ج) Stripe:
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```
⚠️ **استخدم مفاتيح Live وليس Test!**

#### د) Paymob:
```
PAYMOB_API_KEY=your_live_api_key
PAYMOB_INTEGRATION_ID=your_live_integration_id
PAYMOB_IFRAME_ID=your_live_iframe_id
PAYMOB_HMAC_SECRET=your_live_hmac_secret
```

### 2.5 النشر!

اضغط **Deploy** 🚀

انتظر 2-3 دقائق... سيتم بناء ونشر المشروع تلقائياً!

---

## 🔗 الخطوة 3: الحصول على رابط الموقع

بعد اكتمال النشر، ستحصل على رابط مثل:

```
https://your-project-name.vercel.app
```

🎉 **مبروك! موقعك الآن على الإنترنت!**

---

## ⚙️ الخطوة 4: إعداد بوابات الدفع للإنتاج

### 4.1 تحديث Stripe Webhooks

1. اذهب إلى [Stripe Dashboard](https://dashboard.stripe.com)
2. اذهب إلى **Developers** → **Webhooks**
3. اضغط **Add endpoint**
4. أدخل URL:
   ```
   https://your-project-name.vercel.app/api/stripe/webhook
   ```
5. اختر الأحداث (Events):
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
6. اضغط **Add endpoint**
7. انسخ **Signing Secret** (يبدأ بـ `whsec_`)
8. ارجع لـ Vercel → Settings → Environment Variables
9. عدّل `STRIPE_WEBHOOK_SECRET` بالقيمة الجديدة
10. اضغط **Save** ثم **Redeploy**

### 4.2 تحديث Paymob Callback URLs

1. اذهب إلى [Paymob Dashboard](https://accept.paymob.com)
2. اذهب إلى **Settings** → **Integration Settings**
3. في **Transaction Processed Callback**:
   ```
   https://your-project-name.vercel.app/api/paymob/callback
   ```
4. في **Transaction Response Callback**:
   ```
   https://your-project-name.vercel.app/api/paymob/callback
   ```
5. اضغط **Save**

### 4.3 تحديث NEXT_PUBLIC_BASE_URL

1. اذهب إلى Vercel → Settings → Environment Variables
2. عدّل `NEXT_PUBLIC_BASE_URL`:
   ```
   https://your-project-name.vercel.app
   ```
3. اضغط **Save**
4. اذهب إلى **Deployments** → اضغط على آخر deployment
5. اضغط **Redeploy**

---

## 🌐 الخطوة 5: ربط Domain مخصص (اختياري)

إذا كنت تريد استخدام domain خاص بك (مثل: `www.mystore.com`):

### 5.1 شراء Domain

- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [Google Domains](https://domains.google)

### 5.2 ربط Domain بـ Vercel

1. في Vercel، اذهب إلى **Settings** → **Domains**
2. اضغط **Add Domain**
3. أدخل domain الخاص بك: `www.mystore.com`
4. اضغط **Add**
5. Vercel سيعطيك DNS records للإضافة

### 5.3 إعداد DNS

في موقع شراء الـ Domain:

1. اذهب إلى **DNS Settings**
2. أضف A Record:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
3. أضف CNAME Record:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. احفظ التغييرات
5. انتظر 24-48 ساعة للتحديث الكامل

### 5.4 تحديث المتغيرات

بعد ربط الـ Domain:

1. عدّل `NEXT_PUBLIC_BASE_URL` إلى:
   ```
   https://www.mystore.com
   ```
2. عدّل Stripe Webhook URL إلى:
   ```
   https://www.mystore.com/api/stripe/webhook
   ```
3. عدّل Paymob Callback URL إلى:
   ```
   https://www.mystore.com/api/paymob/callback
   ```

---

## ✅ الخطوة 6: اختبار الموقع

### 6.1 اختبارات أساسية

- ✅ افتح الموقع وتأكد من تحميل الصفحة الرئيسية
- ✅ تصفح المنتجات
- ✅ أضف منتج للسلة
- ✅ جرب التسجيل/تسجيل الدخول
- ✅ ادخل لوحة التحكم (كأدمن)
- ✅ أضف منتج جديد
- ✅ ارفع صورة

### 6.2 اختبار الدفع (مهم!)

⚠️ **استخدم بيانات حقيقية للاختبار!**

#### اختبار Stripe:
1. اذهب للسلة وأضف منتج
2. اضغط "إتمام الشراء"
3. اختر Stripe
4. استخدم بطاقة اختبار:
   ```
   رقم البطاقة: 4242 4242 4242 4242
   تاريخ الانتهاء: 12/34
   CVV: 123
   ```
5. تأكد من:
   - ✅ نجاح الدفع
   - ✅ التوجيه لصفحة النجاح
   - ✅ حفظ الطلب في قاعدة البيانات
   - ✅ تحديث حالة الدفع إلى `paid`

#### اختبار Paymob:
1. نفس الخطوات
2. اختر Paymob
3. استخدم بطاقة اختبار Paymob
4. تأكد من نفس النقاط

---

## 🔒 الخطوة 7: الأمان والحماية

### 7.1 تأمين Environment Variables

✅ **لا تشارك المفاتيح السرية أبداً**
✅ **لا تحفظها في الكود**
✅ **استخدم مفاتيح Production فقط في Production**

### 7.2 تفعيل HTTPS

- Vercel يفعل HTTPS تلقائياً ✅
- تأكد من إعادة توجيه HTTP إلى HTTPS

### 7.3 تفعيل CORS (إذا لزم)

في `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

### 7.4 Rate Limiting

فكر في إضافة حماية ضد الطلبات المتكررة (Rate Limiting) باستخدام:
- [Upstash Redis](https://upstash.com) (مجاني)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)

---

## 📊 الخطوة 8: المراقبة والتحليلات

### 8.1 Vercel Analytics (مجاني)

1. في Vercel Dashboard
2. اذهب إلى **Analytics**
3. فعّل **Web Analytics**

سيعطيك:
- عدد الزوار
- سرعة الموقع
- Core Web Vitals

### 8.2 Google Analytics (اختياري)

أضف في `src/app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🔄 الخطوة 9: التحديثات التلقائية

### 9.1 إعداد Auto-Deploy

Vercel يراقب GitHub repository تلقائياً:

1. كل مرة تعمل `git push` للـ `main` branch
2. Vercel سيبني وينشر الموقع تلقائياً
3. ستحصل على رابط Preview للاختبار

### 9.2 استخدام Branches

```bash
# للتطوير، استخدم branch منفصل:
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Vercel سينشئ preview deployment للاختبار
# بعد الاختبار، ادمج في main:
git checkout main
git merge feature/new-feature
git push origin main
```

---

## 🐛 الخطوة 10: حل المشاكل الشائعة

### المشكلة 1: Build Failed

**الحل:**
```bash
# اختبر محلياً أولاً:
npm run build

# إذا نجح محلياً ولكن فشل على Vercel:
# - تحقق من Node.js version
# - تحقق من Environment Variables
```

### المشكلة 2: 500 Internal Server Error

**الحل:**
- تحقق من Vercel Logs: Function Logs
- تحقق من Environment Variables
- تحقق من Supabase connection

### المشكلة 3: الصور لا تظهر

**الحل:**
- تحقق من Supabase Storage Policies
- تأكد من أن bucket عام (Public)

### المشكلة 4: Webhook لا يعمل

**الحل:**
- تحقق من Webhook URL
- تحقق من Webhook Secret
- تحقق من Vercel Function Logs

---

## 📈 الخطوة 11: تحسين الأداء

### 11.1 تفعيل Image Optimization

في `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
};
```

### 11.2 تفعيل الضغط

```typescript
const nextConfig = {
  compress: true,
};
```

### 11.3 استخدام Next.js Image Component

بدلاً من `<img>`:

```tsx
import Image from 'next/image';

<Image
  src={product.image_url}
  alt={product.title}
  width={300}
  height={300}
  priority
/>
```

---

## 💰 الخطوة 12: التكاليف المتوقعة

### Vercel (مجاني):
- ✅ 100 GB Bandwidth
- ✅ 100 GB-Hours Function Execution
- ✅ Unlimited Deployments

### Supabase (مجاني):
- ✅ 500 MB Database
- ✅ 1 GB File Storage
- ✅ 2 GB Bandwidth

### عند التوسع (مدفوع):
- Vercel Pro: **$20/شهر**
- Supabase Pro: **$25/شهر**

---

## ✅ Checklist قبل الإطلاق

- [ ] اختبار الموقع كاملاً على localhost
- [ ] رفع الكود على GitHub
- [ ] النشر على Vercel
- [ ] إضافة Environment Variables
- [ ] تحديث Stripe Webhooks
- [ ] تحديث Paymob Callbacks
- [ ] اختبار الدفع بـ Stripe
- [ ] اختبار الدفع بـ Paymob
- [ ] اختبار تسجيل الدخول
- [ ] اختبار لوحة التحكم
- [ ] اختبار إضافة منتجات
- [ ] اختبار رفع الصور
- [ ] تفعيل Analytics
- [ ] ربط Domain (اختياري)
- [ ] نسخ احتياطي من قاعدة البيانات
- [ ] مراجعة أمان API Keys

---

## 🎉 مبروك!

موقعك الآن على الإنترنت ويعمل بكامل طاقته! 🚀

### الخطوات القادمة:

1. **تسويق المتجر**: فيسبوك، إنستجرام، تيك توك
2. **إضافة المنتجات**: ابدأ بإضافة منتجاتك
3. **تحسين SEO**: أضف meta tags ووصف للمنتجات
4. **خدمة العملاء**: أضف واتساب أو دردشة مباشرة

---

## 📚 موارد إضافية

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Stripe Production Checklist](https://stripe.com/docs/development/checklist)

---

## 🆘 الدعم

إذا واجهت أي مشكلة:
1. راجع هذا الدليل
2. تحقق من Vercel Logs
3. تحقق من Supabase Logs
4. ابحث في GitHub Issues

**بالتوفيق! 🌟**
