import React from 'react';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  dense?: boolean;
}

/**
 * هيدر غامق موحّد لكل بطاقات البرنامج
 * (إدارة الملفات / التحكم في الطباعة / المعاينة البصرية / الاختصارات / خيارات الطباعة)
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  badge,
  children,
  className = '',
  dense = false,
}) => {
  return (
    <div
      className={`sect-hdr flex items-center justify-between gap-3 border-b border-white/10 ${
        dense ? 'px-3.5 py-2' : 'px-4 py-2.5'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 relative z-10">
        {icon && (
          <div className="w-8 h-8 shrink-0 rounded-lg bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white shadow-inner">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-white leading-tight truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-white/60 leading-tight truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 relative z-10">
        {badge}
        {children}
      </div>
    </div>
  );
};

/** شارة فاتحة تُستخدم داخل الهيدر الغامق */
export const HeaderBadge: React.FC<{
  children: React.ReactNode;
  tone?: 'light' | 'success' | 'warn';
  mono?: boolean;
}> = ({ children, tone = 'light', mono = false }) => {
  const tones: Record<string, string> = {
    light: 'bg-white/15 text-white/90 ring-1 ring-white/20',
    success: 'bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40',
    warn: 'bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/40',
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
        mono ? 'font-mono' : ''
      } ${tones[tone]}`}
    >
      {children}
    </span>
  );
};
