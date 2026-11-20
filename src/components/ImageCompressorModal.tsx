import React, { useRef, useState } from 'react';
import {
  X,
  ImageDown,
  Upload,
  Loader2,
  Download,
  CheckCircle2,
  Droplets,
  Trash2,
  Sparkles,
  FileImage,
} from 'lucide-react';
import {
  compressImageFile,
  downloadBlob,
  formatKb,
  estimateInkSaving,
  DEFAULT_COMPRESS,
  type CompressResult,
} from '../utils/imageCompress';

interface Item {
  id: string;
  name: string;
  file: File;
  status: 'pending' | 'working' | 'done' | 'error';
  result?: CompressResult;
}

interface ImageCompressorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** ضغط الصور تلقائياً لتوفير الحبر — قبل الطباعة */
export const ImageCompressorModal: React.FC<ImageCompressorModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [maxDim, setMaxDim] = useState(DEFAULT_COMPRESS.maxDimension);
  const [quality, setQuality] = useState(DEFAULT_COMPRESS.quality);
  const [keepPng, setKeepPng] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Item[] = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        file: f,
        status: 'pending' as const,
      }));
    setItems((prev) => [...prev, ...next]);
  };

  const runAll = async () => {
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'working' } : i)));
      try {
        const result = await compressImageFile(item.file, { maxDimension: maxDim, quality, keepPng });
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'done', result } : i)));
      } catch {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error' } : i)));
      }
    }
    setBusy(false);
  };

  const totalOriginal = items.reduce((s, i) => s + i.file.size, 0);
  const totalNew = items.reduce((s, i) => s + (i.result?.newSize ?? i.file.size), 0);
  const totalSaved = totalOriginal > 0 ? Math.round(((totalOriginal - totalNew) / totalOriginal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 animate-fade-up">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <ImageDown className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">ضغط الصور وتوفير الحبر</h3>
              <p className="text-[11px] text-white/60">
                تقليل حجم الصور قبل الطباعة — جودة أفضل واستهلاك حبر أقل
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

        <div className="p-4 overflow-y-auto space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => add(e.target.files)}
          />

          {/* منطقة الإضافة */}
          <button
            onClick={() => inputRef.current?.click()}
            className="btn-pop w-full py-6 rounded-xl border-2 border-dashed border-[var(--t-primary-border)] bg-primary-soft/50 hover:bg-primary-soft flex flex-col items-center gap-1.5"
          >
            <Upload className="w-6 h-6 text-[var(--t-primary)]" />
            <span className="text-xs font-bold text-[var(--t-primary-ink)]">
              أضف صوراً للضغط (JPG / PNG / WebP)
            </span>
            <span className="text-[10px] text-gray-500">
              يتم الضغط على جهازك مباشرة — لا تُرفع أي صورة للإنترنت
            </span>
          </button>

          {/* الإعدادات */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                أقصى بعد: {maxDim}px
              </label>
              <input
                type="range"
                min={800}
                max={3000}
                step={100}
                value={maxDim}
                onChange={(e) => setMaxDim(parseInt(e.target.value))}
                className="w-full accent-[var(--t-primary)]"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                الجودة: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min={0.4}
                max={1}
                step={0.02}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-[var(--t-primary)]"
              />
            </div>
            <button
              onClick={() => setKeepPng(!keepPng)}
              className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 ${
                keepPng
                  ? 'bg-primary-soft border-[var(--t-primary-border)] text-[var(--t-primary-ink)]'
                  : 'bg-slate-50 border-gray-200 text-gray-600'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              {keepPng ? 'PNG (شفافية)' : 'JPEG (أصغر)'}
            </button>
          </div>

          {/* القائمة */}
          {items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white"
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FileImage className="w-4 h-4 text-gray-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-gray-800 truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                      <span>{formatKb(item.file.size)}</span>
                      {item.result && (
                        <>
                          <span>→</span>
                          <span className="font-bold text-emerald-600">
                            {formatKb(item.result.newSize)}
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">
                            −{item.result.savedPercent}%
                          </span>
                          <span className="text-gray-400">
                            {item.result.width}×{item.result.height}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {item.status === 'working' && (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--t-primary)]" />
                  )}
                  {item.status === 'done' && item.result && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <button
                        onClick={() =>
                          downloadBlob(
                            item.result!.blob,
                            item.name.replace(/\.(jpe?g|png|webp)$/i, '') +
                              (item.result!.outputType === 'image/png' ? '.png' : '.jpg')
                          )
                        }
                        className="btn-pop px-2 py-1 rounded-md bg-primary-soft text-[10px] font-bold text-[var(--t-primary-ink)] flex items-center gap-0.5"
                      >
                        <Download className="w-3 h-3" />
                        تنزيل
                      </button>
                    </>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[10px] font-bold text-red-600">فشل</span>
                  )}
                  <button
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="btn-pop w-6 h-6 rounded-md hover:bg-red-100 text-red-500 flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* الملخص */}
          {items.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" />
                  توفير الحبر المتوقع
                </span>
                <span className="font-mono">{estimateInkSaving(totalSaved).inkPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${estimateInkSaving(totalSaved).inkPercent * 2}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-emerald-800 mt-1">
                <span>
                  {formatKb(totalOriginal)} → {formatKb(totalNew)} (توفير {totalSaved}%)
                </span>
                <span>{items.filter((i) => i.status === 'done').length}/{items.length} جاهز</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            الضغط يقلل بيانات الطباعة ويطيل عمر الخرطوشة
          </span>
          <div className="flex items-center gap-1.5">
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="btn-pop px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 bg-gray-100"
              >
                مسح
              </button>
            )}
            <button
              onClick={runAll}
              disabled={busy || items.length === 0}
              className="btn-pop btn-shine px-4 py-1.5 rounded-lg text-[11px] font-bold text-white btn-primary-grad flex items-center gap-1.5 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageDown className="w-3.5 h-3.5" />}
              {busy ? 'جارٍ الضغط...' : 'ضغط الكل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
