import React from 'react';
import { Printer, ScanLine } from 'lucide-react';

/** لوجو مجسّم باسم البرنامج — يعمل بالكامل بـ CSS 3D + تدرجات الثيم */
export const Logo3D: React.FC<{
  size?: number;
  wordmark?: boolean;
  className?: string;
}> = ({ size = 44, wordmark = false, className = '' }) => {
  const radius = Math.round(size * 0.28);
  return (
    <div className={`flex items-center gap-3 ${className}`} dir="ltr">
      {/* البلاطة المجسمة */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {/* طبقات العمق (Extrusion) */}
        {[5, 4, 3, 2, 1].map((i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              borderRadius: radius,
              transform: `translateY(${i * 0.9}px)`,
              background: i % 2 === 0 ? 'var(--t-head-1)' : 'var(--t-head-2)',
              opacity: 0.85,
            }}
          />
        ))}
        {/* الواجهة */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            borderRadius: radius,
            background:
              'linear-gradient(145deg, var(--t-head-4) 0%, var(--t-head-3) 45%, var(--t-head-2) 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -6px 12px rgba(0,0,0,.35), 0 6px 14px -6px rgba(2,6,23,.7)',
            border: '1px solid rgba(255,255,255,.22)',
          }}
        >
          {/* لمعة زجاجية */}
          <span
            className="absolute -top-1/2 left-0 w-full h-full rotate-[18deg]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0))',
              height: '70%',
            }}
          />
          <Printer
            className="relative text-white drop-shadow-[0_2px_3px_rgba(0,0,0,.5)]"
            style={{ width: size * 0.46, height: size * 0.46 }}
            strokeWidth={2.2}
          />
          <ScanLine
            className="absolute text-white/80"
            style={{ width: size * 0.34, height: size * 0.34, bottom: size * 0.12 }}
            strokeWidth={2}
          />
        </div>
        {/* حلقة إضاءة */}
        <div
          className="absolute inset-0 pointer-events-none anim-glow"
          style={{ borderRadius: radius }}
        />
      </div>

      {wordmark && (
        <div className="leading-none text-left">
          {/* الكلمتان جنب بعض */}
          <div
            className="flex items-baseline gap-1.5 font-black tracking-tight"
            style={{ fontSize: size * 0.42 }}
          >
            <span className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.45)]">SMART</span>
            <span
              style={{
                color: 'var(--t-accent)',
                textShadow: '0 2px 8px rgba(var(--t-glow) / .55), 0 1px 0 rgba(0,0,0,.35)',
              }}
            >
              PRINT
            </span>
          </div>
          <div
            className="mt-1 text-[10px] font-semibold tracking-wide text-white/65"
            style={{ fontSize: Math.max(8, size * 0.2) }}
          >
            للطباعة المتقدمة
          </div>
        </div>
      )}
    </div>
  );
};

/** أيقونة سطح المكتب بعد التثبيت (Windows 11 style tile) */
export const DesktopIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <div className={`relative ${className}`} style={{ width: size, height: size }}>
    <div
      className="absolute inset-0"
      style={{
        borderRadius: size * 0.24,
        background:
          'linear-gradient(160deg, #1e40af 0%, #0b2352 55%, #050b1c 100%)',
        boxShadow:
          'inset 0 2px 0 rgba(255,255,255,.35), inset 0 -10px 20px rgba(0,0,0,.5), 0 12px 22px -10px rgba(2,6,23,.8)',
        border: '1px solid rgba(255,255,255,.18)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Printer className="text-white/95" style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={2} />
        <ScanLine
          className="absolute text-cyan-300/90"
          style={{ width: size * 0.3, height: size * 0.3, bottom: size * 0.18 }}
          strokeWidth={2}
        />
      </div>
      <span
        className="absolute left-0 right-0 top-0 rounded-t-[inherit]"
        style={{
          height: '55%',
          background: 'linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,0))',
        }}
      />
    </div>
  </div>
);
