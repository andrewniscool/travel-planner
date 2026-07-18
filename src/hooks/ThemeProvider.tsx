import React, { useEffect, useMemo, useState } from 'react';
import { ThemeContext, type ThemeMode } from './themeContext';

const THEME_STORAGE_KEY = 'travel-builder:theme';

const getInitialTheme = (): ThemeMode => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch {
    // Ignore storage failures and fall through to the system preference.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme still applies for the current session when storage is unavailable.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === 'dark',
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
