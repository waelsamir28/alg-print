import React from 'react';
import { Printer, ScanLine } from 'lucide-react';

interface NavTabsProps {
  activeTab: 'print' | 'scanner';
  onTabChange: (tab: 'print' | 'scanner') => void;
}

/** الزرّان اللذان كانا في الهيدر — أصبحا أسفل الهيدر باسم «طباعة» و«الاسكانر» */
export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onTabChange }) => {
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
    <nav className="hdr-grad-soft border-b border-black/25 px-3 sm:px-4 py-1.5 flex items-center gap-2 select-none">
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

      <span className="ms-auto hidden sm:flex items-center gap-1.5 text-[11px] text-white/45 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        HP PageWide Engine Ready
      </span>
    </nav>
  );
};
