import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { NavTabs } from './components/NavTabs';
import { FooterBar } from './components/FooterBar';
import { AdvancedPrintTab } from './components/AdvancedPrintTab';
import { ScannerTab } from './components/ScannerTab';
import { PrintProgressModal } from './components/PrintProgressModal';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { SettingsPage } from './components/SettingsPage';
import { PrintQueue } from './components/PrintQueue';
import { StockPanel } from './components/StockPanel';
import { SignaturePad } from './components/SignaturePad';
import { ShortcutsPanel } from './components/ShortcutsPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWorkspace } from './context/WorkspaceContext';
import { InstallerWizard } from './components/InstallerWizard';
import { SplashWelcome } from './components/SplashWelcome';
import { useSettings } from './context/SettingsContext';
import { useLicense } from './context/LicenseContext';
import { ActivationModal, ActivationSuccessToast } from './components/ActivationModal';
import { TrialBanner } from './components/TrialBanner';
import { ActivationSite } from './components/ActivationSite';
import { ContactPage } from './components/ContactPage';
import { PdfToolsModal } from './components/PdfToolsModal';
import { ImageCompressorModal } from './components/ImageCompressorModal';
import { DocumentDiffModal } from './components/DocumentDiffModal';
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
  const { installed, setInstalled, uiScale, zoomIn, zoomOut, resetZoom } = useSettings();
  const { activeJob, enqueueJob, watermark } = useWorkspace();
  const { isLocked, status: licenseStatus } = useLicense();

  // صفحة تفعيل المطوّر (مسار منفصل #/activate)
  const [route, setRoute] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
  );
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#', ''));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // شاشات التثبيت والترحيب
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // Navigation tabs: 'print' | 'scanner'
  const [activeTab, setActiveTab] = useState<'print' | 'scanner'>('print');

  // Modals state
  const [isCodeExplorerOpen, setIsCodeExplorerOpen] = useState<boolean>(false);
  const [isPrintProgressOpen, setIsPrintProgressOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isStockOpen, setIsStockOpen] = useState<boolean>(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isActivationOpen, setIsActivationOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isPdfToolsOpen, setIsPdfToolsOpen] = useState<boolean>(false);
  const [isCompressorOpen, setIsCompressorOpen] = useState<boolean>(false);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [showActivated, setShowActivated] = useState<boolean>(false);
  const [activationReason, setActivationReason] = useState<'manual' | 'expired'>('manual');

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

  /** إرسال المهمة إلى طابور الطباعة الرسمي */
  const handleEnqueuePrint = () => {
    enqueueJob({
      title:
        jobs.length === 1
          ? jobs[0].name
          : `دفعة طباعة — ${jobs.length} ملفات (${jobs[0]?.name ?? ''}...)`,
      files: jobs.length,
      sheets: totalPhysicalSheets,
      copies,
      printerName: selectedPrinter.name.split('(')[0].trim(),
      trayName: selectedTray.name,
      isColor: colorMode === 'color',
      duplex: duplexMode !== 'simplex',
    });
    setIsPrintProgressOpen(true);
  };

  // اختصارات لوحة المفاتيح
  const closeAllOverlays = useCallback(() => {
    setIsSettingsOpen(false);
    setIsQueueOpen(false);
    setIsStockOpen(false);
    setIsSignatureOpen(false);
    setIsShortcutsOpen(false);
    setIsPrintProgressOpen(false);
    setIsPdfToolsOpen(false);
    setIsCompressorOpen(false);
    setIsDiffOpen(false);
    setIsActivationOpen(false);
    setIsContactOpen(false);
    setIsCodeExplorerOpen(false);
  }, []);

  const openActivation = useCallback((reason: 'manual' | 'expired' = 'manual') => {
    setActivationReason(reason);
    setIsActivationOpen(true);
  }, []);

  // ربط الأحداث في useMemo لمنع إعادة التسجيل في كل render
  const shortcuts = useMemo(
    () => ({
      enabled: installed && !showSplash,
      onPrint: () => {
        if (jobs.length > 0) handleEnqueuePrint();
      },
      onAddFiles: () => {
        const input = document.querySelector<HTMLInputElement>('input[type="file"][multiple]');
        input?.click();
      },
      onSettings: () => setIsSettingsOpen(true),
      onHelp: () => setIsShortcutsOpen(true),
      onQueue: () => setIsQueueOpen(true),
      onStock: () => setIsStockOpen(true),
      onSignature: () => setIsSignatureOpen(true),
      onPdfTools: () => setIsPdfToolsOpen(true),
      onImageCompressor: () => setIsCompressorOpen(true),
      onDiff: () => setIsDiffOpen(true),
      onActivation: () => openActivation('manual'),
      onZoomIn: zoomIn,
      onZoomOut: zoomOut,
      onZoomReset: resetZoom,
      onTabChange: (tab: 'print' | 'scanner') => setActiveTab(tab),
      onScannerTab: () => setActiveTab('scanner'),
      onEscape: closeAllOverlays,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [installed, showSplash, jobs.length, zoomIn, zoomOut, resetZoom, openActivation, closeAllOverlays]
  );

  useKeyboardShortcuts(shortcuts);


  // Calculations for StatusBar & Progress
  const totalPages = jobs.reduce((sum, j) => sum + j.pageCount, 0);
  const pagesPerSheet = layout === '2-up' ? 2 : layout === '4-up' ? 4 : layout === 'booklet' ? 4 : 1;
  const singleSideSheets = Math.max(1, Math.ceil(totalPages / pagesPerSheet));
  const totalPhysicalSheets = duplexMode !== 'simplex' ? Math.max(1, Math.ceil(singleSideSheets / 2)) : singleSideSheets;

  // ───────── صفحة تفعيل المطوّر (منفصلة عن البرنامج) ─────────
  if (route.startsWith('/activate')) {
    return (
      <ActivationSite
        onExit={() => {
          window.location.hash = '';
          setRoute('');
        }}
      />
    );
  }

  // ───────── شاشة التثبيت (عند عدم التثبيت بعد) ─────────
  if (!installed) {
    return (
      <InstallerWizard
        onCancel={() => setInstalled(true)}
        onFinish={() => {
          setInstalled(true);
          setShowSplash(true);
        }}
        onLaunchApp={() => {
          setInstalled(true);
          setShowSplash(true);
        }}
      />
    );
  }

  // ───────── شاشة الترحيب عند فتح البرنامج ─────────
  if (showSplash) {
    return <SplashWelcome onDone={() => setShowSplash(false)} />;
  }

  // ───────── بوابة الترخيص: عند انتهاء التجربة بدون تفعيل ─────────
  if (isLocked && licenseStatus !== 'activated') {
    return (
      <div className="min-h-screen hdr-grad flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
          <div className="sect-hdr p-5 text-center">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center mb-2 animate-pop-in">
                <span className="text-2xl">⏳</span>
              </div>
              <h1 className="text-white font-black text-lg">انتهت الفترة التجريبية</h1>
              <p className="text-[11px] text-white/70 mt-1">
                انتهت 15 يوماً — فعّل البرنامج للمتابعة مدى الحياة
              </p>
            </div>
          </div>
          <div className="p-5 text-center">
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              شكراً لتجربتك <strong>SMART PRINT</strong>. للحصول على سيريال التفعيل، تواصل مع
              المطوّر وأرسل كود جهازك.
            </p>
            <button
              onClick={() => openActivation('expired')}
              className="btn-pop btn-shine w-full py-3 rounded-xl font-black text-sm text-white btn-primary-grad shadow-lg flex items-center justify-center gap-2"
            >
              إدخال سيريال التفعيل
            </button>
            <button
              onClick={() => setIsContactOpen(true)}
              className="btn-pop w-full mt-2 py-2.5 rounded-xl font-bold text-xs bg-[#25D366] text-white flex items-center justify-center gap-2"
            >
              التواصل عبر واتساب — 01222355769
            </button>
            <p className="mt-4 text-[10px] font-bold text-gray-500">تحياتي م / وائل الجمال</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 text-gray-900 flex flex-col selection:bg-[var(--t-primary)] selection:text-white"
    >
      {/* شريط حالة الترخيص */}
      <TrialBanner onActivate={() => openActivation('manual')} />
      {/* 1. هيدر البرنامج الغامق (جريدانت أزرق وكحلي) */}
      <TitleBar
        printerStatus={selectedPrinter.status}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onMinimize={() => {
          const el = document.documentElement;
          if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        }}
        onMaximize={() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          else document.documentElement.requestFullscreen?.().catch(() => {});
        }}
        onClose={() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          window.close();
        }}
      />

      {/* 2. الأزرار أسفل الهيدر: طباعة / الاسكانر */}
      <NavTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeJobLabel={activeJob?.title}
        activeJobProgress={activeJob ? Math.round(activeJob.progress) : undefined}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenStock={() => setIsStockOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSignature={() => setIsSignatureOpen(true)}
        onOpenPdfTools={() => setIsPdfToolsOpen(true)}
        onOpenCompressor={() => setIsCompressorOpen(true)}
        onOpenDiff={() => setIsDiffOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenLicense={() => openActivation('manual')}
      />

      {/* 3. Main Content Viewport */}
      <main
        className="flex-1 py-2 px-2 sm:py-3 sm:px-4 w-full mx-auto overflow-y-auto origin-top"
        style={{ zoom: uiScale } as React.CSSProperties}
      >
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
            onStartPrint={handleEnqueuePrint}
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
            onOpenSignature={() => setIsSignatureOpen(true)}
          />
        )}
      </main>

      {/* 4. فوتر غامق */}
      <FooterBar
        watermarkLabel={watermark.enabled ? watermark.text : undefined}
        printer={selectedPrinter}
        tray={selectedTray}
        totalJobs={jobs.length}
        totalPages={totalPages}
        onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
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

      {/* 6. صفحة إعدادات البرنامج (خطوط / ثيمات / علامة مائية / معلومات / دعم) */}
      <SettingsPage isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* 7. طابور الطباعة */}
      <PrintQueue isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* 8. المخزون والأحبار */}
      <StockPanel isOpen={isStockOpen} onClose={() => setIsStockOpen(false)} />

      {/* 9. التوقيع الإلكتروني */}
      <SignaturePad isOpen={isSignatureOpen} onClose={() => setIsSignatureOpen(false)} />

      {/* 10. لوحة الاختصارات */}
      <ShortcutsPanel isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* 11. أدوات PDF — دمج/تقسيم/ترتيب */}
      <PdfToolsModal isOpen={isPdfToolsOpen} onClose={() => setIsPdfToolsOpen(false)} />

      {/* 12. ضغط الصور لتوفير الحبر */}
      <ImageCompressorModal isOpen={isCompressorOpen} onClose={() => setIsCompressorOpen(false)} />

      {/* 13. مقارنة A/B للمستندات */}
      <DocumentDiffModal isOpen={isDiffOpen} onClose={() => setIsDiffOpen(false)} />

      {/* 14. التفعيل + رسالة النجاح العائمة */}
      <ActivationModal
        isOpen={isActivationOpen}
        onClose={() => setIsActivationOpen(false)}
        onActivated={() => setShowActivated(true)}
        reason={activationReason}
      />
      <ActivationSuccessToast show={showActivated} onClose={() => setShowActivated(false)} />

      {/* 15. التواصل مع المطوّر */}
      <ContactPage
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        onOpenActivation={() => openActivation('manual')}
      />


    </div>
  );
}

export default App;
