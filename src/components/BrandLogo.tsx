import React from 'react';
import brandLogo from '../assets/pro-sales-logo.png';
import brandLogoSm from '../assets/pro-sales-logo-sm.png';

/**
 * لوجو «PRO SALES» الرسمي المرفق من المستخدم (PNG بخلفية شفافة).
 * يُستخدم في الهيدر الرئيسي وشاشة الترحيب وشاشة التثبيت.
 */
export const BrandLogo: React.FC<{
  /** ارتفاع اللوجو بالبكسل */
  height?: number | string;
  className?: string;
  /** ظل وهالة خلفية لزيادة الوضوح على الخلفيات الغامقة */
  glow?: boolean;
  /** استخدام النسخة الصغيرة الأخف للهيدر */
  compact?: boolean;
  alt?: string;
}> = ({ height = 44, className = '', glow = false, compact = false, alt = 'PRO SALES' }) => {
  const h = typeof height === 'number' ? `${height}px` : height;
  return (
    <img
      src={compact ? brandLogoSm : brandLogo}
      alt={alt}
      draggable={false}
      className={`select-none object-contain ${className}`}
      style={{
        height: h,
        width: 'auto',
        filter: glow
          ? 'drop-shadow(0 4px 10px rgba(0,0,0,.45)) drop-shadow(0 0 14px rgba(255,255,255,.20))'
          : 'drop-shadow(0 2px 6px rgba(0,0,0,.35))',
      }}
    />
  );
};

export const BRAND_LOGO_SRC = brandLogo;
