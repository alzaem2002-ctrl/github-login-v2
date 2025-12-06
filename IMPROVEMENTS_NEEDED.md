# خطة التحسينات المطلوبة - Required Improvements Plan
# منصة علوم الذكية - GitHub Login V2

---

## 🎯 الأولويات - Priorities

### 🔴 P0: حرجة - يجب حلها قبل النشر
### 🟠 P1: عالية - يجب حلها في أقرب وقت
### 🟡 P2: متوسطة - يجب حلها خلال أسبوع
### 🟢 P3: منخفضة - تحسينات مستقبلية

---

## 🔴 المرحلة 1: إصلاحات أمنية حرجة (P0)

### 1.1 تطبيق تشفير كلمات المرور ✨

**الملفات المتأثرة:**
- `package.json` - إضافة bcrypt
- `server/routes.ts` - تحديث login/register
- `server/storage.ts` - تحديث createUser و updateUserPassword
- `shared/schema.ts` - تحديث التوثيق

**الخطوات:**

```bash
# 1. تثبيت bcrypt
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**التعديلات المطلوبة:**

```typescript
// في server/routes.ts

import bcrypt from 'bcrypt';

// تعديل Login endpoint (السطر 67)
app.post("/api/auth/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "بيانات غير صالحة" });
    }

    const { username, password } = result.data;
    const user = await storage.getUserByUsername(username);

    // ✅ استخدام bcrypt للمقارنة
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// تعديل Register endpoint (السطر 93)
app.post("/api/auth/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0]?.message || "بيانات غير صالحة" });
    }

    const { username, password, displayName } = result.data;

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "اسم المستخدم مستخدم بالفعل" });
    }

    // ✅ تشفير كلمة المرور قبل الحفظ
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ 
      username, 
      password: hashedPassword,  // ← استخدام المشفرة
      displayName 
    });
    
    req.session.userId = user.id;
    req.session.role = user.role;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// تعديل reset password endpoint (السطر 258)
app.post("/api/admin/reset-password", requireAdmin, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({ error: "يرجى تحديد المستخدم وكلمة المرور الجديدة" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }
    
    if (user.role === "admin") {
      return res.status(403).json({ error: "لا يمكن تغيير كلمة مرور المشرف" });
    }
    
    // ✅ تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await storage.updateUserPassword(userId, hashedPassword);
    
    if (success) {
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } else {
      res.status(500).json({ error: "فشل في تغيير كلمة المرور" });
    }
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// تعديل bulk import (السطر 321)
// في حلقة إنشاء المستخدمين:
const password = `${firstName}123`;
const hashedPassword = await bcrypt.hash(password, 10);

await storage.createUser({
  username,
  password: hashedPassword,  // ← استخدام المشفرة
  displayName: `${name} - ${className || ''}`
});
```

```typescript
// في server/storage.ts

// تعديل initializeData (السطر 151)
async initializeData(): Promise<void> {
  const existingAdmin = await this.getUserByUsername(defaultConfig.adminUsername);
  if (!existingAdmin) {
    // ✅ تشفير كلمة مرور المدير
    const hashedPassword = await bcrypt.hash(defaultConfig.adminPassword, 10);
    await db.insert(users).values({
      id: "admin",
      username: defaultConfig.adminUsername,
      password: hashedPassword,  // ← استخدام المشفرة
      role: "admin",
      displayName: "المشرف"
    });
  }
  // ... بقية الكود
}
```

---

### 1.2 إزالة بيانات الاعتماد الحساسة 🗑️

**الخطوات:**

```bash
# 1. إضافة إلى .gitignore
echo "" >> .gitignore
echo "# Sensitive data" >> .gitignore
echo "student_credentials.*" >> .gitignore
echo "*.csv" >> .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore

# 2. إنشاء .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session
SESSION_SECRET=your-random-secret-key-here

# Optional - Google AI
GEMINI_API_KEY=your-gemini-api-key

# Optional - Notion
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-notion-database-id

# Node Environment
NODE_ENV=development
PORT=5000
EOF

# 3. حذف الملفات من Git history (خطير - يتطلب force push)
git rm --cached student_credentials.txt
git rm --cached student_credentials.csv
git commit -m "Remove sensitive credential files"

# ملاحظة: لحذف من التاريخ بالكامل (يتطلب صلاحيات force push):
# git filter-branch --force --index-filter \
#   "git rm --cached --ignore-unmatch student_credentials.*" \
#   --prune-empty --tag-name-filter cat -- --all
```

**إنشاء ملف بيانات وهمية للاختبار:**

```bash
# إنشاء test_users.example.json (للتطوير فقط)
cat > test_users.example.json << 'EOF'
{
  "note": "بيانات وهمية للاختبار فقط - لا تستخدم في الإنتاج",
  "users": [
    {
      "username": "student1",
      "password": "test123456",
      "displayName": "طالب تجريبي 1"
    },
    {
      "username": "student2",
      "password": "test123456",
      "displayName": "طالب تجريبي 2"
    }
  ]
}
EOF
```

---

### 1.3 تأمين بيانات المدير 🔐

**التعديلات المطلوبة:**

```typescript
// في shared/schema.ts (السطر 78)

export const defaultConfig: PlatformConfig = {
  siteName: process.env.SITE_NAME || "منصة علوم الذكية",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || (() => {
    // إذا لم يتم تعيين كلمة مرور، إنشاء واحدة عشوائية
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(16).toString('hex');
    console.warn('⚠️  تحذير: لم يتم تعيين ADMIN_PASSWORD. كلمة المرور العشوائية:', randomPassword);
    return randomPassword;
  })(),
  allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
  defaultLanguage: "ar",
};
```

**تحديث server/index.ts:**

```typescript
// في بداية الملف، قبل تهيئة التطبيق
if (process.env.NODE_ENV === 'production') {
  if (!process.env.SESSION_SECRET) {
    throw new Error('❌ SESSION_SECRET environment variable is required in production');
  }
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('❌ ADMIN_PASSWORD environment variable is required in production');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL environment variable is required in production');
  }
}
```

---

### 1.4 تحديث SESSION_SECRET 🔑

```typescript
// في server/index.ts (السطر 39)

const sessionSecret = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === 'production' && !sessionSecret) {
  throw new Error('SESSION_SECRET is required in production mode');
}

if (!sessionSecret || sessionSecret === 'ojudge-secret-key-2025') {
  console.warn('⚠️  تحذير: يُستخدم مفتاح جلسة افتراضي. يرجى تعيين SESSION_SECRET في .env');
}

app.use(
  session({
    secret: sessionSecret || "ojudge-secret-key-2025",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'strict',  // ← إضافة حماية CSRF
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
```

---

## 🟠 المرحلة 2: إصلاحات أمنية عالية (P1)

### 2.1 تحديث التبعيات

```bash
npm audit fix
npm update
```

### 2.2 إضافة Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
// في server/routes.ts (بعد imports)
import rateLimit from 'express-rate-limit';

// قبل تعريف الـ routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً',
  standardHeaders: true,
  legacyHeaders: false,
});

// استخدام مع endpoints الحساسة
app.post("/api/auth/login", authLimiter, async (req, res) => {
  // ...
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  // ...
});
```

---

### 2.3 تحسين File Upload Security

```typescript
// في server/routes.ts (السطر 27)

import { fileTypeFromBuffer } from 'file-type';

const fileFilter = async (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'video/mp4',
    'video/webm',
    'application/pdf'
  ];
  
  // ✅ التحقق من MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("نوع الملف غير مدعوم"));
  }
  
  // ✅ التحقق من الامتداد أيضاً
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const allowedExts = ["png", "jpg", "jpeg", "gif", "mp4", "webm", "pdf"];
  
  if (!allowedExts.includes(ext)) {
    return cb(new Error("امتداد الملف غير مدعوم"));
  }
  
  cb(null, true);
};
```

---

### 2.4 إضافة CSRF Protection

```bash
npm install csurf cookie-parser
```

```typescript
// في server/index.ts
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

app.use(cookieParser());

// تطبيق CSRF على جميع POST/PUT/DELETE requests
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// إضافة endpoint للحصول على CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## 🟡 المرحلة 3: تحسينات أمنية متوسطة (P2)

### 3.1 إضافة Security Headers

```bash
npm install helmet
```

```typescript
// في server/index.ts (بعد const app = express())
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

### 3.2 تحسين Error Handling

```typescript
// في server/index.ts (السطر 96)

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // ✅ عدم كشف تفاصيل الأخطاء في الإنتاج
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', err);
    res.status(status).json({ 
      error: status === 500 ? 'حدث خطأ في الخادم' : message 
    });
  } else {
    res.status(status).json({ 
      error: message,
      stack: err.stack 
    });
  }
  
  // لا ترمي الخطأ مرة أخرى
  // throw err; ← احذف هذا السطر
});
```

---

### 3.3 تحسين Code Sandbox Security

```typescript
// في server/services/sandbox.ts

// ✅ إضافة المزيد من الأنماط الخطرة
const DANGEROUS_PATTERNS = [
  /import\s+(os|sys|subprocess|shutil|socket|urllib|requests)/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /__import__\s*\(/i,
  /open\s*\(/i,
  /file\s*\(/i,
  /compile\s*\(/i,
  /globals\s*\(/i,
  /locals\s*\(/i,
  /vars\s*\(/i,
  /dir\s*\(/i,
  /rm\s+-rf/i,
  /del\s+/i,
  /require\s*\(\s*['"]child_process['"]\s*\)/i,
  /require\s*\(\s*['"]fs['"]\s*\)/i,
  /process\./i,
];

// ✅ إضافة timeout للتنفيذ
const EXECUTION_TIMEOUT = 5000; // 5 seconds

function executePythonLocally(code: string, testCases: TestCase[]): ExecutionResult {
  const startTime = Date.now();
  
  // ✅ فحص الوقت في كل iteration
  for (const testCase of testCases) {
    if (Date.now() - startTime > EXECUTION_TIMEOUT) {
      return { error: 'تجاوز وقت التنفيذ المسموح' };
    }
    // ... بقية الكود
  }
}
```

---

### 3.4 إضافة Input Validation الشامل

```typescript
// في shared/schema.ts

// تحسين validation schemas
export const registerSchema = z.object({
  username: z.string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(50, "اسم المستخدم يجب أن لا يتجاوز 50 حرف")
    .regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100, "كلمة المرور طويلة جداً")
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, "كلمة المرور يجب أن تحتوي على أحرف وأرقام"),
  displayName: z.string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
});

export const submitCodeSchema = z.object({
  problemId: z.string().uuid("معرف المسألة غير صالح"),
  code: z.string()
    .min(1, "الكود مطلوب")
    .max(10000, "الكود طويل جداً"),
});
```

---

## 🟢 المرحلة 4: تحسينات عامة (P3)

### 4.1 إضافة Logging

```bash
npm install winston
```

```typescript
// إنشاء server/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

### 4.2 إضافة Health Check Endpoint

```typescript
// في server/routes.ts
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
```

---

### 4.3 تحسين Database Connection

```typescript
// في server/db.ts
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // ✅ حد أقصى للاتصالات
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ✅ معالجة أخطاء الاتصال
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});
```

---

## 📝 Checklist للتنفيذ

### المرحلة 1 (حرجة - P0)
- [ ] تثبيت bcrypt
- [ ] تحديث login endpoint لاستخدام bcrypt
- [ ] تحديث register endpoint لاستخدام bcrypt
- [ ] تحديث reset password لاستخدام bcrypt
- [ ] تحديث initializeData لتشفير كلمة مرور المدير
- [ ] حذف student_credentials.* من Git
- [ ] إضافة .env.example
- [ ] تحديث .gitignore
- [ ] نقل ADMIN_PASSWORD إلى .env
- [ ] جعل SESSION_SECRET إلزامي في الإنتاج

### المرحلة 2 (عالية - P1)
- [ ] npm audit fix
- [ ] إضافة express-rate-limit
- [ ] تطبيق rate limiting على /login و /register
- [ ] تحسين file upload validation
- [ ] إضافة CSRF protection

### المرحلة 3 (متوسطة - P2)
- [ ] إضافة Helmet.js
- [ ] تحسين error handling
- [ ] تحسين sandbox security
- [ ] تحسين input validation

### المرحلة 4 (منخفضة - P3)
- [ ] إضافة Winston logging
- [ ] إضافة health check endpoint
- [ ] تحسين database connection

---

## 🧪 الاختبار

بعد كل مرحلة:
1. اختبار تسجيل الدخول
2. اختبار التسجيل
3. اختبار رفع الملفات
4. اختبار submit code
5. اختبار admin endpoints

---

**آخر تحديث:** 6 ديسمبر 2025
