import React, { useRef, useState } from 'react';
import {
  X,
  Files,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Scissors,
  Download,
  Layers,
  RotateCw,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  loadPdfFile,
  buildPageList,
  mergePages,
  splitEveryPage,
  downloadBytes,
  formatBytes,
  type PdfFileItem,
  type PdfPageRef,
} from '../utils/pdfTools';

interface PdfToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** أدوات PDF: دمج، تقسيم، إعادة ترتيب، تدوير، حذف صفحات — قبل الطباعة */
export const PdfToolsModal: React.FC<PdfToolsModalProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [pages, setPages] = useState<PdfPageRef[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setMsg(null);
    try {
      const loaded: PdfFileItem[] = [];
      for (const file of Array.from(list)) {
        if (!file.name.toLowerCase().endsWith('.pdf')) continue;
        loaded.push(await loadPdfFile(file));
      }
      const nextFiles = [...files, ...loaded];
      setFiles(nextFiles);
      setPages(buildPageList(nextFiles));
      if (loaded.length) {
        setMsg({ ok: true, text: `تمت إضافة ${loaded.length} ملف (${loaded.reduce((s, f) => s + f.pageCount, 0)} صفحة)` });
      } else {
        setMsg({ ok: false, text: 'لم يتم العثور على ملفات PDF صالحة' });
      }
    } catch {
      setMsg({ ok: false, text: 'تعذر قراءة أحد الملفات — تأكد أنه PDF غير محمي بكلمة مرور' });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const move = (key: string, dir: -1 | 1) => {
    const idx = pages.findIndex((p) => p.key === key);
    const t = idx + dir;
    if (idx < 0 || t < 0 || t >= pages.length) return;
    const next = [...pages];
    [next[idx], next[t]] = [next[t], next[idx]];
    setPages(next);
  };

  const rotate = (key: string) => {
    setPages((prev) => prev.map((p) => (p.key === key ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  };

  const removePages = () => {
    if (selected.size === 0) return;
    setPages((prev) => prev.filter((p) => !selected.has(p.key)));
    setSelected(new Set());
  };

  const doMerge = async () => {
    setBusy(true);
    try {
      const res = await mergePages(files, pages);
      downloadBytes(`SmartPrint-Merged-${Date.now()}.pdf`, res.bytes);
      setMsg({ ok: true, text: `تم دمج ${res.pageCount} صفحة وتنزيل الملف` });
    } catch {
      setMsg({ ok: false, text: 'فشل الدمج — حاول مرة أخرى' });
    } finally {
      setBusy(false);
    }
  };

  const doExtract = async () => {
    if (selected.size === 0) {
      setMsg({ ok: false, text: 'حدّد الصفحات المطلوب استخراجها أولاً' });
      return;
    }
    setBusy(true);
    try {
      const chosen = pages.filter((p) => selected.has(p.key));
      const res = await mergePages(files, chosen);
      downloadBytes(`SmartPrint-Extract-${Date.now()}.pdf`, res.bytes);
      setMsg({ ok: true, text: `تم استخراج ${res.pageCount} صفحة` });
    } catch {
      setMsg({ ok: false, text: 'فشل الاستخراج' });
    } finally {
      setBusy(false);
    }
  };

  const doSplitAll = async () => {
    setBusy(true);
    try {
      const results = await splitEveryPage(files, pages);
      for (const r of results) {
        downloadBytes(r.name, r.bytes);
        await new Promise((res) => setTimeout(res, 220));
      }
      setMsg({ ok: true, text: `تم تقسيم الملف إلى ${results.length} ملف منفصل` });
    } catch {
      setMsg({ ok: false, text: 'فشل التقسيم' });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setPages([]);
    setSelected(new Set());
    setMsg(null);
  };

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 animate-fade-up">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <Files className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">أدوات PDF — الدمج والتقسيم</h3>
              <p className="text-[11px] text-white/60">
                دمج · تقسيم · إعادة ترتيب · تدوير · حذف صفحات — قبل الطباعة
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

        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 min-h-0">
          {/* الملفات */}
          <div className="p-3 border-b md:border-b-0 md:border-l border-gray-200 overflow-y-auto">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="btn-pop btn-shine w-full py-2.5 rounded-xl text-xs font-bold text-white btn-primary-grad flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إضافة ملفات PDF
            </button>

            {files.length > 0 && (
              <button
                onClick={reset}
                className="btn-pop w-full mt-1.5 py-1.5 rounded-lg text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                مسح الكل
              </button>
            )}

            <div className="mt-3 space-y-1.5">
              {files.map((f) => (
                <div key={f.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-800 truncate">{f.name}</div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-2">
                    <span>{f.pageCount} صفحة</span>
                    <span>· {formatBytes(f.size)}</span>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center py-6">
                  لم تُضف ملفات بعد — أضف ملفات PDF للبدء
                </p>
              )}
            </div>

            {msg && (
              <div
                className={`mt-3 flex items-start gap-1.5 p-2 rounded-lg text-[10px] font-semibold animate-fade-up ${
                  msg.ok
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {msg.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                {msg.text}
              </div>
            )}
          </div>

          {/* الصفحات */}
          <div className="md:col-span-2 flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--t-primary)]" />
                الصفحات ({pages.length})
                {selected.size > 0 && (
                  <span className="text-[10px] bg-primary-soft text-[var(--t-primary-ink)] px-1.5 rounded">
                    محدد {selected.size}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelected(new Set(pages.map((p) => p.key)))}
                  className="btn-pop px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold text-gray-600"
                >
                  تحديد الكل
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="btn-pop px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  onClick={removePages}
                  disabled={selected.size === 0}
                  className="btn-pop px-2 py-1 rounded-md bg-red-50 text-[10px] font-bold text-red-600 disabled:opacity-40 flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  حذف
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {pages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
                  <Files className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">لا توجد صفحات</p>
                  <p className="text-[10px] mt-1">أضف ملف PDF ثم رتّب الصفحات كما تريد</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {pages.map((p, idx) => {
                    const isSel = selected.has(p.key);
                    return (
                      <div
                        key={p.key}
                        onClick={() => toggle(p.key)}
                        className={`relative cursor-pointer rounded-lg border-2 p-1.5 transition-all ${
                          isSel
                            ? 'border-[var(--t-primary)] bg-primary-soft shadow'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-[3/4] bg-slate-100 rounded flex items-center justify-center mb-1 overflow-hidden">
                          <div
                            className="w-full h-full bg-white border border-gray-200 rounded flex flex-col p-1 gap-0.5"
                            style={{ transform: `rotate(${p.rotation}deg)` }}
                          >
                            <div className="h-0.5 bg-gray-300 rounded w-3/4" />
                            <div className="h-0.5 bg-gray-200 rounded w-full" />
                            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
                            <div className="h-0.5 bg-gray-200 rounded w-full" />
                            <div className="h-0.5 bg-gray-200 rounded w-2/3" />
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-gray-700 text-center truncate">
                          {idx + 1}. {p.label}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              move(p.key, -1);
                            }}
                            className="w-4 h-4 rounded hover:bg-gray-200 flex items-center justify-center"
                            title="تقديم"
                          >
                            <ArrowUp className="w-2.5 h-2.5 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              move(p.key, 1);
                            }}
                            className="w-4 h-4 rounded hover:bg-gray-200 flex items-center justify-center"
                            title="تأخير"
                          >
                            <ArrowDown className="w-2.5 h-2.5 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rotate(p.key);
                            }}
                            className="w-4 h-4 rounded hover:bg-gray-200 flex items-center justify-center"
                            title="تدوير 90°"
                          >
                            <RotateCw className="w-2.5 h-2.5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* أزرار التنفيذ */}
            <div className="px-3 py-2 border-t border-gray-200 flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                onClick={doMerge}
                disabled={busy || pages.length === 0}
                className="btn-pop flex-1 min-w-[130px] py-2 rounded-lg text-[11px] font-bold text-white btn-primary-grad flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                دمج وتنزيل PDF
              </button>
              <button
                onClick={doExtract}
                disabled={busy || selected.size === 0}
                className="btn-pop px-3 py-2 rounded-lg text-[11px] font-bold bg-primary-soft text-[var(--t-primary-ink)] border border-[var(--t-primary-border)] flex items-center gap-1.5 disabled:opacity-40"
              >
                <Scissors className="w-3.5 h-3.5" />
                استخراج المحدد
              </button>
              <button
                onClick={doSplitAll}
                disabled={busy || pages.length === 0}
                className="btn-pop px-3 py-2 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-700 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                تقسيم كل صفحة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
