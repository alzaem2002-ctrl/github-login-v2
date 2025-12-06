# تطبيق تسجيل الدخول المتقدم - الإصدار الثاني

تطبيق ويب متكامل لإدارة تسجيل الدخول والمصادقة باستخدام React و Express مع TypeScript، مع دعم Google AI و Notion.

## 🚀 المميزات

- واجهة مستخدم حديثة باستخدام React و Tailwind CSS
- نظام مصادقة آمن باستخدام Passport.js
- قاعدة بيانات PostgreSQL مع Drizzle ORM
- دعم WebSocket للتحديثات الفورية
- تكامل مع Google AI (@google/genai)
- تكامل مع Notion API
- رفع الملفات باستخدام Multer
- مكونات UI متقدمة من Radix UI
- رسوم بيانية باستخدام Recharts

## 📋 المتطلبات

- Node.js 18 أو أحدث
- PostgreSQL database
- npm أو pnpm
- حساب Google AI (اختياري)
- حساب Notion (اختياري)

## ⚙️ التثبيت

```bash
# تثبيت الحزم
npm install

# إعداد قاعدة البيانات
npm run db:push

# تشغيل المشروع في وضع التطوير
npm run dev

# بناء المشروع للإنتاج
npm run build

# تشغيل المشروع في وضع الإنتاج
npm start
```

## 🔧 متغيرات البيئة

قم بإنشاء ملف `.env` في جذر المشروع:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key
NODE_ENV=production

# اختياري - للتكامل مع Google AI
GOOGLE_AI_API_KEY=your-google-ai-key

# اختياري - للتكامل مع Notion
NOTION_API_KEY=your-notion-key
NOTION_DATABASE_ID=your-database-id
```

## 🌐 النشر على Render.com (مجاني) ⭐

### الخطوات:

1. قم بزيارة [Render.com](https://render.com) وسجل دخول
2. انقر على **New +** ثم اختر **Web Service**
3. اربط حسابك بـ GitHub واختر المستودع `github-login-v2`
4. استخدم الإعدادات التالية:
   - **Name**: github-login-v2
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. أضف قاعدة بيانات PostgreSQL:
   - انقر على **New +** ثم **PostgreSQL**
   - اختر **Free Plan**
   - انسخ **Internal Database URL**

6. أضف متغيرات البيئة:
   - `DATABASE_URL`: [الصق رابط قاعدة البيانات]
   - `NODE_ENV`: production
   - `SESSION_SECRET`: [أي نص عشوائي طويل مثل: mySecretKey123456789]
   - `GOOGLE_AI_API_KEY`: [مفتاح Google AI - اختياري]
   - `NOTION_API_KEY`: [مفتاح Notion - اختياري]

7. انقر على **Create Web Service**

**رابط التطبيق**: سيكون على شكل `https://github-login-v2.onrender.com`

## 🗄️ قاعدة البيانات المجانية

### Neon (موصى به) ⭐

1. قم بزيارة [Neon.tech](https://neon.tech)
2. أنشئ حساب مجاني
3. أنشئ مشروع جديد
4. انسخ **Connection String**
5. استخدمه في `DATABASE_URL`

**المميزات:**
- 3 GB تخزين مجاني
- PostgreSQL 15
- سريع جداً
- نسخ احتياطية تلقائية

## 📦 البنية

```
.
├── client/           # كود React Frontend
├── server/           # كود Express Backend
├── shared/           # الكود المشترك
├── script/           # سكربتات البناء
├── attached_assets/  # الملفات المرفوعة
└── dist/             # ملفات البناء
```

## 🔒 الأمان

- تشفير كلمات المرور باستخدام bcrypt
- حماية CSRF
- جلسات آمنة مع express-session
- التحقق من المدخلات باستخدام Zod
- حماية من XSS

## 🛠️ التقنيات المستخدمة

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Radix UI
- Recharts
- Framer Motion
- React Hook Form
- TanStack Query

### Backend
- Express.js
- PostgreSQL
- Drizzle ORM
- Passport.js
- WebSocket (ws)
- Multer (رفع الملفات)

### التكاملات
- Google AI (@google/genai)
- Notion API

## 📱 الاستخدام

1. قم بتسجيل حساب جديد
2. سجل الدخول
3. استخدم الميزات المتاحة
4. يمكنك رفع الملفات
5. التكامل مع Google AI و Notion (إذا تم تفعيلهما)

## 🆘 المساعدة

إذا واجهت أي مشكلة:

1. تأكد من تثبيت جميع الحزم: `npm install`
2. تأكد من إعداد قاعدة البيانات بشكل صحيح
3. تحقق من متغيرات البيئة
4. راجع السجلات في وضع التطوير: `npm run dev`
5. تأكد من تشغيل `npm run db:push` لإنشاء الجداول

## 🔄 التحديثات في الإصدار الثاني

- ✅ إضافة تكامل Google AI
- ✅ إضافة تكامل Notion API
- ✅ تحسين نظام رفع الملفات
- ✅ تحسين الأداء
- ✅ إضافة المزيد من مكونات UI

## 📝 الترخيص

MIT License

---

**الإصدار**: 2.0.0  
**آخر تحديث**: ديسمبر 2025
