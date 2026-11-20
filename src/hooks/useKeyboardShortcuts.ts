import { useEffect } from 'react';

export interface ShortcutHandlers {
  onPrint?: () => void;
  onAddFiles?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onTabChange?: (tab: 'print' | 'scanner') => void;
  onEscape?: () => void;
  onScannerTab?: () => void;
  onQueue?: () => void;
  onStock?: () => void;
  onSignature?: () => void;
  onPdfTools?: () => void;
  onImageCompressor?: () => void;
  onDiff?: () => void;
  onActivation?: () => void;
  enabled?: boolean;
}

/** اختصارات لوحة المفاتيح العامة للبرنامج */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    if (handlers.enabled === false) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;

      const mod = e.ctrlKey || e.metaKey;

      // Escape يعمل دائماً
      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      if (isTyping && e.key !== 'F1') return;

      if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlers.onPrint?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handlers.onAddFiles?.();
        return;
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        handlers.onSettings?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handlers.onQueue?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onStock?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handlers.onSignature?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handlers.onPdfTools?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handlers.onDiff?.();
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handlers.onImageCompressor?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handlers.onActivation?.();
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handlers.onZoomIn?.();
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handlers.onZoomOut?.();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        handlers.onZoomReset?.();
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        handlers.onHelp?.();
        return;
      }
      if (e.key.toLowerCase() === 's' && !mod) {
        handlers.onScannerTab?.();
        return;
      }
      if (e.key.toLowerCase() === 'b' && !mod) {
        handlers.onTabChange?.('print');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}

export const SHORTCUT_LIST: { keys: string; label: string; group: string }[] = [
  { keys: 'Ctrl + P', label: 'بدء الطباعة', group: 'الطباعة' },
  { keys: 'Ctrl + O', label: 'إضافة ملفات', group: 'الطباعة' },
  { keys: 'Ctrl + Q', label: 'طابور الطباعة', group: 'الطباعة' },
  { keys: 'Ctrl + K', label: 'المخزون والأحبار', group: 'المخزون' },
  { keys: 'Ctrl + E', label: 'التوقيع الإلكتروني', group: 'الاسكانر' },
  { keys: 'Ctrl + M', label: 'أدوات PDF (دمج / تقسيم / ترتيب)', group: 'المستندات' },
  { keys: 'Ctrl + D', label: 'مقارنة A/B بين مستندين', group: 'المستندات' },
  { keys: 'Ctrl + Shift + I', label: 'ضغط الصور لتوفير الحبر', group: 'المستندات' },
  { keys: 'Ctrl + L', label: 'تفعيل البرنامج / الترخيص', group: 'النظام' },
  { keys: 'Ctrl + ,', label: 'إعدادات البرنامج', group: 'النظام' },
  { keys: '+ / -', label: 'تكبير / تصغير الواجهة', group: 'النظام' },
  { keys: '0', label: 'إعادة الحجم 100%', group: 'النظام' },
  { keys: 'S', label: 'الانتقال لتبويب الاسكانر', group: 'التنقل' },
  { keys: 'B', label: 'الانتقال لتبويب الطباعة', group: 'التنقل' },
  { keys: 'Esc', label: 'إغلاق النافذة الحالية', group: 'التنقل' },
  { keys: 'F1', label: 'لوحة الاختصارات', group: 'النظام' },
];
