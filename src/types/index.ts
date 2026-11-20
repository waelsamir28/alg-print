export type DocumentType = 'pdf' | 'docx' | 'image';

export interface PrintJobItem {
  id: string;
  name: string;
  type: DocumentType;
  size: string;
  pageCount: number;
  status: 'جاهز' | 'قيد المعالجة' | 'تمت الطباعة' | 'خطأ';
  previewUrl?: string;
  customPages?: string[];
  fileData?: File;
}

export type ColorMode = 'color' | 'grayscale';
export type DuplexMode = 'simplex' | 'duplex_long' | 'duplex_short';
export type ImpositionLayout = '1-up' | '2-up' | '4-up' | 'booklet';
export type PageRangeOption = 'all' | 'custom' | 'odd' | 'even';

export interface PaperTray {
  id: string;
  name: string;
  type: string;
  capacity: string;
  currentLevelPercent: number;
  currentSize: string;
}

export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

export interface PrinterInfo {
  id: string;
  name: string;
  model: string;
  ipAddress: string;
  status: 'متصل وجاهز' | 'طباعة نشطة' | 'غير متصل' | 'تحذير حبر';
  isPageWide: boolean;
  maxSpeedPpm: number;
  paperTrays: PaperTray[];
  supportedSizes: PaperSize[];
  inkLevels: {
    black: number;
    cyan: number;
    magenta: number;
    yellow: number;
  };
  printheadHealth: number; // HP PageWide printbar condition %
}

export interface ScannerDevice {
  id: string;
  name: string;
  protocol: 'WIA 2.0' | 'TWAIN' | 'eSCL';
  hasAdf: boolean;
  hasDuplexAdf: boolean;
  hasFlatbed: boolean;
  supportedDpi: number[];
  status: 'جاهز' | 'مشغول' | 'غير متصل';
}

export interface ScanSettings {
  scannerId: string;
  source: 'flatbed' | 'adf_simplex' | 'adf_duplex';
  dpi: number;
  colorMode: 'color' | 'grayscale' | 'bw';
  pageSize: string;
  brightness: number;
  contrast: number;
  autoDeskew: boolean;
  blankPageRemoval: boolean;
}

export interface ScannedPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  timestamp: string;
  dpi: number;
  rotation: number;
}

export interface QuickPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colorMode: ColorMode;
  duplexMode: DuplexMode;
  layout: ImpositionLayout;
  trayId: string;
  copies: number;
  badge?: string;
}
