import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Minus,
  Square,
  ChevronLeft,
  ChevronRight,
  Check,
  Printer,
  ScanLine,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  Rocket,
  MonitorDown,
  FileText,
  Layers,
  Loader2,
} from 'lucide-react';
import { DesktopIcon } from './Logo';
import { BrandLogo } from './BrandLogo';
import heroImg from '../assets/installer-hero.jpg';
import featureImg from '../assets/installer-feature.jpg';

interface InstallerWizardProps {
  onFinish: () => void;
  onCancel: () => void;
  onLaunchApp: () => void;
}

type Step = 'welcome' | 'options' | 'progress' | 'done';

const INSTALL_STEPS = [
  { label: 'تهيئة ملفات التثبيت', detail: 'فك الضغط وتجهيز الحزم' },
  { label: 'تثبيت محرّك الطباعة PCL6', detail: 'SmartPrint.PrintEngine.dll' },
  { label: 'تثبيت خدمة الاسكانر WIA 2.0', detail: 'SmartPrint.ScanService' },
  { label: 'تسجيل ملفات PDF و DOCX', detail: 'Rendering & Imposition' },
  { label: 'إنشاء اختصارات سطح المكتب', detail: 'SmartPrint.lnk' },
  { label: 'تسجيل البرنامج في النظام', detail: 'Start Menu · Registry' },
];

export const InstallerWizard: React.FC<InstallerWizardProps> = ({
  onFinish,
  onCancel,
  onLaunchApp,
}) => {
  const [step, setStep] = useState<Step>('welcome');
  const [progress, setProgress] = useState(0);
  const [installPath, setInstallPath] = useState('C:\\Program Files\\SmartPrint');
  const [createShortcut, setCreateShortcut] = useState(true);
  const [launchAfter, setLaunchAfter] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [startMenu, setStartMenu] = useState(true);

  const images = useMemo(
    () => [
      { src: heroImg, caption: 'طباعة فائقة السرعة حتى 75 صفحة/دقيقة' },
      { src: featureImg, caption: 'اسكانر WIA 2.0 وتصدير PDF متعدد الصفحات' },
    ],
    []
  );

  // دوّار الصور أثناء التثبيت
  useEffect(() => {
    if (step !== 'progress') return;
    const t = setInterval(() => setImageIndex((i) => (i + 1) % images.length), 2600);
    return () => clearInterval(t);
  }, [step, images.length]);

  // شريط التقدم
  useEffect(() => {
    if (step !== 'progress') return;
    let raf = 0;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        const increment = p < 70 ? 1.6 : p < 92 ? 0.9 : 0.4;
        const next = Math.min(100, p + increment);
        return Number(next.toFixed(1));
      });
    }, 55);
    raf = timer as unknown as number;
    return () => {
      clearInterval(raf);
    };
  }, [step]);

  useEffect(() => {
    if (step === 'progress' && progress >= 100) {
      const t = setTimeout(() => setStep('done'), 700);
      return () => clearTimeout(t);
    }
  }, [step, progress]);

  const currentStepIndex = Math.min(
    INSTALL_STEPS.length - 1,
    Math.floor((progress / 100) * INSTALL_STEPS.length)
  );

  /* ─────────────── نوافذ النافذة (Win11 chrome) ─────────────── */
  const WindowChrome: React.FC<{ children: React.ReactNode; subtitle: string }> = ({
    children,
    subtitle,
  }) => (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-6">
      <div className="win11-card w-full max-w-4xl rounded-2xl overflow-hidden animate-pop-in flex flex-col max-h-[94vh]">
        {/* Title bar */}
        <div className="bg-white/70 border-b border-gray-200/80 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600">
            <span className="w-4 h-4 rounded bg-[var(--t-primary)] text-white flex items-center justify-center text-[8px] font-black">
              SP
            </span>
            <span className="text-gray-800">SmartPrint Setup</span>
            <span className="text-gray-400 font-normal">— {subtitle}</span>
          </div>
          <div className="flex items-center">
            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200/70" title="تصغير">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200/70" title="تكبير">
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white"
              title="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  /* ─────────────── شاشة الترحيب عند الضغط على ملف التثبيت ─────────────── */
  if (step === 'welcome') {
    return (
      <WindowChrome subtitle="مرحباً بك">
        <div className="relative">
          <img
            src={heroImg}
            alt="SmartPrint"
            className="w-full h-40 sm:h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-950/95 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between px-5 sm:px-8">
            <div className="text-white max-w-md animate-fade-up">
              <div className="text-[11px] font-bold text-[var(--t-accent)] mb-1">
                مرحباً بك في معالج التثبيت
              </div>
              <BrandLogo height={52} glow className="mb-2" />
              <div className="flex items-baseline gap-2 text-2xl sm:text-3xl font-black leading-none">
                <span>SMART</span>
                <span style={{ color: 'var(--t-accent)' }}>PRINT</span>
              </div>
              <div className="mt-1.5 text-sm text-white/80 font-bold">للطباعة المتقدمة</div>
              <p className="mt-2 text-[11px] text-white/60 leading-relaxed">
                سيتم تثبيت برنامج إدارة الطباعة المتقدمة والاسكانر الفوري لطابعات HP PageWide
                على جهازك. الإصدار 1.0.0 — C# .NET 8 WPF.
              </p>
            </div>
            <div className="hidden sm:block anim-float">
              <BrandLogo height={110} glow />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5 stagger">
            {[
              { icon: <Printer className="w-4 h-4" />, t: 'طباعة متقدمة', d: 'دفعات ملفات، وش وضهر، كتيب' },
              { icon: <ScanLine className="w-4 h-4" />, t: 'اسكانر فوري', d: 'WIA 2.0 وتصدير PDF' },
              { icon: <ShieldCheck className="w-4 h-4" />, t: 'تثبيت آمن', d: 'بدون إعلانات أو برامج إضافية' },
            ].map((f) => (
              <div
                key={f.t}
                className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-start gap-2.5"
              >
                <span className="w-8 h-8 shrink-0 rounded-lg btn-primary-grad text-white flex items-center justify-center">
                  {f.icon}
                </span>
                <div>
                  <div className="text-xs font-bold text-gray-900">{f.t}</div>
                  <div className="text-[10px] text-gray-500 leading-snug mt-0.5">{f.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-gray-400 leading-snug">
              بالمتابعة أنت توافق على شروط الاستخدام. تصميم وتنفيذ م/ وائل الجمال — 01222355769
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onCancel}
                className="btn-pop px-4 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={() => setStep('options')}
                className="btn-pop btn-shine px-5 py-2 rounded-lg text-xs font-bold text-white btn-primary-grad shadow-md flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                متابعة التثبيت
              </button>
            </div>
          </div>
        </div>
      </WindowChrome>
    );
  }

  /* ─────────────── خيارات التثبيت ─────────────── */
  if (step === 'options') {
    return (
      <WindowChrome subtitle="خيارات التثبيت">
        <div className="hdr-grad px-5 py-4 flex items-center justify-between">
          <div className="text-white relative z-10">
            <div className="text-sm font-black">خيارات التثبيت</div>
            <div className="text-[11px] text-white/60">اختر مكان التثبيت والاختصارات</div>
          </div>
          <BrandLogo height={44} glow />
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          <label className="block text-xs font-bold text-gray-700 mb-1">مجلد التثبيت</label>
          <div className="flex gap-2 mb-4">
            <input
              value={installPath}
              onChange={(e) => setInstallPath(e.target.value)}
              dir="ltr"
              className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
            />
            <button className="btn-pop px-3 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <FolderOpen className="w-3.5 h-3.5" />
              استعراض
            </button>
          </div>

          <div className="space-y-2">
            {[
              {
                checked: createShortcut,
                set: setCreateShortcut,
                icon: <MonitorDown className="w-4 h-4" />,
                t: 'إنشاء أيقونة على سطح المكتب',
                d: 'SmartPrint.exe + أيقونة مجسّمة للبرنامج',
              },
              {
                checked: startMenu,
                set: setStartMenu,
                icon: <Layers className="w-4 h-4" />,
                t: 'إضافة اختصار في قائمة ابدأ',
                d: 'Start Menu › SmartPrint',
              },
              {
                checked: launchAfter,
                set: setLaunchAfter,
                icon: <Rocket className="w-4 h-4" />,
                t: 'تشغيل البرنامج بعد انتهاء التثبيت',
                d: 'فتح شاشة الترحيب تلقائياً',
              },
            ].map((opt) => (
              <button
                key={opt.t}
                onClick={() => opt.set(!opt.checked)}
                className="btn-pop w-full text-right flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-[var(--t-primary-border)] hover:bg-primary-soft"
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${
                    opt.checked
                      ? 'bg-[var(--t-primary)] border-[var(--t-primary)] text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {opt.checked && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 text-[var(--t-primary-ink)] flex items-center justify-center">
                  {opt.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-gray-900">{opt.t}</span>
                  <span className="block text-[10px] text-gray-500 mt-0.5">{opt.d}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              المساحة المطلوبة: 48 ميجابايت · نظام التشغيل: Windows 10/11 (64-bit) · لا فيروس
              ولا إعلانات.
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-white/60">
          <button
            onClick={() => setStep('welcome')}
            className="btn-pop px-4 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>
          <button
            onClick={() => {
              setProgress(0);
              setStep('progress');
            }}
            className="btn-pop btn-shine px-5 py-2 rounded-lg text-xs font-bold text-white btn-primary-grad shadow-md flex items-center gap-1.5"
          >
            تثبيت الآن
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </WindowChrome>
    );
  }

  /* ─────────────── شاشة التثبيت (Win11 style مع صور) ─────────────── */
  if (step === 'progress') {
    return (
      <WindowChrome subtitle="جارٍ التثبيت">
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
          {/* الجانب البصري: صور متحركة */}
          <div className="relative bg-slate-950 overflow-hidden min-h-[190px] md:min-h-[320px]">
            {images.map((img, i) => (
              <img
                key={img.src}
                src={img.src}
                alt={img.caption}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  i === imageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* شعار متحرك */}
            <div className="absolute top-3 right-3 anim-float">
              <BrandLogo height={34} glow />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="text-[11px] font-bold text-[var(--t-accent)] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                أثناء التثبيت
              </div>
              <div className="text-white text-sm font-bold leading-snug">
                {images[imageIndex].caption}
              </div>
              <div className="flex gap-1.5 mt-2">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === imageIndex
                        ? 'w-6 bg-[var(--t-accent)]'
                        : 'w-2 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* الجانب الأيمن: خطوات التثبيت */}
          <div className="p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--t-primary)]" />
                <h3 className="text-sm font-black text-gray-900">جارٍ تثبيت SMART PRINT</h3>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">
                يُرجى الانتظار، قد تستغرق العملية دقيقة واحدة...
              </p>

              <div className="space-y-2">
                {INSTALL_STEPS.map((s, i) => {
                  const isDone = i < currentStepIndex || progress >= 100;
                  const isCurrent = i === currentStepIndex && progress < 100;
                  return (
                    <div key={s.label} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-[var(--t-primary)] text-white animate-pulse'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={`text-[11px] font-bold leading-tight ${
                            isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {s.label}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono truncate">{s.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                <span className="text-gray-600">التقدم</span>
                <span className="font-mono text-[var(--t-primary-ink)]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full btn-primary-grad setup-progress"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </WindowChrome>
    );
  }

  /* ─────────────── انتهى التثبيت ─────────────── */
  return (
    <WindowChrome subtitle="اكتمل التثبيت">
      <div className="hdr-grad px-5 py-6 flex flex-col items-center text-center">
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg anim-glow mx-auto mb-3">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-white font-black text-lg">تم تثبيت البرنامج بنجاح</h2>
          <p className="text-[11px] text-white/65 mt-1">
            SMART PRINT للطباعة المتقدمة — جاهز للاستخدام الآن
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center gap-2.5">
            <DesktopIcon size={38} />
            <div className="text-[10px] text-gray-500 leading-snug">
              <span className="block text-xs font-bold text-gray-900">أيقونة سطح المكتب</span>
              تم إنشاؤها بنجاح
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg btn-primary-grad text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
            <div className="text-[10px] text-gray-500 leading-snug">
              <span className="block text-xs font-bold text-gray-900">المحرّك</span>
              PCL6 + WIA 2.0 مثبّت
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="text-[10px] text-gray-500 leading-snug">
              <span className="block text-xs font-bold text-gray-900">الحالة</span>
              نسخة كاملة مُفعّلة
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 cursor-pointer">
            <button
              onClick={() => setLaunchAfter(!launchAfter)}
              className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                launchAfter
                  ? 'bg-[var(--t-primary)] border-[var(--t-primary)] text-white'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {launchAfter && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>
            تشغيل البرنامج الآن
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={onFinish}
              className="btn-pop px-4 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              إنهاء
            </button>
            <button
              onClick={() => {
                if (launchAfter) onLaunchApp();
                else onFinish();
              }}
              className="btn-pop btn-shine px-5 py-2 rounded-lg text-xs font-bold text-white btn-primary-grad shadow-md flex items-center gap-1.5"
            >
              <Rocket className="w-4 h-4" />
              تشغيل SMART PRINT
            </button>
          </div>
        </div>
      </div>
    </WindowChrome>
  );
};
