import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle, Sparkles, X, Clock, Zap } from 'lucide-react';
import { PrinterInfo, PaperTray, PrintJobItem } from '../types';

interface PrintProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: PrinterInfo;
  tray: PaperTray;
  jobs: PrintJobItem[];
  totalSheets: number;
  copies: number;
  layout: string;
  isColor: boolean;
  duplexMode: string;
}

export const PrintProgressModal: React.FC<PrintProgressModalProps> = ({
  isOpen,
  onClose,
  printer,
  tray,
  jobs,
  totalSheets,
  copies,
  layout,
  isColor,
  duplexMode,
}) => {
  const [currentSheet, setCurrentSheet] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const effectiveTotalSheets = Math.max(1, totalSheets * copies);

  useEffect(() => {
    if (!isOpen) {
      setCurrentSheet(0);
      setIsCompleted(false);
      return;
    }

    setCurrentSheet(0);
    setIsCompleted(false);

    // HP PageWide ultra-fast speed simulation (75 pages per minute ~ 800ms per sheet)
    const intervalTime = Math.max(300, Math.min(800, 4000 / effectiveTotalSheets));

    const timer = setInterval(() => {
      setCurrentSheet((prev) => {
        if (prev + 1 >= effectiveTotalSheets) {
          clearInterval(timer);
          setIsCompleted(true);
          return effectiveTotalSheets;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, effectiveTotalSheets]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((currentSheet / effectiveTotalSheets) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden text-right animate-pop-in">
        {/* Modal Header */}
        <div className="sect-hdr px-5 py-4 flex items-center justify-between">
          <span className="absolute inset-0" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Printer className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {isCompleted ? 'اكتملت مهمة الطباعة بنجاح!' : 'جاري إرسال وطباعة المستندات...'}
              </h3>
              <p className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>محرك الطباعة فائق السرعة HP PageWide (حتى 75 PPM)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Animated PageWide Printing Visualizer */}
          <div className="relative bg-gray-900 rounded-xl p-6 overflow-hidden mb-6 text-center text-white">
            {/* Background Stationary Printbar representation */}
            <div className="absolute top-2 inset-x-4 h-2 rounded bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 opacity-90 shadow-md shadow-fuchsia-500/50" />
            <div className="text-[10px] text-gray-400 mb-4 mt-1 font-mono tracking-widest uppercase">
              HP PageWide 42,240 Nozzles Stationary Printbar Active
            </div>

            {/* Sheet ejection animation */}
            <div className="relative h-28 flex items-center justify-center">
              <div
                className={`w-32 h-24 bg-white rounded-lg shadow-xl border border-gray-300 p-2 text-gray-800 transition-all duration-300 flex flex-col justify-between ${
                  !isCompleted ? 'animate-pulse scale-105 shadow-blue-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-[10px] font-bold text-blue-600">SMART PRINT</span>
                  <span className="text-[9px] text-gray-500">
                    ورقة #{currentSheet}
                  </span>
                </div>
                <div className="space-y-1 my-1">
                  <div className="h-1 bg-gray-200 rounded w-full" />
                  <div className="h-1 bg-gray-200 rounded w-4/5" />
                  <div className="h-1 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="text-[9px] text-emerald-600 font-semibold text-left">
                  {isColor ? 'Color CMYK' : 'Grayscale'}
                </div>
              </div>
            </div>

            {/* Live Progress counter */}
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-300 font-semibold">
                الورقة المطبوعة: <strong className="text-white text-sm">{currentSheet}</strong> من {effectiveTotalSheets}
              </span>
              <span className="text-amber-400 font-bold">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden mt-1.5 p-0.5">
              <div
                className="bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Job summary details */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-400 block mb-0.5">الطابعة المستهدفة:</span>
              <span className="font-bold text-gray-900 truncate block">{printer.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">درج التغذية:</span>
              <span className="font-bold text-gray-900">{tray.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">التخطيط والوش/ضهر:</span>
              <span className="font-bold text-gray-900">
                {layout} • {duplexMode === 'simplex' ? 'وجه واحد' : 'وش وضهر'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">عدد النسخ والملفات:</span>
              <span className="font-bold text-gray-900">
                {copies} نسخ ({jobs.length} ملفات)
              </span>
            </div>
          </div>

          {/* Status Message */}
          {isCompleted ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">تم خروج كافة الأوراق في درج الاستقبال!</strong>
                <span>تم إتمام المهمة في {Math.max(1, Math.round(effectiveTotalSheets * 0.8))} ثواني بمعدل كفاءة 100%.</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
              <span>جاري ضخ الحبر النفاث الصبغي المقاوم للماء على الأوراق...</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            {isCompleted ? (
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>إغلاق وفتح مستكشف المطبوعات</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
              >
                إلغاء أمر الطباعة (Cancel)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
