# 🤖 دليل Workflow الـ GitHub — SMART PRINT

## نظرة عامة على المسار

```
تكتب الكود محلياً
      ↓
git add / commit
      ↓
git push ──► GitHub (فرع)
      ↓
فتح Pull Request
      ↓
┌─────────────────────────────────────────┐
│ GitHub Actions يشتغل تلقائياً:          │
│  1. Checkout                            │
│  2. Setup .NET 8 SDK                    │
│  3. dotnet restore / publish            │
│  4. رفع SMART_PRINT_Win11_x64.exe       │
│     في Artifacts                        │
└─────────────────────────────────────────┘
      ↓
Merge PR في main
      ↓
git tag v1.0.0 && git push --tags
      ↓
GitHub Release تلقائياً + ملف .exe مرفق ✅
```

---

## 1️⃣ الـ Workflow الحالي (`.github/workflows/build.yml`)

```yaml
name: Build SMART PRINT Windows Executable

on:
  push:
    branches: ["main", "master"]
  pull_request:
    branches: ["main", "master"]
  workflow_dispatch:        # تشغيل يدوي من تبويب Actions

jobs:
  build-and-publish:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4                  # 1) جلب الكود
      - uses: actions/setup-dotnet@v4             # 2) تنصيب .NET 8
        with:
          dotnet-version: '8.0.x'
      - uses: actions/cache@v4                    # 3) كاش NuGet (أسرع)
        with:
          path: ~/.nuget/packages
          key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}
      - run: dotnet restore SmartPrint.csproj     # 4) استعادة الحزم
      - run: >                                    # 5) البناء النهائي
          dotnet publish SmartPrint.csproj -c Release -r win-x64
          --self-contained true -p:PublishSingleFile=true
          -p:IncludeNativeLibrariesForSelfExtract=true
          -p:EnableCompressionInSingleFile=true -o ./publish
      - run: Move-Item ./publish/SmartPrint.exe ./publish/SMART_PRINT_Win11_x64.exe
      - uses: actions/upload-artifact@v4          # 6) رفع الملف
        with:
          name: SMART-PRINT-Windows11-Setup
          path: ./publish/SMART_PRINT_Win11_x64.exe
          retention-days: 30
```

**ما يحدث عملياً:**
| الحدث | النتيجة |
|---|---|
| `git push` على أي فرع | البناء يعمل، لكن الملف يظهر في Artifacts فقط |
| فتح PR | البناء يعمل كاختبار ✅/❌ قبل الدمج |
| `workflow_dispatch` | تشغيل يدوي من **Actions → Run workflow** |
| `git tag v1.0.0` + push | **Release** تلقائي بملف `.exe` مرفق |

---

## 2️⃣ كيف تحصل على أول نسخة (خطوة بخطوة)

### أولاً: جهّز الريبو على جهازك
```bash
git clone https://github.com/waelsamir28/alg-print.git
cd alg-print
```

### ثانياً: ارفع الملفات المطلوبة للبناء
```bash
# ملف الـ workflow
mkdir -p .github/workflows
# انسخ build.yml من مستكشف الكود داخل البرنامج → Save as .github/workflows/build.yml

# ملف المشروع C#
git add .
git commit -m "ci: add build workflow + license service"
git push origin main
```

### ثالثاً: راقب البناء
1. افتح `https://github.com/waelsamir28/alg-print/actions`
2. اضغط على آخر تشغيل → ستشاهد الخطوات واحدة واحدة ✅
3. في نهاية التشغيل، انزل لأسفل الصفحة → **Artifacts**
4. حمّل **SMART-PRINT-Windows11-Setup.zip** → بداخله `SMART_PRINT_Win11_x64.exe`

### رابعاً (الأفضل): أنشئ Release رسمي
```bash
git tag -a v1.0.0 -m "SMART PRINT v1.0.0 — أول نسخة رسمية"
git push origin v1.0.0
```
→ يشتغل البناء تلقائياً وينشئ **Release** في:
`https://github.com/waelsamir28/alg-print/releases`

---

## 3️⃣ الأسرار (Secrets) المطلوبة

اذهب إلى **Settings → Secrets and variables → Actions** وأضف:

| الاسم | الاستخدام |
|---|---|
| `GITHUB_TOKEN` | موجود تلقائياً — يُستخدم لنشر الـ Release |
| `LICENSE_SECRET` | (مقترح) مفتاح توليد السيريالات — **لا تضعه في الكود** |
| `VERIFY_API_URL` | (مقترح) رابط خادم التحقق من التفعيل |

> ⚠️ **مهم:** لا تضع مفتاح الترخيص داخل الكود المصدري. اقرأه من الـ Secret:
> ```csharp
> var secret = Environment.GetEnvironmentVariable("SMART_LICENSE_SECRET");
> ```

---

## 4️⃣ الـ Workflow الخاص بصفحة التفعيل (اختياري لكن مُوصى به)

لتُنشر صفحة التفعيل (`#/activate`) على نطاق خاص بك:

```yaml
name: Deploy Activation Site

on:
  push:
    branches: [main]
    paths: ['src/components/ActivationSite.tsx', 'src/utils/license.ts']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```
→ ستصبح صفحة التفعيل على: `https://waelsamir28.github.io/alg-print/#/activate`

---

## 5️⃣ الفحص التلقائي (CI) — ماذا يتأكد منه؟

| الخطوة | الأمر | النتيجة |
|---|---|---|
| فحص TypeScript | `npx tsc --noEmit` | يكشف أخطاء الأنواع قبل البناء |
| البناء | `npm run build` | يتأكد أن الواجهة تُبنى كملف واحد |
| C# build | `dotnet publish` | ينتج `.exe` مستقل ناجح |

أضفهم كـ workflow للواجهة:

```yaml
name: Verify Web Build
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run build
```

---

## 6️⃣ إصدار نسخة جديدة لاحقاً (v1.1.0 مثلاً)

```bash
# 1) حدّث رقم الإصدار
#    - في src/components/SettingsPage.tsx (تبويب "معلومات البرنامج")
#    - في README.md
git add . && git commit -m "chore: bump version to 1.1.0"

# 2) أنشئ tag جديد
git tag -a v1.1.0 -m "v1.1.0 — ميزات جديدة"
git push origin main --tags
```
→ Release جديد تلقائياً مع الـ `.exe` المحدث.

---

## 7️⃣ استكشاف الأخطاء الشائعة

| المشكلة | السبب | الحل |
|---|---|---|
| ❌ فشل البناء في Actions | مشروع C# ناقص/خطأ في csproj | راجع تبويب Actions → Logs ← رسالة `error CS....` |
| ❌ `dotnet: command not found` | لم يُنصّب SDK | تأكد من وجود خطوة `setup-dotnet@v4` |
| ⚠️ لا يظهر Artifact | الملف في مسار آخر | تحقق من `path:` في `upload-artifact` |
| ⚠️ Release لم يُنشأ | لم يتم push للـ tag | `git push origin v1.0.0` |
| 🔒 فشل الدفع للـ GitHub | مشكلة صلاحيات | راجع إعدادات الأمان في تبويب Settings |

---

## 8️⃣ نصائح أمنية للترخيص عند النشر الحقيقي

1. **لا تضع `LICENSE_SECRET` في الكود** — استخدم متغير بيئة/Secret.
2. **صفحة التفعيل يجب أن تكون محمية** بتسجيل دخول (Supabase Auth / Cloudflare Access) — ليست مفتوحة للعامة.
3. **سجل السيريالات يجب أن يعيش على خادم**، لا في localStorage، حتى يستحيل تفعيل نفس السيريال على جهازين.
4. **واتساب/الدفع:** يمكنك استخدام WhatsApp Cloud API + Google Sheets لتسجيل كل تفعيل تلقائياً.
5. **إعادة التفعيل:** في حال تغيير الجهاز، يمكنك من لوحة التفعيل استخدام زر «إتاحة للاستخدام» وتوليد سيريال جديد — أو تمديد السجل.

---

## 🎯 الخلاصة في 5 أوامر

```bash
git add .
git commit -m "feat: licensing + PDF tools + OCR + diff + compressor"
git push origin main
git tag -a v1.0.0 -m "أول نسخة رسمية"
git push origin v1.0.0     # ← هذا الذي ينشئ الإصدار على GitHub
```
