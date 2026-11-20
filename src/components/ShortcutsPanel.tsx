import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { SHORTCUT_LIST } from '../hooks/useKeyboardShortcuts';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/** لوحة اختصارات لوحة المفاتيح — تُفتح بـ F1 */
export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const groups = Array.from(new Set(SHORTCUT_LIST.map((s) => s.group)));

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-up">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-pop-in">
        <div className="sect-hdr px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <Keyboard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">اختصارات لوحة المفاتيح</h3>
              <p className="text-[11px] text-white/60">اضغط F1 في أي وقت لعرض هذه اللوحة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-pop relative z-10 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-red-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Command className="w-3 h-3 text-[var(--t-primary)]" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide">
                  {group}
                </span>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {SHORTCUT_LIST.filter((s) => s.group === group).map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-primary-soft/60"
                  >
                    <span className="text-[11px] font-semibold text-gray-700">{s.label}</span>
                    <span className="flex gap-1" dir="ltr">
                      {s.keys.split(' + ').map((k, i) => (
                        <kbd
                          key={`${s.keys}-${i}`}
                          className="px-1.5 py-0.5 rounded-md bg-white border border-gray-300 shadow-[0_1px_0_rgba(0,0,0,.12)] text-[10px] font-bold text-gray-700 font-mono"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">مصممة للعمل بسرعة في الطباعة والمسح</span>
          <button
            onClick={onClose}
            className="btn-pop px-4 py-1.5 rounded-lg text-xs font-bold text-white btn-primary-grad"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
