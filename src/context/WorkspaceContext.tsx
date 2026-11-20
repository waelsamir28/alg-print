import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { INSTALLED_PRINTERS } from '../data/printersData';

/* =====================================================================
   1) العلامة المائية والترويسة التلقائية
   ===================================================================== */
export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  showLogo: boolean;
  showPageNumber: boolean;
  position: 'center' | 'bottom' | 'diagonal';
  opacity: number;
  fontSize: number;
}

export const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: true,
  text: 'م/ وائل الجمال',
  showLogo: true,
  showPageNumber: true,
  position: 'diagonal',
  opacity: 0.16,
  fontSize: 15,
};

/* =====================================================================
   2) إدارة المخزون (أوراق + أحبار)
   ===================================================================== */
export type StockKind = 'paper' | 'ink';
export type StockUnit = 'رزمة' | '%';

export interface StockItem {
  id: string;
  kind: StockKind;
  name: string;
  unit: StockUnit;
  stock: number;
  capacity: number;
  /** حد التنبيه: أقل من أو يساوي */
  threshold: number;
  colorHex?: string;
  trayId?: string;
  note?: string;
}

const INITIAL_STOCK: StockItem[] = [
  {
    id: 'paper-a4',
    kind: 'paper',
    name: 'ورق A4 (80 جم)',
    unit: 'رزمة',
    stock: 12,
    capacity: 40,
    threshold: 4,
    trayId: 'tray-2',
    note: 'الدرج 2 الافتراضي — 500 ورقة/رزمة',
  },
  {
    id: 'paper-a3',
    kind: 'paper',
    name: 'ورق A3 (PageWide Wide)',
    unit: 'رزمة',
    stock: 3,
    capacity: 20,
    threshold: 5,
    trayId: 'tray-3',
    note: 'الدرج 3 — للطباعة العريضة والمخططات',
  },
  {
    id: 'paper-photo',
    kind: 'paper',
    name: 'ورق صور لامع 180 جم',
    unit: 'رزمة',
    stock: 6,
    capacity: 15,
    threshold: 2,
    trayId: 'tray-1',
    note: 'الدرج 1 متعدد الأغراض',
  },
  {
    id: 'ink-k',
    kind: 'ink',
    name: 'خرطوشة HP 981X أسود (K)',
    unit: '%',
    stock: 84,
    capacity: 100,
    threshold: 20,
    colorHex: '#111827',
  },
  {
    id: 'ink-c',
    kind: 'ink',
    name: 'خرطوشة HP 981X سماوي (C)',
    unit: '%',
    stock: 72,
    capacity: 100,
    threshold: 20,
    colorHex: '#0ea5e9',
  },
  {
    id: 'ink-m',
    kind: 'ink',
    name: 'خرطوشة HP 981X أرجواني (M)',
    unit: '%',
    stock: 61,
    capacity: 100,
    threshold: 20,
    colorHex: '#f43f5e',
  },
  {
    id: 'ink-y',
    kind: 'ink',
    name: 'خرطوشة HP 981X أصفر (Y)',
    unit: '%',
    stock: 14,
    capacity: 100,
    threshold: 20,
    colorHex: '#facc15',
  },
];

/* =====================================================================
   3) طابور الطباعة (Spooler)
   ===================================================================== */
export type QueueStatus = 'queued' | 'printing' | 'paused' | 'done' | 'cancelled';

export interface QueueJob {
  id: string;
  title: string;
  files: number;
  sheets: number;
  copies: number;
  printerName: string;
  trayName: string;
  isColor: boolean;
  duplex: boolean;
  status: QueueStatus;
  progress: number;
  submittedAt: number;
  owner: string;
}

let jobSeq = 1;

/* =====================================================================
   4) التوقيع الإلكتروني
   ===================================================================== */
export interface SignatureData {
  dataUrl: string;
  name: string;
  createdAt: number;
}

interface WorkspaceValue {
  /* العلامة المائية */
  watermark: WatermarkSettings;
  setWatermark: (patch: Partial<WatermarkSettings>) => void;
  resetWatermark: () => void;

  /* المخزون */
  stock: StockItem[];
  adjustStock: (id: string, delta: number) => void;
  restockItem: (id: string) => void;
  consumePaper: (sheets: number) => void;
  lowStock: StockItem[];

  /* طابور الطباعة */
  queue: QueueJob[];
  activeJob: QueueJob | undefined;
  enqueueJob: (job: Omit<QueueJob, 'id' | 'status' | 'progress' | 'submittedAt' | 'owner'>) => void;
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  cancelJob: (id: string) => void;
  removeJob: (id: string) => void;
  clearFinished: () => void;
  moveJob: (id: string, direction: -1 | 1) => void;

  /* التوقيع */
  signature: SignatureData | null;
  setSignature: (sig: SignatureData | null) => void;

  /* أدوات */
  exportWorkspace: () => string;
  importWorkspace: (json: string) => boolean;
}

const STORAGE_KEY = 'smartprint.workspace.v1';
const WorkspaceContext = createContext<WorkspaceValue | null>(null);

interface Persisted {
  watermark: WatermarkSettings;
  stock: StockItem[];
  signature: SignatureData | null;
  queue: QueueJob[];
}

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Persisted>;
  } catch {
    return {};
  }
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(loadPersisted, []);

  const [watermark, setWatermarkState] = useState<WatermarkSettings>({
    ...DEFAULT_WATERMARK,
    ...(persisted.watermark ?? {}),
  });
  const [stock, setStock] = useState<StockItem[]>(persisted.stock?.length ? persisted.stock : INITIAL_STOCK);
  const [signature, setSignatureState] = useState<SignatureData | null>(persisted.signature ?? null);
  const [queue, setQueue] = useState<QueueJob[]>(persisted.queue ?? []);

  /* ---------- الحفظ التلقائي ---------- */
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ watermark, stock, signature, queue: queue.filter((j) => j.status !== 'done') })
        );
      } catch {
        /* ignore */
      }
    }, 250);
    return () => window.clearTimeout(saveTimer.current);
  }, [watermark, stock, signature, queue]);

  /* ---------- العلامة المائية ---------- */
  const setWatermark = useCallback((patch: Partial<WatermarkSettings>) => {
    setWatermarkState((prev) => ({ ...prev, ...patch }));
  }, []);
  const resetWatermark = useCallback(() => setWatermarkState(DEFAULT_WATERMARK), []);

  /* ---------- المخزون ---------- */
  const adjustStock = useCallback((id: string, delta: number) => {
    setStock((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, stock: Math.max(0, Math.min(item.capacity, item.stock + delta)) }
          : item
      )
    );
  }, []);

  const restockItem = useCallback((id: string) => {
    setStock((prev) => prev.map((item) => (item.id === id ? { ...item, stock: item.capacity } : item)));
  }, []);

  /** خصم الأوراق فعلياً من مخزون A4 عند إتمام طباعة */
  const consumePaper = useCallback((sheets: number) => {
    const reams = Math.ceil(sheets / 500);
    setStock((prev) =>
      prev.map((item) =>
        item.id === 'paper-a4'
          ? { ...item, stock: Math.max(0, item.stock - reams) }
          : item
      )
    );
  }, []);

  const lowStock = useMemo(
    () =>
      stock.filter((item) =>
        item.kind === 'ink' ? item.stock <= item.threshold : item.stock <= item.threshold
      ),
    [stock]
  );

  /* ---------- التوقيع ---------- */
  const setSignature = useCallback((sig: SignatureData | null) => setSignatureState(sig), []);

  /* ---------- طابور الطباعة ---------- */
  const enqueueJob = useCallback<WorkspaceValue['enqueueJob']>((job) => {
    setQueue((prev) => {
      const hasActive = prev.some((j) => j.status === 'printing');
      const newJob: QueueJob = {
        ...job,
        id: `spool-${Date.now()}-${jobSeq++}`,
        status: hasActive ? 'queued' : 'printing',
        progress: 0,
        submittedAt: Date.now(),
        owner: 'wael',
      };
      return [...prev, newJob];
    });
  }, []);

  const pauseJob = useCallback((id: string) => {
    setQueue((prev) => prev.map((j) => (j.id === id && j.status === 'printing' ? { ...j, status: 'paused' } : j)));
  }, []);

  const resumeJob = useCallback((id: string) => {
    setQueue((prev) => {
      const printingExists = prev.some((j) => j.status === 'printing');
      if (printingExists) return prev;
      return prev.map((j) => (j.id === id && j.status === 'paused' ? { ...j, status: 'printing' } : j));
    });
  }, []);

  const cancelJob = useCallback((id: string) => {
    setQueue((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'cancelled' } : j)));
  }, []);

  const removeJob = useCallback((id: string) => {
    setQueue((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setQueue((prev) => prev.filter((j) => j.status !== 'done' && j.status !== 'cancelled'));
  }, []);

  const moveJob = useCallback((id: string, direction: -1 | 1) => {
    setQueue((prev) => {
      const idx = prev.findIndex((j) => j.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  /* محاكاة محرك الطباعة: يقدّم المهمة الجارية ويُطلق التالية */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setQueue((prev) => {
        if (prev.length === 0) return prev;
        const printing = prev.find((j) => j.status === 'printing');
        if (!printing) {
          const nextQueued = prev.find((j) => j.status === 'queued');
          if (nextQueued) {
            return prev.map((j) => (j.id === nextQueued.id ? { ...j, status: 'printing' } : j));
          }
          return prev;
        }
        const step = 100 / Math.max(28, printing.sheets * 1.4);
        const nextProgress = Math.min(100, printing.progress + step);
        return prev.map((j) => {
          if (j.id !== printing.id) return j;
          return nextProgress >= 100
            ? { ...j, progress: 100, status: 'done' as QueueStatus }
            : { ...j, progress: nextProgress };
        });
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, []);

  /** عند اكتمال مهمة، خصم الورق من المخزون مرة واحدة */
  const consumedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    queue
      .filter((j) => j.status === 'done' && !consumedRef.current.has(j.id))
      .forEach((j) => {
        consumedRef.current.add(j.id);
        consumePaper(j.sheets * Math.max(1, j.copies));
      });
  }, [queue, consumePaper]);

  const activeJob = queue.find((j) => j.status === 'printing');

  /* ---------- تصدير/استيراد مساحة العمل ---------- */
  const exportWorkspace = useCallback(
    () =>
      JSON.stringify(
        {
          app: 'SMART PRINT',
          version: 1,
          exportedAt: new Date().toISOString(),
          watermark,
          stock,
          signature,
        },
        null,
        2
      ),
    [watermark, stock, signature]
  );

  const importWorkspace = useCallback((json: string) => {
    try {
      const data = JSON.parse(json) as Partial<Persisted>;
      if (data.watermark) setWatermarkState({ ...DEFAULT_WATERMARK, ...data.watermark });
      if (Array.isArray(data.stock) && data.stock.length) setStock(data.stock);
      if (data.signature !== undefined) setSignatureState(data.signature);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value: WorkspaceValue = {
    watermark,
    setWatermark,
    resetWatermark,
    stock,
    adjustStock,
    restockItem,
    consumePaper,
    lowStock,
    queue,
    activeJob,
    enqueueJob,
    pauseJob,
    resumeJob,
    cancelJob,
    removeJob,
    clearFinished,
    moveJob,
    signature,
    setSignature,
    exportWorkspace,
    importWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}

export const PRINTER_LABEL = INSTALLED_PRINTERS[0].name.split('(')[0].trim();
