import { PDFDocument, degrees } from 'pdf-lib';

export interface PdfFileItem {
  id: string;
  name: string;
  size: number;
  bytes: Uint8Array;
  pageCount: number;
}

export interface PdfPageRef {
  /** مفتاح مركب fileId:pageIndex */
  key: string;
  fileId: string;
  fileName: string;
  pageIndex: number;
  label: string;
  rotation: number;
}

/** قراءة ملف PDF وعدّ صفحاته */
export async function loadPdfFile(file: File): Promise<PdfFileItem> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: file.size,
    bytes,
    pageCount: doc.getPageCount(),
  };
}

/** بناء قائمة كل صفحات الملفات (مفيدة لإعادة الترتيب والحذف) */
export function buildPageList(files: PdfFileItem[]): PdfPageRef[] {
  const out: PdfPageRef[] = [];
  files.forEach((f) => {
    for (let i = 0; i < f.pageCount; i++) {
      out.push({
        key: `${f.id}:${i}`,
        fileId: f.id,
        fileName: f.name,
        pageIndex: i,
        label: `صفحة ${i + 1}`,
        rotation: 0,
      });
    }
  });
  return out;
}

export interface MergeResult {
  bytes: Uint8Array;
  pageCount: number;
}

/** دمج صفحات محددة وبترتيب مخصص في ملف PDF واحد */
export async function mergePages(
  files: PdfFileItem[],
  pages: PdfPageRef[]
): Promise<MergeResult> {
  const out = await PDFDocument.create();

  // كاش مستندات المصدر
  const docs = new Map<string, PDFDocument>();
  for (const f of files) {
    docs.set(f.id, await PDFDocument.load(f.bytes, { ignoreEncryption: true }));
  }

  // تجميع الفهارس حسب الملف لتقليل عمليات النسخ
  for (const ref of pages) {
    const src = docs.get(ref.fileId);
    if (!src) continue;
    const [copied] = await out.copyPages(src, [ref.pageIndex]);
    if (ref.rotation) copied.setRotation(degrees((copied.getRotation().angle + ref.rotation) % 360));
    out.addPage(copied);
  }

  const bytes = await out.save();
  return { bytes, pageCount: out.getPageCount() };
}

/** تقسيم: استخراج صفحات محددة إلى ملف جديد */
export async function extractPages(
  files: PdfFileItem[],
  pages: PdfPageRef[]
): Promise<MergeResult> {
  return mergePages(files, pages);
}

/** تقسيم: كل صفحة في ملف منفصل */
export async function splitEveryPage(
  files: PdfFileItem[],
  pages: PdfPageRef[]
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const results: { name: string; bytes: Uint8Array }[] = [];
  for (let i = 0; i < pages.length; i++) {
    const res = await mergePages(files, [pages[i]]);
    results.push({ name: `split-page-${i + 1}.pdf`, bytes: res.bytes });
  }
  return results;
}

/** تحليل نطاق صفحات نصي مثل "1-3, 5, 8-10" إلى فهارس (0-based) */
export function parsePageRange(input: string, max: number): number[] {
  const clean = input.replace(/\s+/g, '');
  if (!clean) return Array.from({ length: max }, (_, i) => i);
  const out = new Set<number>();
  clean.split(',').forEach((part) => {
    if (!part) return;
    if (part.includes('-')) {
      const [a, b] = part.split('-').map((n) => parseInt(n, 10));
      if (isNaN(a)) return;
      const end = isNaN(b) ? a : b;
      for (let i = Math.min(a, end); i <= Math.max(a, end); i++) {
        if (i >= 1 && i <= max) out.add(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= max) out.add(n - 1);
    }
  });
  return Array.from(out).sort((x, y) => x - y);
}

export function downloadBytes(filename: string, bytes: Uint8Array, type = 'application/pdf') {
  // إنشاء الـ Blob من مصفوفة بايتات صالحة
  const buf = new Uint8Array(bytes);
  const blob = new Blob([buf.buffer as ArrayBuffer], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // لا نُلغي الرابط فوراً — بعض المتصفحات تلغي التنزيل (Firefox/Safari)
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
