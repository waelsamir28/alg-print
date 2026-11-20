import React from 'react';
import { Printer, Minus, Square, X, Code2, ScanLine, FileText, CheckCircle2 } from 'lucide-react';

interface TitleBarProps {
  activeTab: 'print' | 'scanner';
  onTabChange: (tab: 'print' | 'scanner') => void;
  onOpenCodeExplorer: () => void;
  printerName: string;
  printerStatus: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeTab,
  onTabChange,
  onOpenCodeExplorer,
  printerName,
  printerStatus,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 select-none px-4 py-2 flex items-center justify-between shadow-xs sticky top-0 z-40">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <Printer className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-gray-900 font-sans">
              SMART <span className="text-blue-600">PRINT</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
              HP PageWide Pro
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">
              .NET 8 WPF
            </span>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">
            إدارة الطباعة المتقدمة والاسكانر الفوري لطابعات HP PageWide
          </p>
        </div>
      </div>

      {/* Main Navigation Segmented Tabs */}
      <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
        <button
          onClick={() => onTabChange('print')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'print'
              ? 'bg-white text-blue-600 shadow-xs border border-gray-200/80 scale-[1.02]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>1. الطباعة المتقدمة (Batch Print)</span>
        </button>

        <button
          onClick={() => onTabChange('scanner')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'scanner'
              ? 'bg-white text-blue-600 shadow-xs border border-gray-200/80 scale-[1.02]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <ScanLine className="w-4 h-4 text-emerald-600" />
          <span>2. الاسكانر والتصوير الفوري (Scanner & Copy)</span>
        </button>
      </div>

      {/* Right controls: Connected Printer Badge, Code Explorer & Windows 11 Controls */}
      <div className="flex items-center gap-3">
        {/* Quick status pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[160px]">{printerName.split('(')[0]}</span>
          <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded text-emerald-900">{printerStatus}</span>
        </div>

        {/* Source Code & Project Files Button */}
        <button
          onClick={onOpenCodeExplorer}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200 rounded-lg shadow-2xs transition-all active:scale-95"
          title="استعراض وتحميل كود المشروع C# .NET 8 WPF وملف GitHub Actions"
        >
          <Code2 className="w-4 h-4 text-indigo-600" />
          <span>مستكشف كود C# ومشروع WPF</span>
        </button>

        {/* Windows 11 Window Actions */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title="تصغير"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title="تكبير"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
