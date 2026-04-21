'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'green' | 'blue' | 'amber' | 'purple' | 'r2d';

export interface ThemeConfig {
  name: string;
  sidebar: string;
  sidebarBorder: string;
  sidebarBottom: string;
  accent: string;
  accentHover: string;
  accentText: string;
  navText: string;
  logo: string;
  light?: boolean;
}

export const themes: Record<Theme, ThemeConfig> = {
  green: {
    name: 'Forest Green',
    sidebar: '#013d1a',
    sidebarBorder: '#025c27',
    sidebarBottom: '#013215',
    accent: '#01ae42',
    accentHover: 'rgba(255,255,255,0.05)',
    accentText: '#fff',
    navText: '#86efac',
    logo: '#01ae42',
  },
  blue: {
    name: 'Midnight Blue',
    sidebar: '#0f1f3d',
    sidebarBorder: '#1e3a6e',
    sidebarBottom: '#0a1628',
    accent: '#3b82f6',
    accentHover: 'rgba(255,255,255,0.05)',
    accentText: '#fff',
    navText: '#93c5fd',
    logo: '#3b82f6',
  },
  amber: {
    name: 'Charcoal & Amber',
    sidebar: '#1c1c1e',
    sidebarBorder: '#2c2c2e',
    sidebarBottom: '#111113',
    accent: '#f59e0b',
    accentHover: 'rgba(255,255,255,0.05)',
    accentText: '#1c1c1e',
    navText: '#fcd34d',
    logo: '#f59e0b',
  },
  purple: {
    name: 'Deep Purple',
    sidebar: '#1e1040',
    sidebarBorder: '#3b1f7a',
    sidebarBottom: '#150b30',
    accent: '#a855f7',
    accentHover: 'rgba(255,255,255,0.05)',
    accentText: '#fff',
    navText: '#d8b4fe',
    logo: '#a855f7',
  },
  r2d: {
    name: 'Right2Drive Light',
    sidebar: '#ffffff',
    sidebarBorder: '#e2e8f0',
    sidebarBottom: '#f8fafc',
    accent: '#16a34a',
    accentHover: 'rgba(22,163,74,0.08)',
    accentText: '#fff',
    navText: '#475569',
    logo: '#16a34a',
    light: true,
  },
};

interface ThemeContextType {
  theme: Theme;
  config: ThemeConfig;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'green',
  config: themes.green,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('green');

  useEffect(() => {
    const saved = localStorage.getItem('rentpro-theme') as Theme;
    if (saved && themes[saved]) setThemeState(saved);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('rentpro-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, config: themes[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
