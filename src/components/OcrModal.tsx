import React, { useState } from 'react';
import {
  X,
  ScanText,
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
  Type,
  Loader2,
  Search,
} from 'lucide-react';
import type { ScannedPage } from '../types';
import { runOcr, ocrToPlainText, downloadText, OCR_TEMPLATE_LABELS, type OcrResult } from '../utils/ocr';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: ScannedPage[];
  defaultTemplate: string;
}

/** التعرف الضوئي على الحروف العربية (OCR) للمستندات الممسوحة */
export const OcrModal: React.FC<OcrModalProps> = ({ isOpen, onClose, pages, defaultTemplate }) => {
  const [template, setTemplate] = useState(defaultTemplate);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const start = async () => {
    setRunning(true);
    setResults([]);
    const collected: OcrResult[] = [];
    for (let i = 0; i < pages.length; i++) {
      setActivePage(i);
      setProgress(0);
      const res = await runOcr(pages[i], i, template, (p) => setProgress(p));
      collected.push(res);
      setResults([...collected]);
    }
    setRunning(false);
  };

  const allText = results.map((r) => r.text).join('\n\n');
  const highlighted = query
    ? allText.replace(
        new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        (m) => `«${m}»`
      )
    : allText;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const avgConfidence = results.length
    ? Math.round(results.reduce((s, r) => s + r.confidence, 0) / results.length)
    : 0;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <ScanText className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">التعرف الضوئي على الحروف (OCR)</h3>
              <p className="text-[11px] text-white/60">عربي · إنجليزي — تحويل الممسوح إلى نص قابل للبحث</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
          {/* الجانب الأيمن: الإعدادات */}
          <div className="p-4 border-b md:border-b-0 md:border-l border-gray-200 space-y-3 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">نوع المستند</label>
              <div className="grid grid-cols-2 gap-1.5">
                {OCR_TEMPLATE_LABELS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    disabled={running}
                    className={`btn-pop p-2 rounded-xl text-[11px] font-bold border text-right transition-colors ${
                      template === t.id
                        ? 'bg-primary-soft text-[var(--t-primary-ink)] border-[var(--t-primary)]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-gray-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                <span>عدد الصفحات</span>
                <span className="font-mono text-[var(--t-primary-ink)]">{pages.length}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                <span>اللغة</span>
                <span>العربية (ar-EG) + English</span>
              </div>
            </div>

            <button
              onClick={start}
              disabled={running || pages.length === 0}
              className="btn-pop btn-shine w-full py-3 rounded-xl font-black text-xs text-white btn-primary-grad shadow-md flex items-center justify-center gap-2 disabled:opacity-50 anim-gradient"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {running ? `جارٍ التحليل — صفحة ${activePage + 1}` : 'بدء التعرف على النص'}
            </button>

            {running && (
              <div>
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full btn-primary-grad transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 text-center font-mono">
                  تحليل الصفوف والأعمدة... {progress}%
                </p>
              </div>
            )}

            {results.length > 0 && !running && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  اكتمل التحليل — دقة {avgConfidence}%
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">
                  {allText.split(/\s+/).length} كلمة · {results.length} صفحة ·{' '}
                  {(results.reduce((s, r) => s + r.durationMs, 0) / 1000).toFixed(1)} ثانية
                </div>
              </div>
            )}

            <div className="text-[10px] text-gray-400 leading-snug">
              💡 يمكنك البحث داخل النص الناتج، ثم نسخه أو تنزيله كملف نصي جاهز للتحرير.
            </div>
          </div>

          {/* الجانب الأيسر: النتيجة */}
          <div className="flex flex-col min-h-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث داخل النص المستخرج..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pe-3 ps-7 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                />
              </div>
              <button
                onClick={copyAll}
                disabled={!allText}
                className="btn-pop px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 text-[10px] font-bold disabled:opacity-40"
                title="نسخ الكل"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
              <button
                onClick={() => downloadText(`OCR_${Date.now()}.txt`, ocrToPlainText(results))}
                disabled={!allText}
                className="btn-pop px-2.5 py-1.5 rounded-lg bg-primary-soft text-[var(--t-primary-ink)] border border-[var(--t-primary-border)] flex items-center gap-1 text-[10px] font-bold disabled:opacity-40"
                title="تنزيل النص"
              >
                <Download className="w-3.5 h-3.5" />
                TXT
              </button>
            </div>

            <div className="flex-1 min-h-[220px] rounded-xl border border-gray-200 bg-slate-50 p-3 overflow-y-auto">
              {allText ? (
                <pre
                  className="whitespace-pre-wrap text-[11px] leading-relaxed text-gray-800 text-right"
                  style={{ fontFamily: 'var(--app-font)' }}
                >
                  {highlighted}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
                  <Type className="w-9 h-9 mb-2 stroke-1 text-gray-300" />
                  <p className="text-[11px] font-bold text-gray-600">لا يوجد نص بعد</p>
                  <p className="text-[10px] mt-0.5">اضغط «بدء التعرف على النص» لتحويل الصفحات</p>
                  {pages.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-400">
                      <FileText className="w-3 h-3" />
                      {pages.length} صفحة جاهزة للتحليل
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
