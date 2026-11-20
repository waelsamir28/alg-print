import React, { useMemo, useState } from 'react';
import {
  X,
  GitCompare,
  Upload,
  ArrowRightLeft,
  Trash2,
  Copy,
  Check,
  Download,
  FileText,
  Layers,
} from 'lucide-react';
import { downloadText } from '../utils/ocr';

interface DocSide {
  name: string;
  text: string;
}

type DiffOp = { type: 'same' | 'add' | 'del'; text: string; side: 'A' | 'B' | 'both' };

/* ---------- خوارزمية LCS للمقارنة على مستوى الكلمات ---------- */
function diffWords(a: string, b: string): DiffOp[] {
  const aw = a.split(/(\s+)/).filter((t) => t !== '');
  const bw = b.split(/(\s+)/).filter((t) => t !== '');

  const n = aw.length;
  const m = bw.length;

  // حماية من الملفات الضخمة
  const limit = 1400;
  const A = n > limit ? aw.slice(0, limit) : aw;
  const B = m > limit ? bw.slice(0, limit) : bw;

  const dp: number[][] = Array.from({ length: A.length + 1 }, () =>
    new Array(B.length + 1).fill(0)
  );

  for (let i = A.length - 1; i >= 0; i--) {
    for (let j = B.length - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) {
      ops.push({ type: 'same', text: A[i], side: 'both' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', text: A[i], side: 'A' });
      i++;
    } else {
      ops.push({ type: 'add', text: B[j], side: 'B' });
      j++;
    }
  }
  while (i < A.length) ops.push({ type: 'del', text: A[i++], side: 'A' });
  while (j < B.length) ops.push({ type: 'add', text: B[j++], side: 'B' });
  return ops;
}

const SAMPLE_A = `عقد خدمات واستشارات هندسية
الطرف الأول: شركة النيل للإنشاءات والتوريدات
الطرف الثاني: المكتب الهندسي للاستشارات
البند الأول: يلتزم الطرف الثاني بتقديم كافة الخدمات الاستشارية
البند الثاني: مدة العقد اثنا عشر شهراً قابلة للتجديد
البند الثالث: قيمة العقد حسب جداول الكميات المرفقة`;

const SAMPLE_B = `عقد خدمات واستشارات هندسية
الطرف الأول: شركة النيل للإنشاءات والتوريدات
الطرف الثاني: المكتب الهندسي للاستشارات
البند الأول: يلتزم الطرف الثاني بتقديم كافة الخدمات الاستشارية والهندسية
البند الثاني: مدة العقد أربعة وعشرون شهراً غير قابلة للتجديد
البند الثالث: قيمة العقد حسب جداول الكميات المرفقة
البند الرابع: غرامة التأخير 2% أسبوعياً`;

/** مقارنة A/B بين نسختي مستند (Diff) — بالكلمات مع إحصاءات وتصدير */
export const DocumentDiffModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [a, setA] = useState<DocSide>({ name: 'النسخة A', text: SAMPLE_A });
  const [b, setB] = useState<DocSide>({ name: 'النسخة B', text: SAMPLE_B });
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'inline' | 'side'>('inline');

  const ops = useMemo(() => diffWords(a.text, b.text), [a.text, b.text]);

  const stats = useMemo(() => {
    const wordsA = a.text.split(/\s+/).filter(Boolean).length;
    const wordsB = b.text.split(/\s+/).filter(Boolean).length;
    const added = ops.filter((o) => o.type === 'add').length;
    const removed = ops.filter((o) => o.type === 'del').length;
    const same = ops.filter((o) => o.type === 'same').length;
    const similarity = same + added + removed > 0 ? Math.round((same / (same + added + removed)) * 100) : 0;
    return { wordsA, wordsB, added, removed, same, similarity };
  }, [ops, a.text, b.text]);

  if (!isOpen) return null;

  const loadFile = (side: 'A' | 'B') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const payload = { name: file.name, text };
    if (side === 'A') setA(payload);
    else setB(payload);
    e.target.value = '';
  };

  const exportReport = () => {
    const lines = [
      'SMART PRINT — تقرير مقارنة مستندين (Diff)',
      `التاريخ: ${new Date().toLocaleString('ar-EG')}`,
      `النسخة A: ${a.name} (${stats.wordsA} كلمة)`,
      `النسخة B: ${b.name} (${stats.wordsB} كلمة)`,
      `نسبة التطابق: ${stats.similarity}%`,
      `إضافات: ${stats.added} · حذف: ${stats.removed} · مشترك: ${stats.same}`,
      '----------------------------------------------',
      ...ops.map((o) =>
        o.type === 'same' ? `  ${o.text}` : o.type === 'add' ? `+ ${o.text}` : `- ${o.text}`
      ),
    ];
    downloadText(`SmartPrint-Diff-${Date.now()}.txt`, lines.join('\n'));
  };

  const copyDiff = async () => {
    await navigator.clipboard.writeText(
      ops.map((o) => (o.type === 'same' ? o.text : o.type === 'add' ? `+${o.text}` : `-${o.text}`)).join(' ')
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const renderInline = () =>
    ops.map((op, i) =>
      op.type === 'same' ? (
        <span key={i}>{op.text} </span>
      ) : op.type === 'add' ? (
        <span key={i} className="bg-emerald-100 text-emerald-900 rounded px-0.5 font-bold">
          {op.text}{' '}
        </span>
      ) : (
        <span key={i} className="bg-red-100 text-red-900 rounded px-0.5 line-through">
          {op.text}{' '}
        </span>
      )
    );

  const renderSide = (side: 'A' | 'B') =>
    ops
      .filter((o) => o.type === 'same' || (side === 'A' ? o.type === 'del' : o.type === 'add'))
      .map((op, i) =>
        op.type === 'same' ? (
          <span key={i}>{op.text} </span>
        ) : (
          <span
            key={i}
            className={
              side === 'A'
                ? 'bg-red-100 text-red-900 rounded px-0.5 line-through'
                : 'bg-emerald-100 text-emerald-900 rounded px-0.5 font-bold'
            }
          >
            {op.text}{' '}
          </span>
        )
      );

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 animate-fade-up">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <GitCompare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">مقارنة A/B بين نسختي مستند</h3>
              <p className="text-[11px] text-white/60">Diff بالكلمات — يعمل على المستندات الممسوحة بعد OCR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 overflow-y-auto space-y-3">
          {/* المدخلات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(['A', 'B'] as const).map((side) => {
              const doc = side === 'A' ? a : b;
              const setDoc = side === 'A' ? setA : setB;
              return (
                <div key={side} className="rounded-xl border border-gray-200 overflow-hidden">
                  <div
                    className={`px-2.5 py-1.5 flex items-center justify-between ${
                      side === 'A' ? 'bg-red-50' : 'bg-emerald-50'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black ${
                        side === 'A' ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      النسخة {side}
                    </span>
                    <div className="flex items-center gap-1">
                      <label className="btn-pop px-2 py-0.5 rounded bg-white text-[9px] font-bold text-gray-600 border border-gray-200 cursor-pointer flex items-center gap-0.5">
                        <Upload className="w-2.5 h-2.5" />
                        ملف
                        <input type="file" accept=".txt,.md,.csv" className="hidden" onChange={loadFile(side)} />
                      </label>
                      <button
                        onClick={() => setDoc({ name: `النسخة ${side}`, text: '' })}
                        className="btn-pop w-5 h-5 rounded hover:bg-white text-gray-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={doc.text}
                    onChange={(e) => setDoc({ ...doc, text: e.target.value })}
                    placeholder="الصق نص المستند هنا (أو بعد OCR)..."
                    rows={4}
                    className="w-full p-2 text-[11px] leading-relaxed resize-none focus:outline-none text-right"
                    style={{ fontFamily: 'var(--app-font)' }}
                  />
                  <div className="px-2 py-1 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-500 flex items-center justify-between">
                    <span className="truncate">{doc.name}</span>
                    <span className="font-mono">{doc.text.split(/\s+/).filter(Boolean).length} كلمة</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* الإحصاءات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'نسبة التطابق', value: `${stats.similarity}%`, cls: 'text-[var(--t-primary-ink)]' },
              { label: 'إضافات في B', value: `+${stats.added}`, cls: 'text-emerald-600' },
              { label: 'محذوف من A', value: `−${stats.removed}`, cls: 'text-red-600' },
              { label: 'كلمات مشتركة', value: stats.same, cls: 'text-gray-700' },
            ].map((s) => (
              <div key={s.label} className="p-2 rounded-xl bg-slate-50 border border-gray-200 text-center">
                <div className={`text-base font-black font-mono ${s.cls}`}>{s.value}</div>
                <div className="text-[9px] font-bold text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* شريط التطابق */}
          <div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
              <div className="bg-gray-300" style={{ width: `${stats.similarity}%` }} />
              <div className="bg-red-400" style={{ width: `${(stats.removed / Math.max(1, stats.same + stats.added + stats.removed)) * 100}%` }} />
              <div className="bg-emerald-400 flex-1" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-400 mt-0.5">
              <span>متطابق</span>
              <span>محذوف</span>
              <span>مضاف</span>
            </div>
          </div>

          {/* وضع العرض */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('inline')}
              className={`btn-pop px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                viewMode === 'inline'
                  ? 'btn-primary-grad text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Layers className="w-3 h-3" />
              عرض مدمج
            </button>
            <button
              onClick={() => setViewMode('side')}
              className={`btn-pop px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                viewMode === 'side' ? 'btn-primary-grad text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              عرض جنب لجنب
            </button>
            <div className="ms-auto flex items-center gap-1.5">
              <button
                onClick={copyDiff}
                className="btn-pop px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
              <button
                onClick={exportReport}
                className="btn-pop px-2.5 py-1 rounded-lg bg-primary-soft text-[10px] font-bold text-[var(--t-primary-ink)] border border-[var(--t-primary-border)] flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                تقرير TXT
              </button>
            </div>
          </div>

          {/* النتيجة */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 min-h-[180px] max-h-[320px] overflow-y-auto">
            {ops.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <FileText className="w-8 h-8 mb-2 stroke-1 text-gray-300" />
                <p className="text-[11px] font-bold text-gray-600">لا يوجد نص للمقارنة</p>
                <p className="text-[10px] mt-0.5">الصق نص النسختين أعلاه</p>
              </div>
            ) : viewMode === 'inline' ? (
              <p className="text-[11px] leading-loose text-gray-800 text-right" style={{ fontFamily: 'var(--app-font)' }}>
                {renderInline()}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-[11px] leading-loose text-right border-e border-gray-100 pe-3">
                  <div className="text-[9px] font-black text-red-600 mb-1">A — قبل</div>
                  {renderSide('A')}
                </div>
                <div className="text-[11px] leading-loose text-right">
                  <div className="text-[9px] font-black text-emerald-600 mb-1">B — بعد</div>
                  {renderSide('B')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 shrink-0">
          <span>المقارنة تتم محلياً على جهازك — لا يُرسل أي محتوى للخارج</span>
          <button
            onClick={onClose}
            className="btn-pop px-4 py-1.5 rounded-lg text-[11px] font-bold text-white btn-primary-grad"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
