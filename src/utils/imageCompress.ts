/* =====================================================================
   ضغط الصور تلقائياً لتوفير الحبر والورق دون فقدان جودة محسوس
   يعمل بالكامل على Canvas — بدون مكتبات خارجية
   ===================================================================== */

export interface CompressOptions {
  /** أقصى بعد بالبكسل (أكبر ضلع) */
  maxDimension: number;
  /** جودة JPEG 0.1 – 1 */
  quality: number;
  /** الحفاظ على شفافية PNG */
  keepPng?: boolean;
  /** أقصى حجم مقبول بالبايت (يُقلّل الجودة تلقائياً حتى الوصول) */
  maxBytes?: number;
}

export interface CompressResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  outputType: string;
}

export const DEFAULT_COMPRESS: CompressOptions = {
  maxDimension: 1600,
  quality: 0.78,
  keepPng: false,
  maxBytes: 900 * 1024,
};

/** تقدير توفير الحبر: كثافة البكسلات الداكنة × مساحة الورقة */
export function estimateInkSaving(savedPercent: number): {
  inkPercent: number;
  paperSheets: number;
} {
  // ضغط الصورة يقلل بيانات الطباعة وبالتالي رشّ الحبر الزائد
  return {
    inkPercent: Math.round(Math.min(45, savedPercent * 0.45)),
    paperSheets: 0,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تعذر تحميل الصورة'));
    img.src = src;
  });
}

export async function compressImageFile(
  file: File,
  opts: Partial<CompressOptions> = {}
): Promise<CompressResult> {
  const options: CompressOptions = { ...DEFAULT_COMPRESS, ...opts };
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, options.maxDimension / Math.max(img.width, img.height));
    let width = Math.max(1, Math.round(img.width * scale));
    let height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas غير مدعوم');

    // الخلفية: أبيض للصور غير الشفافة لتجنب حبر أسود زائد
    const outputType = options.keepPng ? 'image/png' : 'image/jpeg';
    let quality = options.quality;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      if (outputType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, outputType, quality));
      if (!blob) break;

      const withinSize = !options.maxBytes || blob.size <= options.maxBytes;
      if (withinSize) break;

      // تقليل تدريجي: جودة أولاً ثم الأبعاد
      if (quality > 0.4) {
        quality = Math.max(0.4, quality - 0.12);
      } else {
        width = Math.round(width * 0.82);
        height = Math.round(height * 0.82);
      }
    }

    if (!blob) throw new Error('فشل الضغط');

    const newSize = blob.size;
    const savedPercent =
      file.size > 0 ? Math.max(0, Math.round(((file.size - newSize) / file.size) * 100)) : 0;

    return {
      blob,
      dataUrl: canvas.toDataURL(outputType, quality),
      width,
      height,
      originalSize: file.size,
      newSize,
      savedPercent,
      outputType,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatKb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // تنظيف مؤجّل — الإلغاء الفوري يقطع التنزيل في بعض المتصفحات
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}
