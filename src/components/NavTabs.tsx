import React from 'react';
import {
  Printer,
  ScanLine,
  ListOrdered,
  Package,
  Keyboard,
  PenTool,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface NavTabsProps {
  activeTab: 'print' | 'scanner';
  onTabChange: (tab: 'print' | 'scanner') => void;
  activeJobLabel?: string;
  activeJobProgress?: number;
  onOpenQueue: () => void;
  onOpenStock: () => void;
  onOpenShortcuts: () => void;
  onOpenSignature: () => void;
}

/** الزرّان أسفل الهيدر + شريط أدوات سريع (طابور / مخزون / توقيع / اختصارات) */
export const NavTabs: React.FC<NavTabsProps> = ({
  activeTab,
  onTabChange,
  activeJobLabel,
  activeJobProgress,
  onOpenQueue,
  onOpenStock,
  onOpenShortcuts,
  onOpenSignature,
}) => {
  const { queue, lowStock, signature } = useWorkspace();
  const pendingCount = queue.filter((j) => ['queued', 'printing', 'paused'].includes(j.status)).length;

  const tabs = [
    {
      id: 'print' as const,
      label: 'طباعة',
      hint: 'الطباعة المتقدمة ودفعات الملفات',
      icon: <Printer className="w-4 h-4" />,
    },
    {
      id: 'scanner' as const,
      label: 'الاسكانر',
      hint: 'المسح الضوئي والتصوير الفوري',
      icon: <ScanLine className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="hdr-grad-soft border-b border-black/25 px-3 sm:px-4 py-1.5 flex items-center gap-2 select-none flex-wrap">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.hint}
            className={`btn-pop btn-shine flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
              active
                ? 'bg-white text-[var(--t-primary-ink)] shadow-md shadow-black/25'
                : 'bg-white/10 text-white/85 ring-1 ring-white/20 hover:bg-white/20'
            }`}
          >
            <span className={active ? 'text-[var(--t-primary)]' : 'text-white/85'}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* شريط الأدوات السريع */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenQueue}
          title="طابور الطباعة (Ctrl+Q)"
          className="btn-pop relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 ring-1 ring-white/20 text-white/90 hover:bg-white/20 text-[11px] font-bold"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span className="hidden md:inline">الطابور</span>
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--t-accent)] text-slate-900 text-[9px] font-black flex items-center justify-center shadow">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenStock}
          title="المخزون والأحبار (Ctrl+K)"
          className="btn-pop relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 ring-1 ring-white/20 text-white/90 hover:bg-white/20 text-[11px] font-bold"
        >
          <Package className="w-3.5 h-3.5" />
          <span className="hidden md:inline">المخزون</span>
          {lowStock.length > 0 && (
            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow">
              <AlertTriangle className="w-2.5 h-2.5" strokeWidth={3} />
            </span>
          )}
        </button>

        <button
          onClick={onOpenSignature}
          title="التوقيع الإلكتروني (Ctrl+E)"
          className={`btn-pop flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ${
            signature
              ? 'bg-emerald-400/20 ring-emerald-300/40 text-emerald-100'
              : 'bg-white/10 ring-white/20 text-white/90 hover:bg-white/20'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{signature ? 'توقيع محفوظ' : 'توقيع'}</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          title="اختصارات لوحة المفاتيح (F1)"
          className="btn-pop flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 text-white/90 hover:bg-white/20"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* حالة المهمة الجارية */}
      {activeJobLabel ? (
        <span className="ms-auto hidden sm:flex items-center gap-1.5 text-[11px] text-white/70 font-semibold max-w-[280px]">
          <Loader2 className="w-3 h-3 animate-spin text-[var(--t-accent)]" />
          <span className="truncate">{activeJobLabel}</span>
          <span className="font-mono text-[var(--t-accent)]">{activeJobProgress}%</span>
        </span>
      ) : (
        <span className="ms-auto hidden sm:flex items-center gap-1.5 text-[11px] text-white/45 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          HP PageWide Engine Ready
        </span>
      )}
    </nav>
  );
};
