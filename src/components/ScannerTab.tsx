import React, { useState, useRef } from 'react';
import {
  ScanLine,
  FileCheck,
  FileDown,
  Image as ImageIcon,
  Copy,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Camera,
  Layers,
  Settings2,
  ScanText,
  PenTool
} from 'lucide-react';
import { SectionHeader, HeaderBadge } from './SectionHeader';
import { OcrModal } from './OcrModal';
import { ScannerDevice, ScannedPage, PrinterInfo, PaperTray } from '../types';

interface ScannerTabProps {
  scanners: ScannerDevice[];
  selectedScanner: ScannerDevice;
  onSelectScanner: (scanner: ScannerDevice) => void;
  printer: PrinterInfo;
  tray: PaperTray;
  onInstantCopyPrint: (copies: number, scannedImage: string) => void;
  onOpenOcr?: () => void;
  onOpenSignature: () => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  scanners,
  selectedScanner,
  onSelectScanner,
  printer,
  tray,
  onInstantCopyPrint,
  onOpenOcr,
  onOpenSignature,
}) => {
  // Scanner settings state
  const [source, setSource] = useState<'flatbed' | 'adf_simplex' | 'adf_duplex'>('flatbed');
  const [dpi, setDpi] = useState<number>(300);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'bw'>('color');
  const [copyCopies, setCopyCopies] = useState<number>(1);
  const [selectedDocTemplate, setSelectedDocTemplate] = useState<string>('contract');

  // Scanning animation & status state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanActionTitle, setScanActionTitle] = useState<string>('');
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([
    {
      id: 'page-1',
      pageNumber: 1,
      imageUrl: '/contract_page1.png',
      timestamp: '11:42 ص',
      dpi: 300,
      rotation: 0,
    },
  ]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);

  // Camera integration
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activePage = scannedPages[activePageIndex] || scannedPages[0];

  // Document templates for realistic scanning preview
  const docTemplates = [
    { id: 'contract', name: 'عقد اتفاق وخدمات رسمي', type: 'نصوص وختم' },
    { id: 'idcard', name: 'بطاقة هوية وطنية / رخصة', type: 'بطاقة ملونة' },
    { id: 'invoice', name: 'فاتورة ضريبية رسمية', type: 'جدول وأرقام' },
    { id: 'blueprint', name: 'مخطط معماري هندسي', type: 'خطوط تفصيلية' },
  ];

  // Trigger scanning sequence
  const startScanningProcess = (action: 'preview' | 'pdf' | 'jpg' | 'copy', callback?: () => void) => {
    setIsScanning(true);
    const titles = {
      preview: 'جاري عمل معاينة سريعة عبر بروتوكول WIA 2.0...',
      pdf: 'جاري سحب الورقة وحفظها في ملف PDF عالي الجودة...',
      jpg: 'جاري التقاط وحفظ الصورة بصيغة JPG بدقة ' + dpi + ' DPI...',
      copy: 'جاري سحب الورقة ونقلها فوراً لطابعة HP PageWide للتصوير الفوري...',
    };
    setScanActionTitle(titles[action]);

    // Simulate WIA scan time (1.8s)
    setTimeout(() => {
      setIsScanning(false);

      if (action !== 'preview') {
        const newPage: ScannedPage = {
          id: `page-${Date.now()}`,
          pageNumber: scannedPages.length + 1,
          imageUrl: `/scanned_${selectedDocTemplate}.png`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          dpi,
          rotation: 0,
        };
        setScannedPages((prev) => [...prev, newPage]);
        setActivePageIndex(scannedPages.length);
      }

      if (callback) callback();
    }, 1800);
  };

  // 1. Quick Preview
  const handleQuickPreview = () => {
    startScanningProcess('preview', () => {
      // preview updated
    });
  };

  // 2. Scan to Multi-page PDF
  const handleScanToPdf = () => {
    startScanningProcess('pdf', () => {
      // Trigger download
      const dummyContent = 'PDF Document Data';
      const blob = new Blob([dummyContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WIA_Scan_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // 3. Scan to JPG
  const handleScanToJpg = () => {
    startScanningProcess('jpg', () => {
      // Trigger dummy image download
      const a = document.createElement('a');
      a.href = '#';
      a.download = `WIA_Scan_Photo_${Date.now()}.jpg`;
      // dummy trigger
    });
  };

  // 4. Instant Copy (التصوير الفوري المطلوب)
  const handleInstantCopy = () => {
    startScanningProcess('copy', () => {
      onInstantCopyPrint(copyCopies, activePage?.imageUrl || 'scan.png');
    });
  };

  const handleRotateCurrentPage = () => {
    if (!activePage) return;
    setScannedPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDeleteCurrentPage = () => {
    if (scannedPages.length <= 1) return;
    setScannedPages((prev) => prev.filter((_, idx) => idx !== activePageIndex));
    setActivePageIndex((prev) => Math.max(0, prev - 1));
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch {
        alert('تعذر تشغيل كاميرا الويب. يمكنك الاستمرار في استخدام المستندات الافتراضية.');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full p-1 select-none">
      {/* ================= COLUMN 1: WIA Scanner Controls & Buttons (4 cols) ================= */}
      <div className="xl:col-span-4 flex flex-col gap-3">
        {/* WIA Protocol Connection Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <SectionHeader
            icon={<ScanLine className="w-4 h-4" />}
            title="الاتصال ببروتوكول الويندوز (WIA)"
            subtitle="Windows Image Acquisition 2.0"
            badge={
              <span className="text-[10px] font-bold text-emerald-100 bg-emerald-400/20 ring-1 ring-emerald-300/40 px-2 py-0.5 rounded-full">
                متصل وجاهز
              </span>
            }
          />

          <div className="p-4 space-y-3">
            {/* Scanner Device Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">جهاز الاسكانر المتصل:</label>
              <select
                value={selectedScanner.id}
                onChange={(e) => {
                  const s = scanners.find((item) => item.id === e.target.value);
                  if (s) onSelectScanner(s);
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
              >
                {scanners.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.protocol})
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Source (Flatbed vs ADF) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">مصدر التغذية الورقية:</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'flatbed' | 'adf_simplex' | 'adf_duplex')}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
              >
                <option value="flatbed">السطح الزجاجي (Flatbed Glass Bed)</option>
                <option value="adf_simplex">وحدة التغذية التلقائية وجه واحد (ADF Simplex)</option>
                <option value="adf_duplex">وحدة التغذية التلقائية وجهين (ADF Duplex)</option>
              </select>
            </div>

            {/* DPI & Color Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">دقة المسح (DPI):</label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                >
                  <option value={150}>150 DPI (مسودة سريعة)</option>
                  <option value={300}>300 DPI (مستندات قياسية)</option>
                  <option value={600}>600 DPI (صور عالية الدقة)</option>
                  <option value={1200}>1200 DPI (دقة أرشيفية فائقة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نمط الألوان:</label>
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value as 'color' | 'grayscale' | 'bw')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                >
                  <option value="color">ملون (24-bit Color)</option>
                  <option value="grayscale">رمادي (8-bit Gray)</option>
                  <option value="bw">أبيض وأسود نصوص (1-bit)</option>
                </select>
              </div>
            </div>

            {/* Document Template Simulator / Camera Option */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">نوع المستند على السطح الزجاجي:</label>
                <button
                  onClick={toggleCamera}
                  className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                    isCameraActive
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="استخدام كاميرا الجهاز لمسح مستند حي"
                >
                  <Camera className="w-3 h-3" />
                  <span>{isCameraActive ? 'إيقاف الكاميرا' : 'مسح عبر الكاميرا'}</span>
                </button>
              </div>

              {!isCameraActive && (
                <div className="grid grid-cols-2 gap-1.5">
                  {docTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedDocTemplate(tmpl.id)}
                      className={`btn-pop p-2 rounded-xl text-right text-xs border ${
                        selectedDocTemplate === tmpl.id
                          ? 'bg-primary-soft text-[var(--t-primary-ink)] border-[var(--t-primary)] font-bold'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <div className="truncate">{tmpl.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{tmpl.type}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Scanner & Instant Copy Action Buttons */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <SectionHeader
            icon={<Settings2 className="w-4 h-4" />}
            title="أوامر الاسكانر والتصوير"
            subtitle="مسح · حفظ · تصوير فوري"
            badge={<HeaderBadge>WIA 2.0</HeaderBadge>}
          />
          <div className="p-4 space-y-2.5">

          {/* 1. Quick Preview */}
          <button
            onClick={handleQuickPreview}
            disabled={isScanning}
            className="btn-pop w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-blue-600" />
              <span>معاينة سريعة (Quick Preview)</span>
            </div>
            <span className="text-[10px] text-gray-400">150 DPI مسودة</span>
          </button>

          {/* 2. Scan to Multi-page PDF */}
          <button
            onClick={handleScanToPdf}
            disabled={isScanning}
            className="btn-pop w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary-soft hover:bg-[var(--t-primary-soft-2)] text-[var(--t-primary-ink)] border border-[var(--t-primary-border)] flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-[var(--t-primary)]" />
              <span>سحب وحفظ كـ PDF متعدد الصفحات</span>
            </div>
            <span className="text-[10px] text-[var(--t-primary)] font-mono">Multi-Page PDF</span>
          </button>

          {/* 3. Scan to JPG */}
          <button
            onClick={handleScanToJpg}
            disabled={isScanning}
            className="btn-pop w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>سحب وحفظ كصورة (JPG / PNG)</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Hi-Res Image</span>
          </button>

          {/* 5+6. OCR + التوقيع الإلكتروني */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsOcrOpen(true);
                onOpenOcr?.();
              }}
              disabled={isScanning}
              className="btn-pop flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-primary-soft hover:bg-[var(--t-primary-soft-2)] text-[var(--t-primary-ink)] border border-[var(--t-primary-border)]"
              title="التعرف الضوئي على الحروف العربية"
            >
              <ScanText className="w-4 h-4" />
              نص من الصورة (OCR)
            </button>
            <button
              onClick={onOpenSignature}
              disabled={isScanning}
              className="btn-pop flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300"
              title="رسم وإرفاق توقيع إلكتروني"
            >
              <PenTool className="w-4 h-4" />
              توقيع إلكتروني
            </button>
          </div>

          {/* 4. Highlighted Instant Copy Button (آلة التصوير الفوري بضغطة واحدة) */}
          <div className="p-3 bg-primary-soft border border-[var(--t-primary-border)] rounded-xl mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-[var(--t-primary-ink)]" />
                <span className="text-xs font-black text-[var(--t-primary-ink)]">آلة التصوير الفوري (Instant Copy)</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--t-primary-ink)] bg-white px-2 py-0.5 rounded shadow-2xs">
                سحب وطباعة فورية
              </span>
            </div>
            <p className="text-[11px] text-[var(--t-primary-ink)]/90 mb-2 leading-tight">
              يسحب الورقة من الاسكانر ويرسلها مباشرة لطابعة {printer.name.split('(')[0]} بعدد النسخ المحدد.
            </p>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-700">عدد النسخ:</span>
              <input
                type="number"
                min="1"
                max="99"
                value={copyCopies}
                onChange={(e) => setCopyCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-center"
              />
              <span className="text-[11px] text-gray-500">نسخة على درج {tray.name.split('(')[0]}</span>
            </div>

            <button
              onClick={handleInstantCopy}
              disabled={isScanning}
              className="btn-pop btn-shine w-full py-3 px-4 rounded-xl font-black text-xs text-white btn-primary-grad shadow-md shadow-black/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 anim-gradient"
            >
              <Copy className="w-4 h-4" />
              <span>تصوير فوري الآن (Instant Copy)</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* ================= COLUMN 2: Scanner Glass Bed & Scanned Pages Manager (8 cols) ================= */}
      <div className="xl:col-span-8 flex flex-col gap-3">
        {/* Top Scanner Status & Viewport Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs flex-1 flex flex-col overflow-hidden">
          <SectionHeader
            icon={<Camera className="w-4 h-4" />}
            title="شاشة معاينة الاسكانر والمسح الضوئي"
            subtitle="WIA Viewport — دقة عالية"
            badge={<HeaderBadge tone="success">{scannedPages.length} صفحة جاهزة</HeaderBadge>}
          >
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setPreviewZoom((z) => Math.min(1.8, z + 0.15))}
                className="btn-pop p-1.5 rounded-lg text-white/85 hover:bg-white/20"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewZoom((z) => Math.max(0.6, z - 0.15))}
                className="btn-pop p-1.5 rounded-lg text-white/85 hover:bg-white/20"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotateCurrentPage}
                className="btn-pop flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-white/85 hover:bg-white/20"
                title="تدوير الصفحة المحددة"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>تدوير</span>
              </button>
              <button
                onClick={handleDeleteCurrentPage}
                disabled={scannedPages.length <= 1}
                className="btn-pop p-1.5 hover:bg-red-500 text-white/85 rounded-lg disabled:opacity-30"
                title="حذف الصفحة الحالية"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </SectionHeader>

          <div className="p-4 flex-1 flex flex-col min-h-0">
          {/* Scanner Glass Bed Viewport with Laser Beam Scan Effect */}
          <div className="flex-1 bg-slate-900 rounded-xl p-6 flex items-center justify-center overflow-hidden min-h-[380px] relative mb-3">
            {/* Moving Laser Scanner Light Bar when scanning */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] z-20 animate-scanline" />
            )}

            {/* Live Camera View or Rendered Document */}
            {isCameraActive ? (
              <div className="relative rounded-lg overflow-hidden border-2 border-cyan-400 shadow-2xl max-w-md w-full aspect-4/3 bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 text-[10px] rounded font-mono">
                  بث الكاميرا المباشر
                </div>
              </div>
            ) : (
              <div
                className={`transition-all duration-300 transform origin-center ${
                  colorMode === 'grayscale'
                    ? 'grayscale'
                    : colorMode === 'bw'
                    ? 'contrast-200 grayscale'
                    : ''
                }`}
                style={{
                  transform: `scale(${previewZoom}) rotate(${activePage?.rotation || 0}deg)`,
                }}
              >
                {/* Simulated High-Res Scanned Document Paper */}
                <div className="w-[280px] h-[390px] sm:w-[320px] sm:h-[440px] bg-white rounded shadow-2xl border border-gray-300 p-6 flex flex-col justify-between text-gray-800 relative select-none">
                  {/* Document Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b-2 border-gray-800">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--t-primary-ink)] tracking-wider uppercase block">
                          وثيقة رسمية ممسوحة ضوئياً
                        </span>
                        <h4 className="text-sm font-black text-gray-900">
                          {selectedDocTemplate === 'contract'
                            ? 'عقد خدمات واستشارات هندسية'
                            : selectedDocTemplate === 'idcard'
                            ? 'بطاقة إثبات شخصية موحدة'
                            : selectedDocTemplate === 'invoice'
                            ? 'فاتورة مبيعات ضريبية'
                            : 'مخطط إنشائي معماري معتمد'}
                        </h4>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-900">
                        ختم
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-[9px] text-gray-500 my-2 font-mono">
                      <span>رقم المستند: DOC-2026-{activePageIndex + 104}</span>
                      <span>الدقة: {dpi} DPI (WIA 2.0)</span>
                    </div>

                    {/* Document Lines */}
                    <div className="space-y-2.5 mt-4">
                      <div className="h-2.5 bg-gray-200 rounded w-full" />
                      <div className="h-2.5 bg-gray-200 rounded w-11/12" />
                      <div className="h-2.5 bg-gray-200 rounded w-4/5" />
                      <div className="h-2.5 bg-gray-200 rounded w-5/6" />
                      <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-200 rounded w-full" />
                      <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-200 rounded w-4/5" />
                    </div>

                    {/* Stamp / Signature box */}
                    <div className="mt-8 flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-[9px] text-gray-600">
                      <div>
                        <span className="block font-bold">توقيع المسؤول:</span>
                        <span className="font-serif italic text-blue-900">مهندس/ أحمد مصطفى</span>
                      </div>
                      <div className="text-left font-mono">
                        <span>تاريخ المسح:</span>
                        <div className="text-gray-900 font-bold">{activePage?.timestamp}</div>
                      </div>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[8px] text-gray-400 font-mono">
                    <span>HP PageWide Flow MFP 586 Scanner</span>
                    <span>صفحة {activePageIndex + 1} من {scannedPages.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scanning Overlay message */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-30 p-4 text-center">
                <ScanLine className="w-10 h-10 text-cyan-400 animate-pulse mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">{scanActionTitle}</h4>
                <p className="text-xs text-cyan-200">بروتوكول WIA 2.0 ينقل مصفوفة البيانات بدقة {dpi} DPI...</p>
              </div>
            )}
          </div>

          {/* Multi-page Scanned Pages Carousel (ADF Pages Manager) */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>صفحات وحدة التغذية (ADF Trays):</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {scannedPages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`btn-pop px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                    activePageIndex === idx
                      ? 'btn-primary-grad text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>صفحة {page.pageNumber}</span>
                  <span className="text-[10px] opacity-75">({page.timestamp})</span>
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500 font-semibold hidden md:block">
              إجمالي {scannedPages.length} صفحات ممسوحة
            </div>
          </div>
        </div>
        </div>
    </div>

      {/* نافذة OCR بصفحات الاسكانر الحقيقية */}
      <OcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        pages={scannedPages}
        defaultTemplate={selectedDocTemplate}
      />
    </div>
  );
};
