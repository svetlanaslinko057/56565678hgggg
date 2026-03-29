/**
 * Theme System for FOMO Arena
 * Light and Dark theme support
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgNav: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  
  // Status colors
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  
  // Border
  border: string;
  borderLight: string;
  
  // Logo filter (for SVG)
  logoFilter: string;
}

export const lightTheme: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f7',
  bgTertiary: '#e8e8ed',
  bgCard: '#ffffff',
  bgNav: '#ffffff',
  
  textPrimary: '#070B35',
  textSecondary: '#4a4a6a',
  textMuted: '#8e8ea0',
  
  accent: '#00cc66',
  accentHover: '#00b359',
  
  success: '#00cc66',
  successBg: 'rgba(0, 204, 102, 0.1)',
  danger: '#ff4d4f',
  dangerBg: 'rgba(255, 77, 79, 0.1)',
  warning: '#ffa500',
  warningBg: 'rgba(255, 165, 0, 0.1)',
  
  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.05)',
  
  logoFilter: 'none',
};

export const darkTheme: ThemeColors = {
  bgPrimary: '#0a0a0f',
  bgSecondary: '#12121a',
  bgTertiary: '#1a1a24',
  bgCard: 'rgba(255, 255, 255, 0.05)',
  bgNav: '#12121a',
  
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  
  accent: '#00ff88',
  accentHover: '#00cc66',
  
  success: '#00ff88',
  successBg: 'rgba(0, 255, 136, 0.1)',
  danger: '#ff4d4f',
  dangerBg: 'rgba(255, 77, 79, 0.1)',
  warning: '#ffa500',
  warningBg: 'rgba(255, 165, 0, 0.1)',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  logoFilter: 'invert(1) brightness(2)',
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// CSS variables generator
export const generateCSSVariables = (theme: ThemeColors): string => {
  return `
    --bg-primary: ${theme.bgPrimary};
    --bg-secondary: ${theme.bgSecondary};
    --bg-tertiary: ${theme.bgTertiary};
    --bg-card: ${theme.bgCard};
    --bg-nav: ${theme.bgNav};
    --text-primary: ${theme.textPrimary};
    --text-secondary: ${theme.textSecondary};
    --text-muted: ${theme.textMuted};
    --accent: ${theme.accent};
    --accent-hover: ${theme.accentHover};
    --success: ${theme.success};
    --success-bg: ${theme.successBg};
    --danger: ${theme.danger};
    --danger-bg: ${theme.dangerBg};
    --warning: ${theme.warning};
    --warning-bg: ${theme.warningBg};
    --border: ${theme.border};
    --border-light: ${theme.borderLight};
    --logo-filter: ${theme.logoFilter};
  `;
};
