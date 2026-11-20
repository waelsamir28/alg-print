import React from 'react';
import {
  X,
  Package,
  Droplets,
  AlertTriangle,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface StockPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/** لوحة إدارة المخزون: الأوراق والأحبار مع تنبيهات النقص */
export const StockPanel: React.FC<StockPanelProps> = ({ isOpen, onClose }) => {
  const { stock, adjustStock, restockItem, lowStock } = useWorkspace();

  if (!isOpen) return null;

  const papers = stock.filter((s) => s.kind === 'paper');
  const inks = stock.filter((s) => s.kind === 'ink');

  const renderItem = (item: (typeof stock)[number]) => {
    const pct = Math.round((item.stock / item.capacity) * 100);
    const isLow = item.stock <= item.threshold;
    const isCritical = item.stock <= item.threshold / 2;

    return (
      <div
        key={item.id}
        className={`p-3 rounded-xl border transition-colors ${
          isCritical
            ? 'border-red-300 bg-red-50/70'
            : isLow
            ? 'border-amber-300 bg-amber-50/60'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 min-w-0">
            <span
              className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-white"
              style={{
                background:
                  item.kind === 'ink' ? item.colorHex ?? '#64748b' : 'var(--t-primary)',
              }}
            >
              {item.kind === 'ink' ? <Droplets className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">{item.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{item.note}</div>
            </div>
          </div>

          {isLow && (
            <span
              className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 ${
                isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {isCritical ? 'نقص حرج' : 'منخفض'}
            </span>
          )}
        </div>

        {/* شريط المخزون */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(3, pct)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-gray-700 w-16 text-left" dir="ltr">
            {item.stock}/{item.capacity} {item.unit}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustStock(item.id, -1)}
            className="btn-pop w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
            title="خصم وحدة"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => adjustStock(item.id, 1)}
            className="btn-pop w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
            title="إضافة وحدة"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => adjustStock(item.id, 5)}
            className="btn-pop px-2 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-700"
            title="إضافة 5"
          >
            +5
          </button>
          <button
            onClick={() => restockItem(item.id)}
            className="btn-pop ms-auto px-2.5 h-7 rounded-lg bg-primary-soft text-[var(--t-primary-ink)] border border-[var(--t-primary-border)] text-[10px] font-bold flex items-center gap-1 hover:bg-[var(--t-primary-soft-2)]"
            title="إعادة التعبئة للمخزون الكامل"
          >
            <RefreshCw className="w-3 h-3" />
            إعادة تعبئة
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <Package className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">المخزون والأحبار</h3>
              <p className="text-[11px] text-white/60">أوراق · خراطيش HP 981X · تنبيهات النقص</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ${
                lowStock.length
                  ? 'bg-amber-400/20 text-amber-100 ring-amber-300/40'
                  : 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/40'
              }`}
            >
              {lowStock.length ? `${lowStock.length} عناصر بحاجة تعبئة` : 'المخزون آمن'}
            </span>
            <button
              onClick={onClose}
              className="btn-pop w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* تنبيه عام */}
          {lowStock.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <strong className="block mb-0.5">تنبيه مخزون:</strong>
                {lowStock.map((s) => s.name).join(' · ')} — الكمية أقل من حد التنبيه المحدد.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-900">
                جميع المستلزمات فوق حد التنبيه — يمكنك الطباعة باطمئنان.
              </span>
            </div>
          )}

          {/* الأوراق */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-[var(--t-primary)]" />
              <h4 className="text-xs font-black text-gray-800">الأوراق</h4>
              <span className="text-[10px] text-gray-400">{papers.length} أنواع</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{papers.map(renderItem)}</div>
          </div>

          {/* الأحبار */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-[var(--t-primary)]" />
              <h4 className="text-xs font-black text-gray-800">أحبار HP 981X</h4>
              <span className="text-[10px] text-gray-400">4 خراطيش</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{inks.map(renderItem)}</div>
          </div>
        </div>

        <div className="px-4 py-2.5 border-t border-gray-200 bg-white/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <TrendingDown className="w-3.5 h-3.5" />
            يُخصم الورق تلقائياً بعد كل مهمة طباعة مكتملة
          </div>
          <button className="btn-pop px-3 py-1.5 rounded-lg text-[11px] font-bold text-white btn-primary-grad flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            طلب تعبئة
          </button>
        </div>
      </div>
    </div>
  );
};
