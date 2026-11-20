import React, { useEffect, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { Logo3D } from './Logo';
import { useSettings } from '../context/SettingsContext';

interface SplashWelcomeProps {
  onDone: () => void;
  minDuration?: number;
}

const LOADING_STEPS = [
  'تهيئة محرّك الطباعة...',
  'تحميل بروفايلات الطابعات...',
  'الاتصال بخدمة الاسكانر WIA 2.0...',
  'تجهيز خيارات الطباعة المتقدمة...',
];

/** شاشة ترحيبية أثناء فتح البرنامج */
export const SplashWelcome: React.FC<SplashWelcomeProps> = ({ onDone, minDuration = 2600 }) => {
  const { fontFamily, theme } = useSettings();
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / minDuration) * 100);
      setProgress(p);
      setStepIdx(Math.min(LOADING_STEPS.length - 1, Math.floor((p / 100) * LOADING_STEPS.length)));
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(onDone, 320);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [minDuration, onDone]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
      style={{ fontFamily }}
      data-theme={theme}
    >
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 hdr-grad anim-gradient" />
      {/* هالات ضوئية */}
      <div className="absolute -top-40 -right-32 w-[38rem] h-[38rem] rounded-full bg-[var(--t-accent)]/18 blur-[120px] anim-float" />
      <div className="absolute -bottom-48 -left-24 w-[34rem] h-[34rem] rounded-full bg-white/10 blur-[110px]" />
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />

      <div className="relative flex flex-col items-center text-center px-6 animate-fade-up">
        {/* اللوجو المجسم */}
        <div className="anim-float">
          <Logo3D size={96} />
        </div>

        {/* اسم البرنامج — الكلمتان جنب بعض */}
        <div className="mt-6 flex items-baseline gap-3 font-black tracking-tight text-4xl sm:text-5xl">
          <span className="text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.5)]">SMART</span>
          <span
            style={{
              color: 'var(--t-accent)',
              textShadow: '0 4px 24px rgba(var(--t-glow) / .7)',
            }}
          >
            PRINT
          </span>
        </div>
        <div className="mt-2 text-sm sm:text-base font-bold text-white/80 tracking-wide">
          للطباعة المتقدمة
        </div>

        {/* شريط التحميل */}
        <div className="mt-8 w-64 sm:w-80">
          <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--t-accent)] shadow-[0_0_14px_rgba(var(--t-glow)/.9)] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-white/65 font-semibold">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{LOADING_STEPS[stepIdx]}</span>
          </div>
        </div>

        {/* المطوّر */}
        <div className="mt-10 flex flex-col items-center gap-1 text-[11px] text-white/45">
          <div className="flex items-center gap-1.5">
            <Printer className="w-3 h-3" />
            <span className="font-mono">SMART PRINT v1.0.0 · .NET 8 WPF</span>
          </div>
          <span>تصميم وتنفيذ م/ وائل الجمال — 01222355769</span>
        </div>
      </div>
    </div>
  );
};
