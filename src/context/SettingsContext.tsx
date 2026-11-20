import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppFont = 'tahoma' | 'cairo' | 'kufi';
export type AppTheme = 'navy' | 'amber' | 'aqua' | 'petrol';

export interface FontOption {
  id: AppFont;
  label: string;
  family: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'tahoma',
    label: 'Tahoma — تاهوما (الافتراضي)',
    family: 'Tahoma, "Segoe UI", system-ui, -apple-system, sans-serif',
    description: 'الخط الافتراضي لويندوز، أوضح الخطوط العربية في الواجهات الكثيفة',
  },
  {
    id: 'cairo',
    label: 'Cairo — كايرو',
    family: "'Cairo', Tahoma, system-ui, sans-serif",
    description: 'خط عربي هندسي عصري مريح للقراءة، مناسب للعناوين والأزرار',
  },
  {
    id: 'kufi',
    label: 'Noto Kufi Arabic — نوتو كوفي',
    family: "'Noto Kufi Arabic', 'Cairo', Tahoma, sans-serif",
    description: 'خط كوفي حديث بحروف مربعة، يعطي طابعاً تقنياً واحترافياً',
  },
];

export interface ThemeOption {
  id: AppTheme;
  label: string;
  description: string;
  /** ألوان المعاينة المصغرة للثيم */
  preview: string[];
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'navy',
    label: 'أزرق وكحلي (الافتراضي)',
    description: 'جريدانت كحلي غامق مع أزرق ملكي ولمسات سماوية',
    preview: ['#050b1c', '#0b2352', '#16357f', '#1e40af'],
  },
  {
    id: 'amber',
    label: 'كهرماني في برتقالي',
    description: 'تدرّج دافئ من الكهرماني الذهبي إلى البرتقالي المحروق',
    preview: ['#1a0f05', '#4a2208', '#92400e', '#c2410c'],
  },
  {
    id: 'aqua',
    label: 'سماوي مائي',
    description: 'أزرق سماوي منعش بتدرجات الفيروز والتركواز',
    preview: ['#03191f', '#064e5c', '#0e7490', '#0891b2'],
  },
  {
    id: 'petrol',
    label: 'أزرق بترولي',
    description: 'أخضر مائل للأزرق عميق وهادئ (Petrol / Teal)',
    preview: ['#041c1a', '#0b3b36', '#115e59', '#0f766e'],
  },
];

interface SettingsState {
  font: AppFont;
  theme: AppTheme;
  uiScale: number;
  installed: boolean;
}

interface SettingsContextValue extends SettingsState {
  fontFamily: string;
  setFont: (font: AppFont) => void;
  setTheme: (theme: AppTheme) => void;
  setUiScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setInstalled: (installed: boolean) => void;
  resetAppearance: () => void;
}

const STORAGE_KEY = 'smartprint.settings.v1';

const DEFAULT_SETTINGS: SettingsState = {
  font: 'tahoma',
  theme: 'navy',
  uiScale: 1,
  installed: false,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      uiScale:
        typeof parsed.uiScale === 'number'
          ? Math.min(1.3, Math.max(0.8, parsed.uiScale))
          : 1,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(readSettings);

  const fontFamily = useMemo(
    () => FONT_OPTIONS.find((f) => f.id === settings.font)?.family ?? FONT_OPTIONS[0].family,
    [settings.font]
  );

  // تطبيق الثيم والخط على جذر المستند
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--app-font', fontFamily);
    document.body.style.fontFamily = fontFamily;
  }, [settings.theme, fontFamily]);

  // حفظ الإعدادات
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const update = useCallback((patch: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setFont = useCallback((font: AppFont) => update({ font }), [update]);
  const setTheme = useCallback((theme: AppTheme) => update({ theme }), [update]);
  const setUiScale = useCallback(
    (uiScale: number) => update({ uiScale: Math.min(1.3, Math.max(0.8, Number(uiScale.toFixed(2)))) }),
    [update]
  );
  const zoomIn = useCallback(
    () => setSettings((p) => ({ ...p, uiScale: Math.min(1.3, Number((p.uiScale + 0.1).toFixed(2))) })),
    []
  );
  const zoomOut = useCallback(
    () => setSettings((p) => ({ ...p, uiScale: Math.max(0.8, Number((p.uiScale - 0.1).toFixed(2))) })),
    []
  );
  const resetZoom = useCallback(() => update({ uiScale: 1 }), [update]);
  const setInstalled = useCallback((installed: boolean) => update({ installed }), [update]);
  const resetAppearance = useCallback(
    () => update({ font: DEFAULT_SETTINGS.font, theme: DEFAULT_SETTINGS.theme, uiScale: 1 }),
    [update]
  );

  const value: SettingsContextValue = {
    ...settings,
    fontFamily,
    setFont,
    setTheme,
    setUiScale,
    zoomIn,
    zoomOut,
    resetZoom,
    setInstalled,
    resetAppearance,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
