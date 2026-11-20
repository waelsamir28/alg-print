# SMART PRINT — تطبيق ويندوز الحقيقي (WPF / .NET 8)

برنامج طباعة واسكانر عربي كامل، يتعامل مع **الطابعات والاسكانرات الحقيقية** على ويندوز —
بدون أي محاكاة وبدون بيانات وهمية.

---

## ما هو حقيقي في هذا التطبيق

| الميزة | الطريقة | ملاحظة |
|---|---|---|
| **اكتشاف الطابعات** | `System.Printing.LocalPrintServer.GetPrintQueues()` | كل الطابعات المثبتة (محلية + شبكة) |
| **حالة الطابعة** | `PrintQueue.IsOffline / IsPaused / IsInError / IsPaperJammed / NumberOfJobs` | حالة حقيقية لحظية |
| **مستويات الحبر** | WMI `Root\WMI::PrinterConsumable` + `GetPrinterData` (winspool) | إن لم تُبلِّغ الطابعة يظهر «غير متاح» — لا أرقام ملفّقة |
| **الأدراج والمقاسات** | `PrintQueue.GetPrintCapabilities()` | من تعريف الطابعة نفسه |
| **الطباعة** | `PrintQueue.CreateXpsDocumentWriter().Write()` | المسار الرسمي لويندوز |
| **قراءة PDF** | `Docnet.Core` (PDFium — محرك Chrome) | بيرسم العربي صح، بدون Adobe |
| **Word .docx** | `DocX` (Xceed) | بدون Microsoft Office |
| **الاسكانر** | WIA 2.0 عبر COM (`WIA.DeviceManager` + `dynamic`) | بدون COMReference — يعمل على .NET 8 |
| **مسح PDF متعدد الصفحات** | WIA + `PdfSharpCore` | يدعم ADF |
| **الترخيص** | HMAC-SHA256 أوفلاين + DPAPI | مطابق لمولّد الويب |

---

## كيف تحصل على ملف `SMART_PRINT_Win11_x64.exe`

### الطريقة 1 — GitHub Actions (موصى بها، مجاناً)

1. ارفع الكود:
   ```bash
   git add . && git commit -m "feat: real WPF app" && git push origin main
   ```
2. افتح `https://github.com/waelsamir28/alg-print/actions`
3. اختر **🖨 Build Windows EXE** → آخر تشغيل
4. من **Artifacts** نزّل **SMART-PRINT-EXE** → بداخله `SMART_PRINT_Win11_x64.exe`

> أول بناء سيستغرق ~5 دقائق (تنزيل الحزم + البناء + الضغط).

### الطريقة 2 — على جهازك (لو عندك Visual Studio / .NET SDK)

```bash
cd wpf-app
dotnet restore SmartPrint.csproj
dotnet publish SmartPrint.csproj -c Release -r win-x64 --self-contained true ^
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true ^
  -p:EnableCompressionInSingleFile=true -o ..\publish
```
النتيجة: `publish\SmartPrint.exe` (~85 ميجا بعد الضغط، ملف واحد، **لا يحتاج تثبيت .NET**).

### إصدار رسمي على GitHub

```bash
git tag -a v1.0.1 -m "SMART PRINT v1.0.1 — نسخة ويندوز"
git push origin v1.0.1
```
→ الـ workflow يرفق الـ `.exe` تلقائياً على صفحة الإصدار.

---

## بنية المشروع

```
wpf-app/
├── SmartPrint.csproj          # .NET 8 WPF + الحزم المجانية
├── app.manifest               # DPI awareness + توافق Win10/11
├── App.xaml / App.xaml.cs     # الألوان والأنماط + العربية + التقاط الأخطاء
├── MainWindow.xaml            # الواجهة الكاملة (RTL)
├── MainWindow.xaml.cs         # السحب والإفلات
├── Converters/
│   └── BoolToVisibilityConverter.cs
├── Models/
│   ├── PrinterInfo.cs         # PrinterInfo / PaperTray / InkLevels / ScannerDevice
│   └── PrintJobItem.cs
├── Services/
│   ├── PrinterService.cs      # تعداد الطابعات + القدرات + بناء PrintTicket
│   ├── InkReader.cs           # الحبر عبر WMI + winspool
│   ├── PrintEngineService.cs  # الطباعة الحقيقية (XPS)
│   ├── PdfPageRenderer.cs     # PDF → صور (PDFium)
│   ├── DocumentConverterService.cs  # عدّ الصفحات + المعاينة + Word
│   ├── WiaScannerService.cs   # الاسكانر الحقيقي (WIA 2.0)
│   └── LicenseService.cs      # 15 يوم تجربة + تفعيل مدى الحياة
├── ViewModels/
│   └── MainViewModel.cs       # كل المنطق (MVVM + CommunityToolkit)
└── Resources/
    └── AppIcon.ico
```

---

## التفعيل

1. البرنامج يعمل **15 يوماً** كتجربة كاملة (كل الميزات).
2. بعدها: شريط أصفر أعلى البرنامج يعرض **كود الجهاز** (8 خانات) → اضغط «نسخ كود الجهاز».
3. أرسله واتساب **01222355769**.
4. ستصلك السيريال من مولّد `smartprint-keygen.html`.
5. زر «تفعيل / تواصل» في الهيدر → الصق السيريال → **مدى الحياة**.

> السيريال مربوط ببصمة الجهاز: لا يعمل على جهاز آخر، ويعمل **بدون إنترنت**.

---

## الإعدادات والتخزين

| الملف | المسار |
|---|---|
| ملف الترخيص | `%LOCALAPPDATA%\SmartPrint\license.dat` (محمي بـ DPAPI) |
| بداية التجربة | `%LOCALAPPDATA%\SmartPrint\trial.dat` (محمي بـ DPAPI) |
| حماية الساعة | `%LOCALAPPDATA%\SmartPrint\clock.dat` |

---

## استكشاف الأخطاء

| المشكلة | السبب والحل |
|---|---|
| «لم يتم العثور على طابعة» | ثبّت طابعة من إعدادات ويندوز ثم اضغط «تحديث الأجهزة» |
| «لم يتم العثور على اسكانر» | وصّل الجهاز، شغّله، وتأكد من ظهوره في «أجهزة والطابعات» |
| الحبر «غير متاح» | الطابعة لا تُبلّغ ويندوز بمستوى الحبر (شائع في طابعات PDF والأجهزة القديمة) |
| PDF يطبع أسود/فاضي | الملف قد يكون محمياً بـ DRM أو صور مسحوبة بدقة عالية جداً |
| فشل البناء في Actions | افتح تبويب Actions → الرسالة تبدأ بـ `error CS....` |

---

## ⚠️ ملاحظة عن الترخيص

المفاتيح موجودة داخل الكود (لأن التحقق أوفلاين). من يملك البرنامج يمكنه نظرياً استخراجها.
للحماية الكاملة: أضف تحققاً سحابياً (الويب فيه `SYNC_URL` جاهز) أو وزّع الـ exe بعدّاد تجربة فقط.

---

تصميم وتنفيذ **م/ وائل الجمال** — 01222355769
