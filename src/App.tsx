import { useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { StatusBar } from './components/StatusBar';
import { AdvancedPrintTab } from './components/AdvancedPrintTab';
import { ScannerTab } from './components/ScannerTab';
import { PrintProgressModal } from './components/PrintProgressModal';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import {
  INSTALLED_PRINTERS,
  INSTALLED_SCANNERS,
} from './data/printersData';
import {
  PrintJobItem,
  PrinterInfo,
  PaperTray,
  PaperSize,
  ColorMode,
  DuplexMode,
  ImpositionLayout,
  PageRangeOption,
  ScannerDevice,
} from './types';

export function App() {
  // Navigation tabs: 'print' | 'scanner'
  const [activeTab, setActiveTab] = useState<'print' | 'scanner'>('print');

  // Modals state
  const [isCodeExplorerOpen, setIsCodeExplorerOpen] = useState<boolean>(false);
  const [isPrintProgressOpen, setIsPrintProgressOpen] = useState<boolean>(false);

  // Batch Print Jobs queue
  const [jobs, setJobs] = useState<PrintJobItem[]>([
    {
      id: 'job-1',
      name: 'عقد_توريد_وخدمات_رسمي.pdf',
      type: 'pdf',
      size: '1.4 MB',
      pageCount: 8,
      status: 'جاهز',
    },
    {
      id: 'job-2',
      name: 'كتيب_المنتجات_الملونة_PageWide.docx',
      type: 'docx',
      size: '3.8 MB',
      pageCount: 12,
      status: 'جاهز',
    },
    {
      id: 'job-3',
      name: 'مخطط_إنشائي_A3_معتمد.pdf',
      type: 'pdf',
      size: '2.1 MB',
      pageCount: 4,
      status: 'جاهز',
    },
    {
      id: 'job-4',
      name: 'شعار_الشركة_عالي_الدقة.png',
      type: 'image',
      size: '0.8 MB',
      pageCount: 1,
      status: 'جاهز',
    },
  ]);
  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');

  // Printer Controller state
  const [printers] = useState<PrinterInfo[]>(INSTALLED_PRINTERS);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterInfo>(INSTALLED_PRINTERS[0]);
  const [selectedTray, setSelectedTray] = useState<PaperTray>(INSTALLED_PRINTERS[0].paperTrays[1]); // Tray 2 default
  const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSize>(INSTALLED_PRINTERS[0].supportedSizes[0]); // A4

  // Print Layout & Options
  const [colorMode, setColorMode] = useState<ColorMode>('color');
  const [duplexMode, setDuplexMode] = useState<DuplexMode>('simplex');
  const [layout, setLayout] = useState<ImpositionLayout>('1-up');
  const [pageRange, setPageRange] = useState<PageRangeOption>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('');
  const [copies, setCopies] = useState<number>(1);
  const [activePresetId, setActivePresetId] = useState<string | undefined>(undefined);

  // Scanner WIA state
  const [scanners] = useState<ScannerDevice[]>(INSTALLED_SCANNERS);
  const [selectedScanner, setSelectedScanner] = useState<ScannerDevice>(INSTALLED_SCANNERS[0]);

  // Handle printer change
  const handleSelectPrinter = (printer: PrinterInfo) => {
    setSelectedPrinter(printer);
    setSelectedTray(printer.paperTrays[0]);
    setSelectedPaperSize(printer.supportedSizes[0]);
  };

  // Batch Print Jobs management
  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newJobs: PrintJobItem[] = Array.from(fileList).map((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const type = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'image';
      const approxPages = type === 'pdf' ? Math.max(1, Math.round(file.size / (150 * 1024))) : type === 'docx' ? 4 : 1;

      return {
        id: `job-added-${Date.now()}-${idx}`,
        name: file.name,
        type,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pageCount: Math.min(24, Math.max(1, approxPages)),
        status: 'جاهز',
        fileData: file,
      };
    });

    setJobs((prev) => [...prev, ...newJobs]);
    if (newJobs.length > 0) {
      setSelectedJobId(newJobs[0].id);
    }
  };

  const handleMoveUp = () => {
    const idx = jobs.findIndex((j) => j.id === selectedJobId);
    if (idx > 0) {
      const updated = [...jobs];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      setJobs(updated);
    }
  };

  const handleMoveDown = () => {
    const idx = jobs.findIndex((j) => j.id === selectedJobId);
    if (idx >= 0 && idx < jobs.length - 1) {
      const updated = [...jobs];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      setJobs(updated);
    }
  };

  const handleDeleteSelected = () => {
    const updated = jobs.filter((j) => j.id !== selectedJobId);
    setJobs(updated);
    if (updated.length > 0) {
      setSelectedJobId(updated[0].id);
    }
  };

  const handleClearAll = () => {
    setJobs([]);
    setSelectedJobId('');
  };

  // 3 Smart Quick Presets logic
  // 1. وضع التوفير: أبيض وأسود + وش وضهر + صفحتين في الورقة
  const handleApplyEcoPreset = () => {
    setColorMode('grayscale');
    setDuplexMode('duplex_long');
    setLayout('2-up');
    const tray2 = selectedPrinter.paperTrays.find((t) => t.id === 'tray-2') || selectedPrinter.paperTrays[0];
    setSelectedTray(tray2);
    setActivePresetId('eco-mode');
  };

  // 2. وضع الكتيب: Booklet
  const handleApplyBookletPreset = () => {
    setDuplexMode('duplex_short');
    setLayout('booklet');
    const tray2 = selectedPrinter.paperTrays.find((t) => t.id === 'tray-2') || selectedPrinter.paperTrays[0];
    setSelectedTray(tray2);
    setActivePresetId('booklet-mode');
  };

  // 3. جودة فائقة HP PageWide: ألوان + صفحة واحدة
  const handleApplyHighQualityPreset = () => {
    setColorMode('color');
    setDuplexMode('simplex');
    setLayout('1-up');
    const tray1 = selectedPrinter.paperTrays.find((t) => t.id === 'tray-1') || selectedPrinter.paperTrays[0];
    setSelectedTray(tray1);
    setActivePresetId('high-quality');
  };

  // Instant Copy trigger (Scans paper and dispatches immediately to printer)
  const handleInstantCopyPrint = (copyCopies: number) => {
    setCopies(copyCopies);
    setIsPrintProgressOpen(true);
  };

  // Calculations for StatusBar & Progress
  const totalPages = jobs.reduce((sum, j) => sum + j.pageCount, 0);
  const pagesPerSheet = layout === '2-up' ? 2 : layout === '4-up' ? 4 : layout === 'booklet' ? 4 : 1;
  const singleSideSheets = Math.max(1, Math.ceil(totalPages / pagesPerSheet));
  const totalPhysicalSheets = duplexMode !== 'simplex' ? Math.max(1, Math.ceil(singleSideSheets / 2)) : singleSideSheets;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 text-gray-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
    >
      {/* 1. Windows 11 Fluent App Header TitleBar */}
      <TitleBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
        printerName={selectedPrinter.name}
        printerStatus={selectedPrinter.status}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 p-2 sm:p-4 max-w-[1920px] w-full mx-auto overflow-y-auto">
        {activeTab === 'print' ? (
          <AdvancedPrintTab
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            onAddFiles={handleAddFiles}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDeleteSelected={handleDeleteSelected}
            onClearAll={handleClearAll}
            printers={printers}
            selectedPrinter={selectedPrinter}
            onSelectPrinter={handleSelectPrinter}
            selectedTray={selectedTray}
            onSelectTray={setSelectedTray}
            selectedPaperSize={selectedPaperSize}
            onSelectPaperSize={setSelectedPaperSize}
            colorMode={colorMode}
            onChangeColorMode={(m) => {
              setColorMode(m);
              setActivePresetId(undefined);
            }}
            duplexMode={duplexMode}
            onChangeDuplexMode={(d) => {
              setDuplexMode(d);
              setActivePresetId(undefined);
            }}
            layout={layout}
            onChangeLayout={(l) => {
              setLayout(l);
              setActivePresetId(undefined);
            }}
            pageRange={pageRange}
            onChangePageRange={setPageRange}
            customPageRange={customPageRange}
            onChangeCustomPageRange={setCustomPageRange}
            copies={copies}
            onChangeCopies={setCopies}
            onApplyEcoPreset={handleApplyEcoPreset}
            onApplyBookletPreset={handleApplyBookletPreset}
            onApplyHighQualityPreset={handleApplyHighQualityPreset}
            onStartPrint={() => setIsPrintProgressOpen(true)}
            activePresetId={activePresetId}
          />
        ) : (
          <ScannerTab
            scanners={scanners}
            selectedScanner={selectedScanner}
            onSelectScanner={setSelectedScanner}
            printer={selectedPrinter}
            tray={selectedTray}
            onInstantCopyPrint={handleInstantCopyPrint}
          />
        )}
      </main>

      {/* 3. Windows 11 Status Bar */}
      <StatusBar
        printer={selectedPrinter}
        tray={selectedTray}
        totalJobs={jobs.length}
        totalPages={totalPages}
      />

      {/* 4. HP PageWide High-Speed Printing Animation Modal */}
      <PrintProgressModal
        isOpen={isPrintProgressOpen}
        onClose={() => setIsPrintProgressOpen(false)}
        printer={selectedPrinter}
        tray={selectedTray}
        jobs={jobs}
        totalSheets={totalPhysicalSheets}
        copies={copies}
        layout={layout}
        isColor={colorMode === 'color'}
        duplexMode={duplexMode}
      />

      {/* 5. C# .NET 8 WPF Project Explorer & Source Code Modal */}
      <CodeExplorerModal
        isOpen={isCodeExplorerOpen}
        onClose={() => setIsCodeExplorerOpen(false)}
      />
    </div>
  );
}

export default App;
