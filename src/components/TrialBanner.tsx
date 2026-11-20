import React from 'react';
import { Clock, KeyRound, AlertTriangle, Crown } from 'lucide-react';
import { useLicense, TRIAL_DAYS } from '../context/LicenseContext';

/** شريط حالة الترخيص أعلى الواجهة (تجريبي / مفعّل) */
export const TrialBanner: React.FC<{ onActivate: () => void }> = ({ onActivate }) => {
  const { status, daysRemaining, trialPercent, activation } = useLicense();

  if (status === 'activated') {
    return (
      <div className="bg-emerald-600 text-white px-3 sm:px-4 py-1 flex items-center justify-center gap-2 text-[11px] font-bold select-none">
        <Crown className="w-3.5 h-3.5" />
        <span>نسخة كاملة مُفعّلة — مدى الحياة</span>
        {activation?.serial && (
          <span className="font-mono opacity-70 hidden sm:inline" dir="ltr">
            {activation.serial}
          </span>
        )}
      </div>
    );
  }

  const urgent = daysRemaining <= 3;

  return (
    <div
      className={`px-3 sm:px-4 py-1 flex items-center justify-center gap-2 text-[11px] font-bold select-none ${
        urgent ? 'bg-amber-500 text-slate-900' : 'bg-slate-900/95 text-white'
      }`}
    >
      {urgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 text-[var(--t-accent)]" />}
      <span>
        فترة تجريبية — متبقي <strong>{daysRemaining}</strong> من {TRIAL_DAYS} يوماً
      </span>

      {/* شريط تقدم صغير */}
      <span className="hidden sm:block w-24 h-1.5 rounded-full bg-white/25 overflow-hidden">
        <span
          className="block h-full rounded-full bg-[var(--t-accent)]"
          style={{ width: `${Math.min(100, trialPercent)}%` }}
        />
      </span>

      <button
        onClick={onActivate}
        className="btn-pop ms-1 flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[var(--t-accent)] text-slate-900 font-black hover:brightness-110"
      >
        <KeyRound className="w-3 h-3" />
        تفعيل الآن
      </button>
    </div>
  );
};
