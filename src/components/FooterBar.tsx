import React from 'react';
import { Code2, Check, Layers, Gauge, ScanLine, FileStack, Cpu } from 'lucide-react';
import { PrinterInfo, PaperTray } from '../types';

interface FooterBarProps {
  printer: PrinterInfo;
  tray: PaperTray;
  totalJobs: number;
  totalPages: number;
  onOpenCodeExplorer: () => void;
}

/**
 * فوتر غامق: يحتوي أيقونة مستكشف الكود، بيانات التصميم والتنفيذ، وحالة النظام
 */
export const FooterBar: React.FC<FooterBarProps> = ({
  printer,
  tray,
  totalJobs,
  totalPages,
  onOpenCodeExplorer,
}) => {
  return (
    <footer className="sect-hdr border-t border-black/40 select-none">
      <div className="px-3 sm:px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between text-[11px] text-white/75">
        {/* يمين: حالة النظام */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap relative z-10">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>الطابعة: متصل</span>
            <Check className="w-3 h-3 text-emerald-300" strokeWidth={3} />
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>الدرج: {tray.name.split('(')[0]}</span>
            <span className="bg-amber-400/20 text-amber-100 px-1.5 rounded font-bold">
              {tray.currentLevelPercent}%
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[var(--t-accent)]" />
            <span>فوهات PageWide {printer.printheadHealth}%</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5 text-emerald-300" />
            <span>WIA 2.0 جاهز</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5">
            <FileStack className="w-3.5 h-3.5 text-sky-300" />
            <span>
              {totalJobs} ملفات · {totalPages} صفحة
            </span>
          </div>
        </div>

        {/* وسط: بيانات المصمم والمنفذ */}
        <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 ring-1 ring-white/15">
          <Cpu className="w-3.5 h-3.5 text-[var(--t-accent)]" />
          <span className="font-bold text-white whitespace-nowrap">
            تصميم وتنفيذ م/ وائل الجمال
          </span>
          <span className="text-white/45">|</span>
          <a
            href="tel:01222355769"
            className="font-mono font-bold text-[var(--t-accent)] hover:text-white transition-colors whitespace-nowrap"
            dir="ltr"
          >
            01222355769
          </a>
        </div>

        {/* شمال: أيقونة مستكشف الكود + badge */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={onOpenCodeExplorer}
            title="مستكشف كود المشروع C# .NET 8 WPF"
            className="btn-pop btn-shine w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <span className="hidden sm:inline font-mono text-[10px] bg-white/10 ring-1 ring-white/15 px-2 py-0.5 rounded text-white/60">
            v1.0.0 · .NET 8 WPF
          </span>
        </div>
      </div>
    </footer>
  );
};
