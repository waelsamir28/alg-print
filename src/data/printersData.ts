import { PrinterInfo, ScannerDevice, QuickPreset, PaperSize } from '../types';

export const SUPPORTED_PAPER_SIZES: PaperSize[] = [
  { id: 'A4', name: 'A4 (210 × 297 مم)', widthMm: 210, heightMm: 297 },
  { id: 'A3', name: 'A3 (297 × 420 مم) - PageWide Wide', widthMm: 297, heightMm: 420 },
  { id: 'Letter', name: 'Letter (216 × 279 مم)', widthMm: 216, heightMm: 279 },
  { id: 'Legal', name: 'Legal (216 × 356 مم)', widthMm: 216, heightMm: 356 },
  { id: 'A5', name: 'A5 (148 × 210 مم)', widthMm: 148, heightMm: 210 },
  { id: 'B5', name: 'B5 (JIS) (182 × 257 مم)', widthMm: 182, heightMm: 257 },
];

export const INSTALLED_PRINTERS: PrinterInfo[] = [
  {
    id: 'hp-pagewide-586',
    name: 'HP PageWide Enterprise Color MFP 586 (PCL6)',
    model: 'HP PageWide Enterprise Color MFP 586dn/f',
    ipAddress: '192.168.1.120',
    status: 'متصل وجاهز',
    isPageWide: true,
    maxSpeedPpm: 75,
    paperTrays: [
      { id: 'tray-1', name: 'درج 1 (متعدد الأغراض Multi-purpose)', type: 'أظرف وبطاقات وورق خاص', capacity: '100 ورقة', currentLevelPercent: 65, currentSize: 'A4' },
      { id: 'tray-2', name: 'درج 2 (الافتراضي السفلي Cassette)', type: 'ورق عادي 80g', capacity: '500 ورقة', currentLevelPercent: 88, currentSize: 'A4' },
      { id: 'tray-3', name: 'درج 3 (سعة عالية أوراق A4/A3)', type: 'ورق عادي ومصقول', capacity: '500 ورقة', currentLevelPercent: 42, currentSize: 'A3' },
      { id: 'tray-bypass', name: 'درج التغذية اليدوية (Manual Feed)', type: 'تغذية فردية سريعة', capacity: '50 ورقة', currentLevelPercent: 100, currentSize: 'A4' },
    ],
    supportedSizes: SUPPORTED_PAPER_SIZES,
    inkLevels: {
      black: 84, // HP 981X Black
      cyan: 72,  // HP 981X Cyan
      magenta: 68, // HP 981X Magenta
      yellow: 79  // HP 981X Yellow
    },
    printheadHealth: 99 // HP PageWide stationary bar 42,240 nozzles
  },
  {
    id: 'hp-pagewide-477',
    name: 'HP PageWide Pro 477dw Multifunction Printer',
    model: 'HP PageWide Pro 477dw PCL 6',
    ipAddress: '192.168.1.125',
    status: 'متصل وجاهز',
    isPageWide: true,
    maxSpeedPpm: 55,
    paperTrays: [
      { id: 'tray-1-477', name: 'درج 1 (تغذية متعددة 50 ورقة)', type: 'ورق عادي وبطاقات', capacity: '50 ورقة', currentLevelPercent: 90, currentSize: 'A4' },
      { id: 'tray-2-477', name: 'درج 2 (الدرج الرئيسي 500 ورقة)', type: 'ورق A4/Letter', capacity: '500 ورقة', currentLevelPercent: 55, currentSize: 'A4' },
    ],
    supportedSizes: SUPPORTED_PAPER_SIZES.filter(s => s.id !== 'A3'),
    inkLevels: {
      black: 91,
      cyan: 83,
      magenta: 78,
      yellow: 85
    },
    printheadHealth: 98
  },
  {
    id: 'hp-pagewide-774',
    name: 'HP PageWide Color MFP 774dn (A3 Wide Format)',
    model: 'HP PageWide Color MFP 774dn High Volume',
    ipAddress: '192.168.1.130',
    status: 'متصل وجاهز',
    isPageWide: true,
    maxSpeedPpm: 70,
    paperTrays: [
      { id: 'tray-1-774', name: 'درج 1 (A3/A4 أظرف ومقاسات خاصة)', type: 'متعدد الأغراض', capacity: '100 ورقة', currentLevelPercent: 80, currentSize: 'A3' },
      { id: 'tray-2-774', name: 'درج 2 (A4 رئيسي 550 ورقة)', type: 'ورق عادي', capacity: '550 ورقة', currentLevelPercent: 70, currentSize: 'A4' },
      { id: 'tray-3-774', name: 'درج 3 (A3 سعة عالية 550 ورقة)', type: 'ورق A3 ثقيل', capacity: '550 ورقة', currentLevelPercent: 95, currentSize: 'A3' },
    ],
    supportedSizes: SUPPORTED_PAPER_SIZES,
    inkLevels: {
      black: 62,
      cyan: 55,
      magenta: 49,
      yellow: 64
    },
    printheadHealth: 96
  },
  {
    id: 'win-print-pdf',
    name: 'Microsoft Print to PDF (طابعة افتراضية)',
    model: 'Windows Virtual Software Printer',
    ipAddress: 'localhost',
    status: 'متصل وجاهز',
    isPageWide: false,
    maxSpeedPpm: 120,
    paperTrays: [
      { id: 'tray-pdf', name: 'تلقائي (Auto Select Tray)', type: 'ملفات رقمية', capacity: 'غير محدود', currentLevelPercent: 100, currentSize: 'A4' }
    ],
    supportedSizes: SUPPORTED_PAPER_SIZES,
    inkLevels: {
      black: 100,
      cyan: 100,
      magenta: 100,
      yellow: 100
    },
    printheadHealth: 100
  }
];

export const INSTALLED_SCANNERS: ScannerDevice[] = [
  {
    id: 'hp-pagewide-wia-scanner',
    name: 'HP PageWide Flow MFP 586 (WIA Scanner)',
    protocol: 'WIA 2.0',
    hasAdf: true,
    hasDuplexAdf: true,
    hasFlatbed: true,
    supportedDpi: [150, 200, 300, 600, 1200],
    status: 'جاهز'
  },
  {
    id: 'hp-pagewide-477-scanner',
    name: 'HP PageWide Pro 477dw Scanner (WIA 2.0)',
    protocol: 'WIA 2.0',
    hasAdf: true,
    hasDuplexAdf: true,
    hasFlatbed: true,
    supportedDpi: [150, 300, 600],
    status: 'جاهز'
  }
];

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'eco-mode',
    title: 'وضع التوفير الذكي (Eco Mode)',
    subtitle: 'أبيض وأسود + وش وضهر + صفحتين في الورقة',
    icon: 'Leaf',
    colorMode: 'grayscale',
    duplexMode: 'duplex_long',
    layout: '2-up',
    trayId: 'tray-2',
    copies: 1,
    badge: 'توفير 75% من الورق والحبر'
  },
  {
    id: 'booklet-mode',
    title: 'وضع الكتيب (Booklet Mode)',
    subtitle: 'ترتيب كتيب مطوي + وش وضهر دبوس المنتصف',
    icon: 'BookOpen',
    colorMode: 'color',
    duplexMode: 'duplex_short',
    layout: 'booklet',
    trayId: 'tray-2',
    copies: 1,
    badge: 'جاهز للتدبيس والطي'
  },
  {
    id: 'high-quality',
    title: 'جودة فائقة HP PageWide',
    subtitle: 'ألوان زاهية CMYK + صفحة واحدة + دقة 1200 DPI',
    icon: 'Sparkles',
    colorMode: 'color',
    duplexMode: 'simplex',
    layout: '1-up',
    trayId: 'tray-1',
    copies: 1,
    badge: 'أعلى دقة للمطبوعات الرسمية'
  }
];
