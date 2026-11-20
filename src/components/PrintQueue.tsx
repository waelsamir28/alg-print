import React from 'react';
import {
  X,
  ListOrdered,
  Play,
  Pause,
  Ban,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  Layers,
  Printer,
  Loader2,
} from 'lucide-react';
import { useWorkspace, QueueJob } from '../context/WorkspaceContext';

interface PrintQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_META: Record<
  QueueJob['status'],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  queued: { label: 'في الانتظار', cls: 'bg-slate-200 text-slate-700', icon: <Clock className="w-3 h-3" /> },
  printing: {
    label: 'جاري الطباعة',
    cls: 'bg-[var(--t-primary-soft-2)] text-[var(--t-primary-ink)]',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  paused: { label: 'متوقف مؤقتاً', cls: 'bg-amber-100 text-amber-800', icon: <Pause className="w-3 h-3" /> },
  done: {
    label: 'تمت الطباعة',
    cls: 'bg-emerald-100 text-emerald-800',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: { label: 'ملغي', cls: 'bg-red-100 text-red-700', icon: <Ban className="w-3 h-3" /> },
};

/** طابور الطباعة (Spooler) — ترتيب المهام، إيقاف/استكمال، إلغاء، وتقدّم حي */
export const PrintQueue: React.FC<PrintQueueProps> = ({ isOpen, onClose }) => {
  const { queue, pauseJob, resumeJob, cancelJob, removeJob, clearFinished, moveJob, activeJob } =
    useWorkspace();

  if (!isOpen) return null;

  const pending = queue.filter((j) => ['queued', 'printing', 'paused'].includes(j.status));
  const finished = queue.filter((j) => ['done', 'cancelled'].includes(j.status));

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <ListOrdered className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">طابور الطباعة</h3>
              <p className="text-[11px] text-white/60">
                {pending.length} مهمة نشطة · {finished.length} منتهية · Windows Spooler
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

        {/* شريط المهمة الجارية */}
        {activeJob && (
          <div className="px-4 py-2 bg-[var(--t-primary-soft)] border-b border-[var(--t-primary-border)] shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--t-primary-ink)] mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <Printer className="w-3.5 h-3.5" />
                {activeJob.title}
              </span>
              <span className="font-mono">{Math.round(activeJob.progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full btn-primary-grad transition-all duration-300"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-4 overflow-y-auto space-y-2">
          {pending.length === 0 && finished.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Printer className="w-10 h-10 mx-auto mb-2 stroke-1 text-gray-300" />
              <p className="text-xs font-bold text-gray-600">طابور الطباعة فارغ</p>
              <p className="text-[11px] mt-1">ابدأ مهمة طباعة من تبويب «طباعة» لتظهر هنا</p>
            </div>
          )}

          {pending.map((job, idx) => {
            const meta = STATUS_META[job.status];
            return (
              <div
                key={job.id}
                className={`p-3 rounded-xl border transition-colors ${
                  job.status === 'printing'
                    ? 'border-[var(--t-primary-border)] bg-primary-soft'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">{job.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {job.files} ملف · {job.sheets} ورقة
                      </span>
                      <span>×{job.copies} نسخة</span>
                      <span>{job.isColor ? 'ألوان' : 'أبيض وأسود'}</span>
                      {job.duplex && <span>وش وضهر</span>}
                      <span className="truncate">{job.trayName.split('(')[0]}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${meta.cls}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>

                {/* تقدم */}
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full btn-primary-grad transition-all duration-300"
                    style={{ width: `${job.status === 'printing' ? job.progress : 0}%` }}
                  />
                </div>

                {/* أزرار التحكم */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => moveJob(job.id, -1)}
                    disabled={idx === 0}
                    className="btn-pop w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-gray-700"
                    title="تقديم في الطابور"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveJob(job.id, 1)}
                    disabled={idx === pending.length - 1}
                    className="btn-pop w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-gray-700"
                    title="تأخير في الطابور"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {job.status === 'printing' ? (
                    <button
                      onClick={() => pauseJob(job.id)}
                      className="btn-pop px-2.5 h-7 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      إيقاف مؤقت
                    </button>
                  ) : job.status === 'paused' ? (
                    <button
                      onClick={() => resumeJob(job.id)}
                      className="btn-pop px-2.5 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      استكمال
                    </button>
                  ) : null}

                  <button
                    onClick={() => cancelJob(job.id)}
                    className="btn-pop px-2.5 h-7 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold flex items-center gap-1 ms-auto"
                  >
                    <Ban className="w-3 h-3" />
                    إلغاء
                  </button>
                </div>
              </div>
            );
          })}

          {finished.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black text-gray-500">مهام منتهية</span>
                <button
                  onClick={clearFinished}
                  className="btn-pop text-[10px] font-bold text-red-600 hover:underline"
                >
                  مسح المنتهية
                </button>
              </div>
              {finished.map((job) => {
                const meta = STATUS_META[job.status];
                return (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-gray-700 truncate">{job.title}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(job.submittedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {job.sheets} ورقة ×{job.copies}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${meta.cls}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <button
                        onClick={() => removeJob(job.id)}
                        className="btn-pop w-6 h-6 rounded-md hover:bg-red-100 text-red-600 flex items-center justify-center"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
