import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useLicense } from '../context/LicenseContext';

interface ContactPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivation: () => void;
}

const WHATSAPP = '201222355769';
const PHONE = '01222355769';

/** صفحة التواصل مع المطوّر — واتساب مباشر وطلب تفعيل */
export const ContactPage: React.FC<ContactPageProps> = ({
  isOpen,
  onClose,
  onOpenActivation,
}) => {
  const { shortCode, machineCode, status } = useLicense();
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState<'activate' | 'support' | 'quote'>('activate');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const subjects = {
    activate: { label: 'طلب تفعيل البرنامج', icon: <KeyRound className="w-3.5 h-3.5" /> },
    support: { label: 'دعم فني / مشكلة', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    quote: { label: 'عرض سعر / استفسار', icon: <Sparkles className="w-3.5 h-3.5" /> },
  } as const;

  const bodyText = `السلام عليكم م/ وائل الجمال،
الموضوع: ${subjects[subject].label}
البرنامج: SMART PRINT
كود الجهاز: ${shortCode}
${status === 'activated' ? 'حالة النسخة: مفعّلة' : 'حالة النسخة: تجريبية'}
${message ? `\nالرسالة:\n${message}` : ''}

شكراً لك.`;

  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(bodyText)}`;
  const mailLink = `mailto:support@smartprint.app?subject=${encodeURIComponent(
    `SMART PRINT — ${subjects[subject].label}`
  )}&body=${encodeURIComponent(bodyText)}`;

  const copyBody = async () => {
    await navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-pop-in">
        {/* هيدر */}
        <div className="sect-hdr px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <MessageCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">التواصل مع المطوّر</h3>
              <p className="text-[11px] text-white/60">تفعيل · دعم فني · استفسارات</p>
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
          {/* بطاقة المطوّر */}
          <div className="hdr-grad rounded-xl p-4 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="shrink-0">
                <BrandLogo height={54} glow />
              </div>
              <div>
                <div className="text-[10px] text-white/60">تصميم وتطوير</div>
                <div className="text-lg font-black">م / وائل الجمال</div>
                <div className="text-[10px] text-white/60">SMART PRINT · للطباعة المتقدمة</div>
              </div>
            </div>
          </div>

          {/* كود الجهاز */}
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold text-gray-500">كود جهازك (أرسله مع الطلب)</div>
              <div className="text-lg font-black font-mono tracking-widest text-gray-900">
                {shortCode}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(machineCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="btn-pop px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-600 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'تم' : 'نسخ'}
            </button>
          </div>

          {/* نوع الطلب */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">نوع الطلب</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(subjects) as (keyof typeof subjects)[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSubject(k)}
                  className={`btn-pop p-2 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 ${
                    subject === k
                      ? 'bg-primary-soft border-[var(--t-primary)] text-[var(--t-primary-ink)]'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {subjects[k].icon}
                  {subjects[k].label}
                </button>
              ))}
            </div>
          </div>

          {/* الرسالة */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">رسالتك (اختياري)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="اكتب تفاصيل الطلب هنا..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
            />
          </div>

          {/* أزرار التواصل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn-pop flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-white bg-[#25D366] hover:bg-[#1eb955] shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              إرسال عبر واتساب
            </a>
            <a
              href={`tel:${PHONE}`}
              className="btn-pop flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white btn-primary-grad"
            >
              <Phone className="w-4 h-4" />
              <span dir="ltr">{PHONE}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={copyBody}
              className="btn-pop flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'تم نسخ الرسالة' : 'نسخ نص الرسالة'}
            </button>
            <a
              href={mailLink}
              className="btn-pop flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-700"
            >
              <Mail className="w-3.5 h-3.5" />
              البريد الإلكتروني
            </a>
          </div>

          {/* معلومات إضافية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
              <Clock className="w-3.5 h-3.5 text-[var(--t-primary)] shrink-0" />
              <span>الدعم: السبت–الخميس · 10 ص – 10 م</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-[var(--t-primary)] shrink-0" />
              <span>شبين الكوم — المنوفية · مصر</span>
            </div>
          </div>

          {status !== 'activated' && (
            <button
              onClick={() => {
                onClose();
                onOpenActivation();
              }}
              className="btn-pop w-full py-2.5 rounded-xl text-[11px] font-bold bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              لديك سيريال بالفعل؟ أدخله هنا للتفعيل
            </button>
          )}
        </div>

        <div className="sect-hdr px-4 py-2.5 flex items-center justify-between shrink-0">
          <span className="relative z-10 text-[11px] text-white/70 flex items-center gap-1">
            <Send className="w-3 h-3" />
            يسعدنا خدمتك دائماً
          </span>
          <span className="relative z-10 text-[11px] font-bold text-white">
            تحياتي م / وائل الجمال
          </span>
        </div>
      </div>
    </div>
  );
};
