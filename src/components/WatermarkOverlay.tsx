import React from 'react';
import { Printer } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

/** العلامة المائية + الترويسة + رقم الصفحة — تُرسم داخل الورقة في المعاينة */
export const WatermarkOverlay: React.FC<{
  sheetLabel?: string;
  compact?: boolean;
}> = ({ sheetLabel, compact = false }) => {
  const { watermark, signature } = useWorkspace();
  if (!watermark.enabled) return null;

  const opacity = Math.min(0.6, Math.max(0.05, watermark.opacity));

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-sm">
      {/* العلامة المائية */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          watermark.position === 'diagonal' ? '-rotate-[24deg]' : ''
        }`}
        style={{
          alignItems: watermark.position === 'bottom' ? 'flex-end' : 'center',
          paddingBottom: watermark.position === 'bottom' ? 26 : 0,
        }}
      >
        <span
          className="font-black text-gray-900 tracking-widest whitespace-nowrap text-center"
          style={{ opacity, fontSize: compact ? watermark.fontSize * 0.8 : watermark.fontSize }}
        >
          {watermark.text}
        </span>
      </div>

      {/* الترويسة: اللوجو */}
      {watermark.showLogo && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-70">
          <span className="w-4 h-4 rounded bg-[var(--t-primary)] text-white flex items-center justify-center">
            <Printer className="w-2.5 h-2.5" />
          </span>
          <span className="text-[7px] font-black text-gray-600 tracking-wide">PRO SALES</span>
        </div>
      )}

      {/* توقيع إلكتروني محفوظ */}
      {signature && (
        <img
          src={signature.dataUrl}
          alt="توقيع"
          className="absolute bottom-1.5 right-2 h-6 object-contain opacity-80"
        />
      )}

      {/* رقم الصفحة */}
      {watermark.showPageNumber && (
        <div className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-mono text-gray-500/90">
          {sheetLabel ?? 'صفحة'}
        </div>
      )}
    </div>
  );
};
