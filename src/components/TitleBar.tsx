import React from 'react';
import {
  Minus,
  Square,
  X,
  Check,
  Settings,
  ZoomIn,
  ZoomOut,
  Printer,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useSettings } from '../context/SettingsContext';

interface TitleBarProps {
  printerStatus: string;
  onOpenSettings: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

/**
 * هيدر البرنامج الغامق (جريدانت أزرق وكحلي)
 * الاسم على أقصى الشمال + أزرار النافذة على أقصى اليمين
 */
export const TitleBar: React.FC<TitleBarProps> = ({
  printerStatus,
  onOpenSettings,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  const { uiScale, zoomIn, zoomOut, resetZoom } = useSettings();
  const isConnected = printerStatus.includes('متصل');

  return (
    <header className="hdr-grad select-none sticky top-0 z-40 border-b border-black/30 shadow-[0_10px_30px_-18px_rgba(2,6,23,.9)]">
      {/* خط إضاءة علوي */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--t-accent)]/70 to-transparent" />

      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* ── أقصى اليمين: أزرار الإغلاق والتكبير والتصغير ── */}
        <div className="flex items-center gap-1 border-e border-white/15 pe-2 me-1">
          <button
            onClick={onMinimize}
            className="btn-pop w-8 h-8 rounded-md flex items-center justify-center text-white/75 hover:bg-white/15 hover:text-white"
            title="تصغير"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onMaximize}
            className="btn-pop w-8 h-8 rounded-md flex items-center justify-center text-white/75 hover:bg-white/15 hover:text-white"
            title="تكبير"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="btn-pop w-8 h-8 rounded-md flex items-center justify-center text-white/75 hover:bg-red-500 hover:text-white"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── أدوات: الإعدادات + تكبير/تصغير الواجهة + حالة الاتصال ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* إعدادات البرنامج (ترس) */}
          <button
            onClick={onOpenSettings}
            className="btn-pop btn-shine w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-white/20 flex items-center justify-center text-white group"
            title="إعدادات البرنامج"
          >
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          </button>

          {/* زر تكبير / تصغير الواجهة */}
          <div className="flex items-center rounded-lg bg-white/10 ring-1 ring-white/20 overflow-hidden">
            <button
              onClick={zoomOut}
              disabled={uiScale <= 0.8}
              className="btn-pop w-7 h-7 flex items-center justify-center text-white/85 hover:bg-white/20 disabled:opacity-35"
              title="تصغير الواجهة"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="btn-pop px-1.5 h-7 text-[10px] font-mono font-bold text-white/85 hover:bg-white/15 min-w-[38px]"
              title="إعادة الحجم الافتراضي 100%"
            >
              {Math.round(uiScale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={uiScale >= 1.3}
              className="btn-pop w-7 h-7 flex items-center justify-center text-white/85 hover:bg-white/20 disabled:opacity-35"
              title="تكبير الواجهة"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* الطابعة المتصلة: كلمة «متصل» وعلامة صح فقط */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-400/15 ring-1 ring-emerald-300/35 text-emerald-100 text-xs font-bold whitespace-nowrap"
            title="الطابعة متصلة"
          >
            <Check className="w-3.5 h-3.5 text-emerald-300" strokeWidth={3} />
            <span>{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
        </div>

        {/* ── اسم البرنامج: الكلمتان جنب بعض على أقصى الشمال ── */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 ring-1 ring-white/20 text-[10px] font-bold text-white/70 whitespace-nowrap">
            HP PageWide Pro
          </span>

          {/* لوجو PRO SALES + اسم البرنامج كلمتين جنب بعض */}
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo height="clamp(34px, 3.8vw, 54px)" compact glow className="anim-float shrink-0" />
            <div className="leading-none text-left hidden sm:block">
              <div className="flex items-baseline gap-1.5 font-black tracking-tight text-lg sm:text-xl">
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
              <div className="mt-1 text-[10px] font-semibold tracking-wide text-white/65">
                للطباعة المتقدمة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط سفلي رقيق داخل الهيدر */}
      <div className="px-4 pb-1.5 -mt-0.5 flex items-center justify-end gap-2 text-[10px] text-white/40 font-mono">
        <span>PRO SALES · SMART PRINT · للطباعة المتقدمة والاسكانر</span>
        <Printer className="w-3 h-3" />
      </div>
    </header>
  );
};
