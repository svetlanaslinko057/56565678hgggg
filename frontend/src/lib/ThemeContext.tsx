'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, getTheme, generateCSSVariables, ThemeColors } from './theme';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'fomo-arena-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setMode(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Save theme to localStorage
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // Apply CSS variables to document
      const theme = getTheme(mode);
      const root = document.documentElement;
      
      root.style.setProperty('--bg-primary', theme.bgPrimary);
      root.style.setProperty('--bg-secondary', theme.bgSecondary);
      root.style.setProperty('--bg-tertiary', theme.bgTertiary);
      root.style.setProperty('--bg-card', theme.bgCard);
      root.style.setProperty('--bg-nav', theme.bgNav);
      root.style.setProperty('--text-primary', theme.textPrimary);
      root.style.setProperty('--text-secondary', theme.textSecondary);
      root.style.setProperty('--text-muted', theme.textMuted);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--accent-hover', theme.accentHover);
      root.style.setProperty('--success', theme.success);
      root.style.setProperty('--success-bg', theme.successBg);
      root.style.setProperty('--danger', theme.danger);
      root.style.setProperty('--danger-bg', theme.dangerBg);
      root.style.setProperty('--warning', theme.warning);
      root.style.setProperty('--warning-bg', theme.warningBg);
      root.style.setProperty('--border', theme.border);
      root.style.setProperty('--border-light', theme.borderLight);
      root.style.setProperty('--logo-filter', theme.logoFilter);
      
      // Set body background
      document.body.style.backgroundColor = theme.bgPrimary;
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = getTheme(mode);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setTheme }}>
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
