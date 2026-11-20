import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  MessageCircle,
  Phone,
  Sparkles,
  Clock,
  Crown,
  Loader2,
  MonitorSmartphone,
} from 'lucide-react';
import { useLicense, TRIAL_DAYS } from '../context/LicenseContext';
import { BrandLogo } from './BrandLogo';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** رسالة نجاح عائمة تُعرض بعد التفعيل */
  onActivated?: () => void;
  reason?: 'expired' | 'manual';
}

const WHATSAPP = '201222355769';
const PHONE = '01222355769';

/** نافذة التفعيل — إدخال السيريال + كود الجهاز + تواصل مع المطوّر */
export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  onActivated,
  reason = 'manual',
}) => {
  const { activate, shortCode, machineCode, daysRemaining, status, activation } = useLicense();
  const [serial, setSerial] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isActivated = status === 'activated';
  const expired = reason === 'expired';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(
        `كود الجهاز: ${shortCode}\nمعرّف كامل: ${machineCode}\nالبرنامج: SMART PRINT`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    const res = await activate(serial);
    setBusy(false);
    if (res.ok) {
      setSerial('');
      onActivated?.();
      onClose();
    } else {
      setError(res.error ?? 'تعذر التفعيل');
    }
  };

  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `السلام عليكم م/ وائل، أرغب في تفعيل برنامج SMART PRINT.\nكود الجهاز: ${shortCode}\nمعرّف الجهاز: ${machineCode}`
  )}`;

  return (
    <div className="fixed inset-0 z-[95] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-pop-in">
        {/* هيدر */}
        <div className="sect-hdr px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <KeyRound className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">تفعيل البرنامج</h3>
              <p className="text-[11px] text-white/60">
                {isActivated ? 'النسخة مُفعّلة — مدى الحياة' : 'سيريال التفعيل مدى الحياة'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* تنبيه انتهاء التجربة */}
          {expired && !isActivated && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2 animate-fade-up">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <strong className="block mb-0.5">انتهت فترة التجربة ({TRIAL_DAYS} يوماً)</strong>
                لمواصلة استخدام البرنامج، أدخل سيريال التفعيل الذي حصلت عليه من المطوّر.
              </div>
            </div>
          )}

          {isActivated ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500 mx-auto flex items-center justify-center shadow-lg anim-glow mb-3">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-black text-gray-900">البرنامج مُفعّل بنجاح</h4>
              <p className="text-xs text-gray-500 mt-1">
                نسخة كاملة — مدى الحياة · الجهاز: <span className="font-mono">{shortCode}</span>
              </p>
              {activation?.customer && (
                <p className="text-[11px] text-gray-400 mt-1">مرخّصة لـ: {activation.customer}</p>
              )}
            </div>
          ) : (
            <>
              {/* عدّاد التجربة */}
              {status === 'trial' && (
                <div className="p-3 rounded-xl bg-primary-soft border border-[var(--t-primary-border)]">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--t-primary-ink)] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      الفترة التجريبية
                    </span>
                    <span>متبقي {daysRemaining} من {TRIAL_DAYS} يوماً</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--t-primary)] transition-all"
                      style={{ width: `${Math.max(4, 100 - (daysRemaining / TRIAL_DAYS) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* كود الجهاز */}
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                    <MonitorSmartphone className="w-3.5 h-3.5 text-[var(--t-primary)]" />
                    كود الجهاز الخاص بك
                  </span>
                  <button
                    onClick={copyCode}
                    className="btn-pop text-[10px] font-bold text-[var(--t-primary-ink)] flex items-center gap-1 hover:underline"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'تم النسخ' : 'نسخ'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black font-mono tracking-[0.2em] text-gray-900">
                    {shortCode}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 truncate" dir="ltr">
                    {machineCode}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                  أرسل هذا الكود للمطوّر للحصول على سيريال مخصص لجهازك.
                </p>
              </div>

              {/* إدخال السيريال */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[var(--t-primary)]" />
                  سيريال التفعيل
                </label>
                <input
                  value={serial}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setSerial(v);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && serial.length >= 19 && submit()}
                  placeholder="SPRD-XXXX-XXXX-XXXX-XXXX"
                  dir="ltr"
                  className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-3 py-3 text-sm font-mono font-bold text-center tracking-[0.15em] focus:outline-none focus:border-[var(--t-primary)] focus:ring-2 focus:ring-[var(--t-primary)]/20"
                />

                {error && (
                  <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 font-semibold animate-fade-up">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={busy || serial.replace(/-/g, '').length < 16}
                  className="btn-pop btn-shine w-full mt-3 py-3 rounded-xl font-black text-sm text-white btn-primary-grad shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-40 anim-gradient"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  {busy ? 'جارٍ التحقق...' : 'تفعيل النسخة الكاملة'}
                </button>

                <p className="text-[10px] text-gray-400 text-center mt-2">
                  ⓘ كل سيريال يُستخدم مرة واحدة فقط، ومخصص لجهاز واحد
                </p>
              </div>

              {/* التواصل */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-[11px] font-bold text-gray-700 mb-2">لطلب سيريال التفعيل</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pop flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1eb955] shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    واتساب مباشر
                  </a>
                  <a
                    href={`tel:${PHONE}`}
                    className="btn-pop flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-primary-soft text-[var(--t-primary-ink)] border border-[var(--t-primary-border)]"
                  >
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{PHONE}</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* الفوتر — رسالة المطوّر */}
        <div className="sect-hdr px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="relative z-10 flex items-center gap-2">
            <BrandLogo height={22} compact />
            <span className="text-[11px] text-white/70">SMART PRINT · معالج التفعيل</span>
          </div>
          <span className="relative z-10 text-[11px] font-bold text-white">
            تحياتي م / وائل الجمال
          </span>
        </div>
      </div>
    </div>
  );
};

/** الرسالة العائمة الاحترافية بعد التفعيل */
export const ActivationSuccessToast: React.FC<{ show: boolean; onClose: () => void }> = ({
  show,
  onClose,
}) => {
  const { shortCode } = useLicense();
  const [visible, setVisible] = useState(show);

  React.useEffect(() => {
    setVisible(show);
    if (!show) return;
    const t = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 9000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99] w-[min(92vw,430px)] animate-pop-in">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
        <div className="sect-hdr p-4 pb-3">
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg anim-glow">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-black text-sm leading-tight">
                مبروك! تم تفعيل النسخة الكاملة
              </h4>
              <p className="text-[11px] text-white/70 mt-0.5">
                ترخيص مدى الحياة · جهاز {shortCode}
              </p>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                onClose();
              }}
              className="btn-pop w-6 h-6 rounded-md bg-white/10 hover:bg-white/25 text-white/80 flex items-center justify-center shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white px-4 py-3">
          <p className="text-[11px] text-gray-600 leading-relaxed">
            شكراً لثقتك في <strong>SMART PRINT</strong>. أصبح بإمكانك الآن استخدام كل المزايا بلا
            حدود: الطباعة المتقدمة، الاسكانر، OCR، التوقيع الإلكتروني، والمخزون.
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">تفعيل ناجح ✓</span>
            <span className="text-[11px] font-black text-[var(--t-primary-ink)]">
              تحياتي م / وائل الجمال
            </span>
          </div>
        </div>

        {/* شريط عدّاد الإغلاق */}
        <div className="h-0.5 bg-gray-100">
          <div className="h-full bg-[var(--t-primary)] animate-[shrinkBar_9s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
};
