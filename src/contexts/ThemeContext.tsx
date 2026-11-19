import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

type GlobalTheme = Record<string, string>;
const globalThemeKeys = [
  'primary', 'primaryForeground', 'background', 'foreground', 'card', 'border',
  'darkBackground', 'darkForeground', 'darkCard', 'darkBorder', 'radius', 'font',
];

const parseGlobalTheme = (value: unknown): GlobalTheme => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([key, setting]) =>
      globalThemeKeys.includes(key) && typeof setting === 'string'
    )
  );
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [globalTheme, setGlobalTheme] = useState<GlobalTheme>({});

  useEffect(() => {
    let active = true;
    supabase
      .from('repair_page_settings')
      .select('setting_value')
      .eq('setting_key', 'global_theme')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load global theme settings:', error);
          return;
        }
        if (!active || !data?.setting_value) return;
        try {
          const parsed: unknown = JSON.parse(data.setting_value);
          setGlobalTheme(parseGlobalTheme(parsed));
        } catch (error) {
          console.error('Invalid global theme settings:', error);
        }
      });

    const handleThemeUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      setGlobalTheme(parseGlobalTheme(event.detail));
    };
    window.addEventListener('global-theme-updated', handleThemeUpdate);

    return () => {
      active = false;
      window.removeEventListener('global-theme-updated', handleThemeUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    const root = document.documentElement;
    const hsl = (value: string | undefined) =>
      value && /^\d{1,3}(?:\.\d+)?\s+\d{1,3}%\s+\d{1,3}%$/.test(value);
    const setHsl = (property: string, value: string | undefined) => {
      if (hsl(value)) root.style.setProperty(property, value);
    };

    setHsl('--primary', globalTheme.primary);
    setHsl('--primary-foreground', globalTheme.primaryForeground);
    setHsl('--background', isDark ? globalTheme.darkBackground : globalTheme.background);
    setHsl('--foreground', isDark ? globalTheme.darkForeground : globalTheme.foreground);
    setHsl('--card', isDark ? globalTheme.darkCard : globalTheme.card);
    setHsl('--border', isDark ? globalTheme.darkBorder : globalTheme.border);
    if (globalTheme.radius && /^(?:0|[0-9]+(?:\.[0-9]+)?)(?:rem|px)$/.test(globalTheme.radius)) {
      root.style.setProperty('--radius', globalTheme.radius);
    }
    if (globalTheme.font === 'Cairo' || globalTheme.font === 'Manrope') {
      root.style.fontFamily = `'${globalTheme.font}', 'Cairo', 'Manrope', sans-serif`;
    }
  }, [globalTheme, isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
