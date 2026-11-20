import React, { useState } from 'react';
import {
  X,
  Type,
  Palette,
  Info,
  Headphones,
  Check,
  RotateCcw,
  Monitor,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Zap,
  ShieldCheck,
  ScanLine,
  Printer,
  Code2,
  MessageCircle,
} from 'lucide-react';
import {
  useSettings,
  FONT_OPTIONS,
  THEME_OPTIONS,
  type AppFont,
  type AppTheme,
} from '../context/SettingsContext';
import { Logo3D, DesktopIcon } from './Logo';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'fonts' | 'themes' | 'about' | 'support';

const TABS: { id: Tab; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'fonts', label: 'نوع الخط', icon: <Type className="w-4 h-4" />, hint: 'تغيير خط البرنامج' },
  { id: 'themes', label: 'المظهر والثيمات', icon: <Palette className="w-4 h-4" />, hint: '3 قوالب ألوان' },
  { id: 'about', label: 'معلومات البرنامج', icon: <Info className="w-4 h-4" />, hint: 'الإصدار والمزايا' },
  { id: 'support', label: 'الدعم والتواصل', icon: <Headphones className="w-4 h-4" />, hint: 'تواصل مع المطوّر' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<Tab>('fonts');
  const { font, setFont, theme, setTheme, uiScale, setUiScale, resetAppearance } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-5xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/40 flex flex-col max-h-full sm:max-h-[88vh]">
        {/* هيدر غامق */}
        <div className="sect-hdr px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-black text-base leading-tight">إعدادات البرنامج</h2>
              <p className="text-[11px] text-white/60">الخطوط · المظهر · المعلومات · الدعم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 flex items-center justify-center text-white"
            title="إغلاق الإعدادات"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* قائمة التبويبات */}
          <aside className="sm:w-56 shrink-0 bg-slate-50 border-b sm:border-b-0 sm:border-l border-gray-200 p-2 flex sm:flex-col gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`btn-pop text-right px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    active
                      ? 'btn-primary-grad text-white shadow-md shadow-black/10'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {t.icon}
                  <span className="flex flex-col items-start leading-tight">
                    <span>{t.label}</span>
                    <span className={`text-[10px] font-normal ${active ? 'text-white/70' : 'text-gray-400'}`}>
                      {t.hint}
                    </span>
                  </span>
                </button>
              );
            })}

            <div className="hidden sm:block mt-auto pt-3 px-1">
              <button
                onClick={resetAppearance}
                className="btn-pop w-full text-[11px] font-semibold text-gray-500 hover:text-red-600 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                استعادة الافتراضي
              </button>
            </div>
          </aside>

          {/* المحتوى */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {/* ============ الخطوط ============ */}
            {tab === 'fonts' && (
              <div className="animate-fade-up">
                <h3 className="font-black text-gray-900 text-sm mb-1">تغيير نوع خط البرنامج</h3>
                <p className="text-xs text-gray-500 mb-4">
                  اختر الخط المناسب — يتم تطبيقه فوراً على الواجهة بالكامل ويُحفظ تلقائياً.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FONT_OPTIONS.map((opt) => {
                    const active = font === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setFont(opt.id as AppFont)}
                        className={`btn-pop text-right p-3.5 rounded-xl border-2 transition-all ${
                          active
                            ? 'border-[var(--t-primary)] bg-primary-soft shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-lg font-bold text-gray-900"
                            style={{ fontFamily: opt.family }}
                          >
                            أبجد هوز
                          </span>
                          {active ? (
                            <span className="w-5 h-5 rounded-full btn-primary-grad text-white flex items-center justify-center">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-gray-800" style={{ fontFamily: opt.family }}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 leading-snug" style={{ fontFamily: opt.family }}>
                          {opt.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* معاينة نصية */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-gray-200">
                  <div className="text-[10px] font-bold text-gray-400 mb-2">معاينة الخط الحالي</div>
                  <p className="text-sm text-gray-800 leading-relaxed" style={{ fontFamily: 'var(--app-font)' }}>
                    برنامج SMART PRINT للطباعة المتقدمة — إدارة الملفات والاسكانر والتصوير الفوري لطابعات HP
                    PageWide بدقة عالية وسرعة 75 صفحة/دقيقة.
                  </p>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--app-font)' }}>
                    الأرقام: 0123456789 · اختبار شامل للخط العربي والإنجليزي 100%
                  </p>
                </div>
              </div>
            )}

            {/* ============ الثيمات ============ */}
            {tab === 'themes' && (
              <div className="animate-fade-up">
                <h3 className="font-black text-gray-900 text-sm mb-1">تغيير المظهر (الثيمات)</h3>
                <p className="text-xs text-gray-500 mb-4">
                  3 قوالب جاهزة + القالب الافتراضي — يتغير بها الهيدر والأزرار والفوتر معاً.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {THEME_OPTIONS.map((opt) => {
                    const active = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTheme(opt.id as AppTheme)}
                        className={`btn-pop text-right rounded-xl border-2 overflow-hidden transition-all ${
                          active
                            ? 'border-[var(--t-primary)] shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="h-16 flex">
                          {opt.preview.map((c) => (
                            <span key={c} className="flex-1" style={{ background: c }} />
                          ))}
                        </div>
                        <div className="p-3 bg-white flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-gray-900">{opt.label}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                              {opt.description}
                            </div>
                          </div>
                          {active ? (
                            <span className="shrink-0 w-5 h-5 rounded-full btn-primary-grad text-white flex items-center justify-center">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="shrink-0 w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* حجم الواجهة */}
                <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Monitor className="w-4 h-4 text-[var(--t-primary)]" />
                      تكبير وتصغير الواجهة
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--t-primary-ink)]">
                      {Math.round(uiScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.3}
                    step={0.05}
                    value={uiScale}
                    onChange={(e) => setUiScale(parseFloat(e.target.value))}
                    className="w-full accent-[var(--t-primary)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                    <span>80%</span>
                    <span>100%</span>
                    <span>130%</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============ معلومات البرنامج ============ */}
            {tab === 'about' && (
              <div className="animate-fade-up">
                <div className="hdr-grad rounded-xl p-4 flex items-center gap-4 mb-4">
                  <Logo3D size={54} />
                  <div className="text-white">
                    <div className="flex items-baseline gap-1.5 font-black text-lg">
                      <span>SMART</span>
                      <span style={{ color: 'var(--t-accent)' }}>PRINT</span>
                    </div>
                    <div className="text-[11px] text-white/70">للطباعة المتقدمة · الإصدار 1.0.0</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { icon: <Printer className="w-4 h-4" />, k: 'الاسم', v: 'SMART PRINT — للطباعة المتقدمة' },
                    { icon: <Zap className="w-4 h-4" />, k: 'الإصدار', v: '1.0.0 (Build 2026.11)' },
                    { icon: <Monitor className="w-4 h-4" />, k: 'التقنية', v: 'C# .NET 8 WPF + واجهة ويب تفاعلية' },
                    { icon: <ScanLine className="w-4 h-4" />, k: 'البروتوكولات', v: 'WIA 2.0 · TWAIN · eSCL · PCL6' },
                    { icon: <ShieldCheck className="w-4 h-4" />, k: 'الترخيص', v: 'نسخة كاملة — استخدام شخصي وتجاري' },
                    { icon: <Sparkles className="w-4 h-4" />, k: 'الحجم', v: 'حوالي 48 ميجابايت' },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-gray-200"
                    >
                      <span className="w-8 h-8 shrink-0 rounded-lg bg-primary-soft text-[var(--t-primary-ink)] flex items-center justify-center">
                        {row.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-400 font-bold">{row.k}</div>
                        <div className="text-xs font-bold text-gray-800 truncate">{row.v}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="text-xs font-bold text-gray-700 mb-2">أهم المزايا</div>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {[
                      'طباعة دفعات (Batch Print) لملفات PDF و Word والصور مع ترتيب الأولوية.',
                      'وش وضهر، 2-up / 4-up، وترتيب الكتيب (Booklet Saddle Stitch).',
                      'معاينة بصرية تفاعلية بتكبير وتدوير وقلب الوجه والظهر.',
                      'اسكانر WIA 2.0 مع مسح متعدد الصفحات وتصدير PDF.',
                      'تصوير فوري (Instant Copy) بضغطة واحدة بعدد نسخ محدّد.',
                      '3 ثيمات قابلة للتغيير + 3 خطوط عربية.',
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" strokeWidth={3} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* أيقونة سطح المكتب */}
                <div className="mt-4 p-3 rounded-xl border border-dashed border-gray-300 bg-slate-50 flex items-center gap-3">
                  <DesktopIcon size={48} />
                  <div className="text-[11px] text-gray-600 leading-snug">
                    <div className="font-bold text-gray-800">أيقونة سطح المكتب بعد التثبيت</div>
                    تظهر بصيغة SmartPrint.exe مع اختصار Start Menu تلقائياً.
                  </div>
                </div>
              </div>
            )}

            {/* ============ الدعم والتواصل ============ */}
            {tab === 'support' && (
              <div className="animate-fade-up">
                <h3 className="font-black text-gray-900 text-sm mb-1">الدعم والتواصل</h3>
                <p className="text-xs text-gray-500 mb-4">
                  للاستفسارات والدعم الفني والصيانة — يسعدنا تواصلك في أي وقت.
                </p>

                <div className="hdr-grad rounded-xl p-4 text-white mb-4 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                  <div className="relative z-10">
                    <div className="text-[11px] text-white/60 mb-1">تصميم وتطوير</div>
                    <div className="text-lg font-black">م/ وائل الجمال</div>
                    <a
                      href="tel:01222355769"
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 ring-1 ring-white/25 hover:bg-white/25 transition-colors font-mono font-bold text-sm"
                      dir="ltr"
                    >
                      <Phone className="w-4 h-4" />
                      01222355769
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      icon: <Phone className="w-4 h-4" />,
                      label: 'الهاتف / واتساب',
                      value: '01222355769',
                      href: 'tel:01222355769',
                    },
                    {
                      icon: <MessageCircle className="w-4 h-4" />,
                      label: 'الدعم الفني المباشر',
                      value: 'واتساب — من 10 ص إلى 10 م',
                      href: 'https://wa.me/201222355769',
                    },
                    {
                      icon: <Mail className="w-4 h-4" />,
                      label: 'البريد الإلكتروني',
                      value: 'support@smartprint.app',
                      href: 'mailto:support@smartprint.app',
                    },
                    {
                      icon: <MapPin className="w-4 h-4" />,
                      label: 'الموقع',
                      value: 'جمهورية مصر العربية — شبين الكوم',
                      href: '#',
                    },
                    {
                      icon: <Code2 className="w-4 h-4" />,
                      label: 'كود المشروع',
                      value: 'مستكشف الكود (C# .NET 8)',
                      href: '#',
                    },
                    {
                      icon: <Headphones className="w-4 h-4" />,
                      label: 'مدة الاستجابة',
                      value: 'أقل من 24 ساعة عمل',
                      href: '#',
                    },
                  ].map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="btn-pop flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-200 hover:border-[var(--t-primary-border)] hover:bg-primary-soft"
                    >
                      <span className="w-8 h-8 shrink-0 rounded-lg bg-primary-soft text-[var(--t-primary-ink)] flex items-center justify-center">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-400 font-bold">{item.label}</div>
                        <div className="text-xs font-bold text-gray-800 truncate" dir="auto">
                          {item.value}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* فوتر غامق للصفحة */}
        <div className="sect-hdr px-4 py-2 flex items-center justify-between text-[11px] text-white/70">
          <span className="relative z-10">
            تصميم وتنفيذ م/ وائل الجمال — 01222355769
          </span>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 px-4 py-1.5 rounded-lg bg-white text-[var(--t-primary-ink)] font-bold hover:bg-white/90"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
