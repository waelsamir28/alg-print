import React, { useState, useRef } from 'react';
import {
  Plus,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  Sparkles,
  BookOpen,
  Leaf,
  Printer,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Repeat,
  ChevronRight,
  ChevronLeft,
  FileUp,
  Sliders,
  CheckCircle2,
  Gauge
} from 'lucide-react';
import {
  PrintJobItem,
  PrinterInfo,
  PaperTray,
  PaperSize,
  ColorMode,
  DuplexMode,
  ImpositionLayout,
  PageRangeOption,
} from '../types';

interface AdvancedPrintTabProps {
  jobs: PrintJobItem[];
  selectedJobId: string;
  onSelectJob: (id: string) => void;
  onAddFiles: (files: FileList | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  printers: PrinterInfo[];
  selectedPrinter: PrinterInfo;
  onSelectPrinter: (printer: PrinterInfo) => void;
  selectedTray: PaperTray;
  onSelectTray: (tray: PaperTray) => void;
  selectedPaperSize: PaperSize;
  onSelectPaperSize: (size: PaperSize) => void;
  colorMode: ColorMode;
  onChangeColorMode: (mode: ColorMode) => void;
  duplexMode: DuplexMode;
  onChangeDuplexMode: (mode: DuplexMode) => void;
  layout: ImpositionLayout;
  onChangeLayout: (layout: ImpositionLayout) => void;
  pageRange: PageRangeOption;
  onChangePageRange: (range: PageRangeOption) => void;
  customPageRange: string;
  onChangeCustomPageRange: (val: string) => void;
  copies: number;
  onChangeCopies: (copies: number) => void;
  onApplyEcoPreset: () => void;
  onApplyBookletPreset: () => void;
  onApplyHighQualityPreset: () => void;
  onStartPrint: () => void;
  activePresetId?: string;
}

export const AdvancedPrintTab: React.FC<AdvancedPrintTabProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onAddFiles,
  onMoveUp,
  onMoveDown,
  onDeleteSelected,
  onClearAll,
  printers,
  selectedPrinter,
  onSelectPrinter,
  selectedTray,
  onSelectTray,
  selectedPaperSize,
  onSelectPaperSize,
  colorMode,
  onChangeColorMode,
  duplexMode,
  onChangeDuplexMode,
  layout,
  onChangeLayout,
  pageRange,
  onChangePageRange,
  customPageRange,
  onChangeCustomPageRange,
  copies,
  onChangeCopies,
  onApplyEcoPreset,
  onApplyBookletPreset,
  onApplyHighQualityPreset,
  onStartPrint,
  activePresetId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [isBackSide, setIsBackSide] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Total pages calculation
  const totalPages = jobs.reduce((sum, j) => sum + j.pageCount, 0);

  // Sheets calculation based on layout and duplex
  const pagesPerSheet = layout === '2-up' ? 2 : layout === '4-up' ? 4 : layout === 'booklet' ? 4 : 1;
  const singleSideSheets = Math.max(1, Math.ceil(totalPages / pagesPerSheet));
  const totalPhysicalSheets = duplexMode !== 'simplex' ? Math.max(1, Math.ceil(singleSideSheets / 2)) : singleSideSheets;

  const currentJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleNextSheet = () => {
    if (currentSheetIndex < totalPhysicalSheets - 1) {
      setCurrentSheetIndex(currentSheetIndex + 1);
    }
  };

  const handlePrevSheet = () => {
    if (currentSheetIndex > 0) {
      setCurrentSheetIndex(currentSheetIndex - 1);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipDuplex = () => {
    setIsBackSide(!isBackSide);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full p-1 select-none">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onAddFiles(e.target.files)}
        multiple
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        // @ts-expect-error directory upload
        webkitdirectory=""
        directory=""
        onChange={(e) => onAddFiles(e.target.files)}
        className="hidden"
      />

      {/* ================= COLUMN 1: File Batch Manager & Smart Quick Presets (4 cols) ================= */}
      <div className="xl:col-span-4 flex flex-col gap-3">
        {/* Batch File Manager Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex-1 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">إدارة الملفات (Batch Print)</h3>
                <p className="text-[11px] text-gray-500">
                  {jobs.length} ملفات جاهزة للطباعة ({totalPages} صفحة)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              PDF / DOCX / IMG
            </span>
          </div>

          {/* Action buttons toolbar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 my-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 transition-colors"
              title="إضافة ملفات PDF، صور أو وورد"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ملفات</span>
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              title="إضافة مجلد كامل"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>مجلد</span>
            </button>
            <button
              onClick={onMoveUp}
              className="flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              title="تحريك لأعلى"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>أعلى</span>
            </button>
            <button
              onClick={onMoveDown}
              className="flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              title="تحريك لأسفل"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>أسفل</span>
            </button>
            <button
              onClick={onDeleteSelected}
              className="flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
              title="حذف الملف المحدد"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
              title="مسح القائمة بالكامل"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          </div>

          {/* Drag & Drop File List Container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 rounded-xl border-2 transition-all p-2 overflow-y-auto min-h-[220px] max-h-[300px] flex flex-col ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/70 border-dashed scale-[0.99]'
                : 'border-gray-200 bg-gray-50/60'
            }`}
          >
            {jobs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <FileUp className="w-10 h-10 mb-2 text-gray-300 stroke-1" />
                <p className="text-xs font-bold text-gray-600">اسحب وأفلت الملفات هنا</p>
                <p className="text-[11px] text-gray-400 mt-1">يدعم ملفات PDF، صور JPG/PNG، ومستندات Word (.docx)</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
                >
                  أو انقر لاختيار ملفات من الجهاز
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {jobs.map((job) => {
                  const isSelected = job.id === selectedJobId;
                  return (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white hover:bg-gray-100/80 border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[220px]">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                            job.type === 'pdf'
                              ? isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-red-100 text-red-700'
                              : job.type === 'docx'
                              ? isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-100 text-blue-700'
                              : isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {job.type}
                        </span>
                        <span className="font-semibold truncate">{job.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {job.pageCount} صفحة
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {job.size}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3 Smart Quick Presets (الاختصارات الذكية المطلوبة) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-gray-900">أزرار الاختصارات الذكية (Quick Presets)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. وضع التوفير */}
            <button
              onClick={onApplyEcoPreset}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between group active:scale-95 ${
                activePresetId === 'eco-mode'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs'
                  : 'bg-gray-50/80 hover:bg-emerald-50/50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                {activePresetId === 'eco-mode' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900 group-hover:text-emerald-700">1. وضع التوفير</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  أبيض وأسود + وش وضهر + صفحتين في الورقة (2-up)
                </p>
              </div>
            </button>

            {/* 2. وضع الكتيب */}
            <button
              onClick={onApplyBookletPreset}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between group active:scale-95 ${
                activePresetId === 'booklet-mode'
                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/40 shadow-xs'
                  : 'bg-gray-50/80 hover:bg-indigo-50/50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                {activePresetId === 'booklet-mode' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900 group-hover:text-indigo-700">2. وضع الكتيب</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  ترتيب طي Booklets + دبوس المنتصف
                </p>
              </div>
            </button>

            {/* 3. جودة عالية */}
            <button
              onClick={onApplyHighQualityPreset}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between group active:scale-95 ${
                activePresetId === 'high-quality'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/40 shadow-xs'
                  : 'bg-gray-50/80 hover:bg-blue-50/50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                {activePresetId === 'high-quality' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900 group-hover:text-blue-700">3. جودة فائقة</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  ألوان كاملة CMYK + صفحة واحدة 1200 DPI
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ================= COLUMN 2: HP PageWide Controller, Paper Trays & Layout (4 cols) ================= */}
      <div className="xl:col-span-4 flex flex-col gap-3">
        {/* Printer & Trays Controller */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">التحكم في الطابعة والأدراج</h3>
                <p className="text-[11px] text-gray-500">HP PageWide Stationary Printbar</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              متصل وجاهز
            </span>
          </div>

          <div className="space-y-3 mt-3">
            {/* Printer Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الطابعة المثبتة:</label>
              <select
                value={selectedPrinter.id}
                onChange={(e) => {
                  const p = printers.find((item) => item.id === e.target.value);
                  if (p) onSelectPrinter(p);
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isPageWide ? '⚡ (PageWide)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Tray Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                درج الورق (Paper Trays المدعومة):
              </label>
              <select
                value={selectedTray.id}
                onChange={(e) => {
                  const t = selectedPrinter.paperTrays.find((item) => item.id === e.target.value);
                  if (t) onSelectTray(t);
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedPrinter.paperTrays.map((tray) => (
                  <option key={tray.id} value={tray.id}>
                    {tray.name} — سعة {tray.capacity} ({tray.currentLevelPercent}% متبقي)
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Size Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">حجم الورق الفعلي:</label>
              <select
                value={selectedPaperSize.id}
                onChange={(e) => {
                  const s = selectedPrinter.supportedSizes.find((item) => item.id === e.target.value);
                  if (s) onSelectPaperSize(s);
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedPrinter.supportedSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Real HP PageWide 981X Ink Gauges & Printbar condition */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-700">مستويات أحبار HP 981X:</span>
                <span className="text-[10px] text-gray-500 font-mono">PageWide Ink Cartridges</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold">
                {/* Black */}
                <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                  <div className="h-10 bg-gray-100 rounded flex flex-col justify-end p-0.5 mb-1 overflow-hidden">
                    <div
                      className="bg-gray-900 w-full rounded transition-all duration-500"
                      style={{ height: `${selectedPrinter.inkLevels.black}%` }}
                    />
                  </div>
                  <span className="text-gray-900">K {selectedPrinter.inkLevels.black}%</span>
                </div>

                {/* Cyan */}
                <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                  <div className="h-10 bg-gray-100 rounded flex flex-col justify-end p-0.5 mb-1 overflow-hidden">
                    <div
                      className="bg-sky-500 w-full rounded transition-all duration-500"
                      style={{ height: `${selectedPrinter.inkLevels.cyan}%` }}
                    />
                  </div>
                  <span className="text-sky-600">C {selectedPrinter.inkLevels.cyan}%</span>
                </div>

                {/* Magenta */}
                <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                  <div className="h-10 bg-gray-100 rounded flex flex-col justify-end p-0.5 mb-1 overflow-hidden">
                    <div
                      className="bg-rose-500 w-full rounded transition-all duration-500"
                      style={{ height: `${selectedPrinter.inkLevels.magenta}%` }}
                    />
                  </div>
                  <span className="text-rose-600">M {selectedPrinter.inkLevels.magenta}%</span>
                </div>

                {/* Yellow */}
                <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                  <div className="h-10 bg-gray-100 rounded flex flex-col justify-end p-0.5 mb-1 overflow-hidden">
                    <div
                      className="bg-amber-400 w-full rounded transition-all duration-500"
                      style={{ height: `${selectedPrinter.inkLevels.yellow}%` }}
                    />
                  </div>
                  <span className="text-amber-600">Y {selectedPrinter.inkLevels.yellow}%</span>
                </div>
              </div>

              {/* Stationary Printbar health */}
              <div className="mt-2.5 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-gray-600 font-semibold">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  <span>فوهات رأس PageWide (42,240 فوهة):</span>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  {selectedPrinter.printheadHealth}% كفاءة ممتازة
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Layout & Imposition Options */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 mb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900">خيارات الطباعة والتخطيط</h3>
          </div>

          <div className="space-y-3">
            {/* Color Mode Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">نمط الألوان:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeColorMode('color')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    colorMode === 'color'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                  <span>ألوان زاهية (Color)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeColorMode('grayscale')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    colorMode === 'grayscale'
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                  <span>أبيض وأسود (Grayscale)</span>
                </button>
              </div>
            </div>

            {/* Duplexing Options (الوش والضهر) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الوش والضهر (Duplex Mode):</label>
              <select
                value={duplexMode}
                onChange={(e) => onChangeDuplexMode(e.target.value as DuplexMode)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="simplex">وجه واحد فقط (Simplex - One Sided)</option>
                <option value="duplex_long">وجهين - قلب طرف طويل (Duplex Long Edge)</option>
                <option value="duplex_short">وجهين - قلب طرف قصير (Duplex Short Edge)</option>
              </select>
            </div>

            {/* Page Layout / Imposition (1-up, 2-up, 4-up, Booklet) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                تخطيط الصفحات في الورقة (Layout):
              </label>
              <select
                value={layout}
                onChange={(e) => onChangeLayout(e.target.value as ImpositionLayout)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1-up">1-up: صفحة واحدة لكل ورقة (عادي)</option>
                <option value="2-up">2-up: صفحتان جنباً إلى جنب في الورقة</option>
                <option value="4-up">4-up: أربع صفحات في الورقة الواحدة (2×2)</option>
                <option value="booklet">Booklet: كتيب مطوي بمنتصف الدبوس (Saddle Stitch)</option>
              </select>
            </div>

            {/* Copies & Page Range */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عدد النسخ:</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={copies}
                    onChange={(e) => onChangeCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نطاق الصفحات:</label>
                <select
                  value={pageRange}
                  onChange={(e) => onChangePageRange(e.target.value as PageRangeOption)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">كافة الصفحات</option>
                  <option value="odd">صفحات فردية فقط</option>
                  <option value="even">صفحات زوجية فقط</option>
                  <option value="custom">مخصص (أرقام)</option>
                </select>
              </div>
            </div>

            {pageRange === 'custom' && (
              <div>
                <input
                  type="text"
                  placeholder="مثال: 1-5, 8, 11-14"
                  value={customPageRange}
                  onChange={(e) => onChangeCustomPageRange(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= COLUMN 3: Real Visual Preview & Big Print Button (4 cols) ================= */}
      <div className="xl:col-span-4 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex-1 flex flex-col">
          {/* Preview Header & Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900">المعاينة البصرية التفاعلية</h3>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                تحديث حي
              </span>
            </div>

            {/* Next / Prev Sheet controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevSheet}
                disabled={currentSheetIndex === 0}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition-colors"
                title="الورقة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 px-1 font-mono">
                {currentSheetIndex + 1} / {totalPhysicalSheets}
              </span>
              <button
                onClick={handleNextSheet}
                disabled={currentSheetIndex >= totalPhysicalSheets - 1}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition-colors"
                title="الورقة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zoom / Rotate / Duplex Flip Toolbar */}
          <div className="flex items-center justify-between bg-gray-100/80 p-1.5 rounded-xl my-2.5 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 hover:bg-white rounded-lg text-[11px] font-mono text-gray-600 transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleRotate}
                className="flex items-center gap-1 px-2.5 py-1 hover:bg-white rounded-lg font-semibold text-gray-700 transition-colors"
                title="تدوير الصفحة 90 درجة"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>تدوير</span>
              </button>

              <button
                onClick={handleFlipDuplex}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  isBackSide ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-white text-gray-700'
                }`}
                title="قلب بين الوجه والظهر للطباعة على الوجهين"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{isBackSide ? 'الظهر (Back)' : 'الوجه (Front)'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Document Sheet Canvas */}
          <div className="flex-1 bg-slate-800 rounded-xl p-4 flex items-center justify-center overflow-hidden min-h-[320px] relative">
            {/* Sheet shadow wrapper with zoom & rotation */}
            <div
              className={`transition-all duration-300 transform origin-center ${
                colorMode === 'grayscale' ? 'grayscale contrast-110' : ''
              }`}
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              {/* Paper Sheet representation */}
              <div className="w-[240px] h-[340px] sm:w-[260px] sm:h-[368px] bg-white rounded-sm shadow-2xl p-4 flex flex-col justify-between text-gray-800 relative overflow-hidden border border-gray-200">
                {/* Visual Watermark of Side */}
                <div className="absolute top-2 left-2 text-[9px] font-bold text-gray-400 font-mono px-1 bg-gray-100 rounded">
                  {isBackSide ? 'ظهر الورقة (Back)' : 'وجه الورقة (Front)'}
                </div>

                {/* Layout Renderer: 1-up, 2-up, 4-up, or Booklet */}
                {layout === '1-up' && (
                  <div className="flex-1 flex flex-col justify-between pt-4">
                    {/* Document Header */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <div className="h-3 w-24 bg-blue-600 rounded" />
                        <div className="h-2 w-12 bg-gray-200 rounded" />
                      </div>
                      <div className="mt-3 text-[11px] font-bold text-gray-900 truncate">
                        {currentJob?.name || 'مستند بدون اسم'}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        صفحة {currentSheetIndex + 1} من {totalPages}
                      </div>

                      {/* Simulated text lines */}
                      <div className="space-y-2 mt-4">
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-11/12" />
                        <div className="h-2 bg-gray-200 rounded w-4/5" />
                        <div className="h-2 bg-gray-200 rounded w-5/6" />
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-2/3" />
                      </div>

                      {/* Mock Chart / Illustration */}
                      <div className="mt-4 p-2 bg-blue-50/80 rounded border border-blue-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-2 w-16 bg-blue-400 rounded" />
                          <div className="h-1.5 w-10 bg-blue-300 rounded" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-700">
                          HP
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[8px] text-gray-400">
                      <span>SMART PRINT PageWide</span>
                      <span>ورقة {currentSheetIndex + 1}</span>
                    </div>
                  </div>
                )}

                {/* 2-up Layout (Two sub-pages side by side) */}
                {layout === '2-up' && (
                  <div className="flex-1 flex gap-2 pt-4 relative">
                    {/* Center dividing dashed line */}
                    <div className="absolute inset-y-4 left-1/2 -ml-[0.5px] border-r border-dashed border-gray-400" />

                    {/* Left Sub-page */}
                    <div className="flex-1 border border-gray-200 rounded p-1.5 flex flex-col justify-between bg-gray-50/50">
                      <div>
                        <div className="h-2 bg-blue-600 rounded w-12 mb-1" />
                        <div className="text-[8px] font-bold text-gray-700">صفحة #{currentSheetIndex * 2 + 1}</div>
                        <div className="space-y-1 mt-2">
                          <div className="h-1 bg-gray-300 rounded w-full" />
                          <div className="h-1 bg-gray-300 rounded w-4/5" />
                          <div className="h-1 bg-gray-300 rounded w-2/3" />
                          <div className="h-1 bg-gray-300 rounded w-full" />
                        </div>
                      </div>
                      <div className="text-[7px] text-gray-400 text-center border-t pt-0.5">2-up L</div>
                    </div>

                    {/* Right Sub-page */}
                    <div className="flex-1 border border-gray-200 rounded p-1.5 flex flex-col justify-between bg-gray-50/50">
                      <div>
                        <div className="h-2 bg-blue-600 rounded w-12 mb-1" />
                        <div className="text-[8px] font-bold text-gray-700">صفحة #{currentSheetIndex * 2 + 2}</div>
                        <div className="space-y-1 mt-2">
                          <div className="h-1 bg-gray-300 rounded w-full" />
                          <div className="h-1 bg-gray-300 rounded w-4/5" />
                          <div className="h-1 bg-gray-300 rounded w-3/4" />
                          <div className="h-1 bg-gray-300 rounded w-5/6" />
                        </div>
                      </div>
                      <div className="text-[7px] text-gray-400 text-center border-t pt-0.5">2-up R</div>
                    </div>
                  </div>
                )}

                {/* 4-up Layout (2x2 grid) */}
                {layout === '4-up' && (
                  <div className="flex-1 grid grid-cols-2 gap-1.5 pt-4">
                    {[1, 2, 3, 4].map((num) => (
                      <div
                        key={num}
                        className="border border-gray-200 rounded p-1 flex flex-col justify-between bg-gray-50/60"
                      >
                        <div>
                          <div className="text-[7px] font-bold text-blue-700">
                            ص {currentSheetIndex * 4 + num}
                          </div>
                          <div className="space-y-0.5 mt-1">
                            <div className="h-0.5 bg-gray-300 rounded w-full" />
                            <div className="h-0.5 bg-gray-300 rounded w-4/5" />
                            <div className="h-0.5 bg-gray-300 rounded w-2/3" />
                          </div>
                        </div>
                        <div className="text-[6px] text-gray-400 text-center">4-up</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Booklet Layout (Folded booklet with staple indication) */}
                {layout === 'booklet' && (
                  <div className="flex-1 flex gap-2 pt-4 relative">
                    {/* Saddle stitch fold line with staple mark */}
                    <div className="absolute inset-y-2 left-1/2 -ml-[1px] border-r-2 border-dotted border-red-500 flex flex-col justify-between items-center py-4">
                      <div className="w-1.5 h-3 bg-red-600 rounded-sm -ml-[2px]" title="دبوس تدبيس الكتيب" />
                      <div className="w-1.5 h-3 bg-red-600 rounded-sm -ml-[2px]" title="دبوس تدبيس الكتيب" />
                    </div>

                    <div className="flex-1 border border-indigo-200 rounded p-1.5 flex flex-col justify-between bg-indigo-50/40">
                      <div>
                        <span className="text-[8px] font-bold text-indigo-800 block">
                          {isBackSide ? 'الغلاف الداخلي' : 'غلاف أخير (Back Cover)'}
                        </span>
                        <div className="space-y-1 mt-2">
                          <div className="h-1 bg-indigo-200 rounded w-full" />
                          <div className="h-1 bg-indigo-200 rounded w-4/5" />
                          <div className="h-1 bg-indigo-200 rounded w-2/3" />
                        </div>
                      </div>
                      <div className="text-[7px] text-indigo-600 font-mono">Booklet Signature</div>
                    </div>

                    <div className="flex-1 border border-indigo-200 rounded p-1.5 flex flex-col justify-between bg-indigo-50/40">
                      <div>
                        <span className="text-[8px] font-bold text-indigo-800 block">
                          {isBackSide ? 'صفحة 2' : 'غلاف رئيسي (Front Cover)'}
                        </span>
                        <div className="space-y-1 mt-2">
                          <div className="h-1 bg-indigo-200 rounded w-full" />
                          <div className="h-1 bg-indigo-200 rounded w-4/5" />
                          <div className="h-1 bg-indigo-200 rounded w-full" />
                        </div>
                      </div>
                      <div className="text-[7px] text-indigo-600 font-mono">Fold &amp; Staple</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prominent Windows 11 Primary Print Button */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span className="font-semibold">
                المجموع:{' '}
                <strong className="text-gray-900">
                  {totalPhysicalSheets * copies} ورقة
                </strong>{' '}
                ({copies} نسخ)
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                الدرج: {selectedTray.name.split('(')[0]}
              </span>
            </div>

            <button
              onClick={onStartPrint}
              disabled={jobs.length === 0}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-lg shadow-blue-600/30 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-5 h-5 animate-pulse" />
              <span>بدء الطباعة الآن (Print Job)</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">
                {selectedPrinter.maxSpeedPpm} PPM
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
