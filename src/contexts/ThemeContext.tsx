'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to light mode only - dark mode will be added in future
  const [theme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always use light mode
    localStorage.setItem('theme', 'light');
  }, []);

  // Apply theme class to document (always light)
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('dark');
    }
  }, [mounted]);

  // These are no-ops for now but kept for API compatibility
  const toggleTheme = useCallback(() => {
    // No-op - dark mode disabled for now
  }, []);

  const setTheme = useCallback(() => {
    // No-op - dark mode disabled for now
  }, []);

  // Prevent flash
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
