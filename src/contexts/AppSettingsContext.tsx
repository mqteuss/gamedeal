import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
type ViewMode = 'grid' | 'list';

interface AppSettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('gdc-theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('gdc-view-mode');
    return (stored === 'grid' || stored === 'list') ? stored : 'grid';
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('gdc-theme', t);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const setViewMode = (m: ViewMode) => {
    setViewModeState(m);
    localStorage.setItem('gdc-view-mode', m);
  };

  const toggleViewMode = () => setViewMode(viewMode === 'grid' ? 'list' : 'grid');

  // Aplica classe no <html> para Tailwind
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  return (
    <AppSettingsContext.Provider value={{ theme, setTheme, toggleTheme, viewMode, setViewMode, toggleViewMode }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
};
