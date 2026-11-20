import React, { useEffect, useRef, useState } from 'react';
import { PenTool, Eraser, Save, X, Check, Stamp } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  /** يُستدعى بعد الحفظ لإرفاق التوقيع في المستند */
  onSaved?: () => void;
}

const PRESETS = [
  { id: 'p1', label: 'توقيع سريع', path: 'M10,70 C30,20 45,90 65,45 S95,20 120,60 S150,85 180,40' },
  { id: 'p2', label: 'توقيع رسمي', path: 'M8,60 C25,85 40,15 60,55 C75,85 95,25 120,50 C138,68 155,30 185,58' },
  { id: 'p3', label: 'ختم دائري', path: 'M95,15 C130,15 160,45 160,75 C160,105 130,130 95,130 C60,130 30,105 30,75 C30,45 60,15 95,15 Z' },
];

/** لوحة التوقيع الإلكتروني — رسم باللمس/الموس + توقيعات جاهزة + ختم */
export const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSaved }) => {
  const { signature, setSignature } = useWorkspace();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [name, setName] = useState('م/ وائل الجمال');
  const [hasInk, setHasInk] = useState(false);
  const [saved, setSaved] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  useEffect(() => {
    if (!isOpen) return;
    setSaved(false);
    const t = setTimeout(() => {
      setupCanvas();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasInk(false);
    }, 40);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!isOpen) return null;

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    setHasInk(true);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = pos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const drawPreset = (path: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = new Path2D(path);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.6;
    ctx.stroke(p);
    setHasInk(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignature({ dataUrl, name, createdAt: Date.now() });
    setSaved(true);
    setTimeout(() => {
      onSaved?.();
      onClose();
    }, 550);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <PenTool className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">التوقيع الإلكتروني</h3>
              <p className="text-[11px] text-white/60">يُرفق تلقائياً أسفل المستند الممسوح أو المطبوع</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* لوحة الرسم */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="w-full h-40 sm:h-48 rounded-xl border-2 border-dashed border-[var(--t-primary-border)] bg-slate-50 touch-none cursor-crosshair"
            />
            {!hasInk && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
                <PenTool className="w-7 h-7 mb-1 stroke-1" />
                <span className="text-[11px] font-bold">ارسم توقيعك هنا بالماوس أو باللمس</span>
              </div>
            )}
            <span className="absolute bottom-2 left-3 text-[10px] font-mono text-gray-400">
              التوقيع رقمياً معتمد
            </span>
          </div>

          {/* أدوات */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={clear}
              className="btn-pop px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5"
            >
              <Eraser className="w-3.5 h-3.5" />
              مسح
            </button>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => drawPreset(p.path)}
                className="btn-pop px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-soft text-[var(--t-primary-ink)] border border-[var(--t-primary-border)] flex items-center gap-1.5"
              >
                <Stamp className="w-3.5 h-3.5" />
                {p.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">اسم الموقّع</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
            />
          </div>

          {signature && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
              <span className="text-[11px] font-bold text-emerald-800">
                يوجد توقيع محفوظ مسبقاً — سيتم استبداله عند الحفظ
              </span>
              <button
                onClick={() => setSignature(null)}
                className="ms-auto text-[11px] font-bold text-red-600 hover:underline"
              >
                حذف
              </button>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-white/60">
          <button onClick={onClose} className="btn-pop px-4 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">
            إلغاء
          </button>
          <button
            onClick={save}
            disabled={!hasInk}
            className="btn-pop btn-shine px-5 py-2 rounded-lg text-xs font-bold text-white btn-primary-grad shadow-md flex items-center gap-1.5 disabled:opacity-40"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ التوقيع'}
          </button>
        </div>
      </div>
    </div>
  );
};
