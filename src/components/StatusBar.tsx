import React from 'react';
import { Wifi, Layers, Gauge, ScanLine, Info } from 'lucide-react';
import { PrinterInfo, PaperTray } from '../types';

interface StatusBarProps {
  printer: PrinterInfo;
  tray: PaperTray;
  totalJobs: number;
  totalPages: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  printer,
  tray,
  totalJobs,
  totalPages,
}) => {
  return (
    <footer className="bg-white border-t border-gray-200 text-xs text-gray-600 px-4 py-1.5 flex flex-wrap items-center justify-between select-none">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Connected Printer */}
        <div className="flex items-center gap-1.5 font-medium text-gray-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>الطابعة:</span>
          <span className="text-blue-700 font-bold">{printer.name}</span>
          <span className="text-gray-400">({printer.ipAddress})</span>
        </div>

        {/* Tray Status */}
        <div className="flex items-center gap-1.5 text-gray-700">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>الدرج النشط:</span>
          <span className="font-semibold text-gray-900">{tray.name}</span>
          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
            {tray.currentLevelPercent}% متبقي
          </span>
        </div>

        {/* HP PageWide Printbar Condition */}
        <div className="flex items-center gap-1.5 text-gray-700">
          <Gauge className="w-3.5 h-3.5 text-indigo-600" />
          <span>رأس PageWide الثابت:</span>
          <span className="text-indigo-700 font-bold">{printer.printheadHealth}% كفاءة فوهات</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-1 sm:mt-0">
        {/* Scanner WIA Protocol Status */}
        <div className="flex items-center gap-1.5 text-gray-600">
          <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
          <span>WIA 2.0 COM: جاهز للاتصال</span>
        </div>

        {/* Queue Stats */}
        <div className="flex items-center gap-1.5 font-semibold text-gray-800">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>قائمة الطباعة: {totalJobs} ملفات ({totalPages} صفحة)</span>
        </div>

        {/* Environment Badge */}
        <div className="flex items-center gap-1 text-[11px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
          <Wifi className="w-3 h-3 text-emerald-600" />
          <span>Ready | C# .NET 8 WPF</span>
        </div>
      </div>
    </footer>
  );
};
