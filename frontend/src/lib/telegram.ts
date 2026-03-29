/**
 * Telegram Mini App Helpers
 * Utility functions for Telegram WebApp integration
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          enable: () => void;
          disable: () => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: 'light' | 'dark';
        viewportHeight: number;
        viewportStableHeight: number;
        isExpanded: boolean;
        platform: string;
        version: string;
      };
    };
  }
}

/**
 * Check if running inside Telegram Mini App
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp);
}

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * Get Telegram initData string for backend auth
 */
export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
}

/**
 * Get start parameter from deep link
 * e.g., t.me/bot?startapp=market_123 -> "market_123"
 */
export function getTelegramStartParam(): string | undefined {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.start_param;
}

/**
 * Get Telegram user info
 */
export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

/**
 * Get Telegram color scheme
 */
export function getTelegramColorScheme(): 'light' | 'dark' {
  const tg = getTelegramWebApp();
  return tg?.colorScheme || 'light';
}

/**
 * Get Telegram theme params
 */
export function getTelegramThemeParams() {
  const tg = getTelegramWebApp();
  return tg?.themeParams || {};
}

/**
 * Initialize Telegram WebApp
 */
export function initTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

/**
 * Show Telegram MainButton
 */
export function showTelegramMainButton(text: string, onClick: () => void) {
  const tg = getTelegramWebApp();
  if (tg?.MainButton) {
    tg.MainButton.text = text;
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  }
}

/**
 * Hide Telegram MainButton
 */
export function hideTelegramMainButton() {
  const tg = getTelegramWebApp();
  if (tg?.MainButton) {
    tg.MainButton.hide();
  }
}

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;
  
  switch (type) {
    case 'light':
    case 'medium':
    case 'heavy':
      tg.HapticFeedback.impactOccurred(type);
      break;
    case 'success':
    case 'error':
    case 'warning':
      tg.HapticFeedback.notificationOccurred(type);
      break;
  }
}

/**
 * Close Telegram Mini App
 */
export function closeTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.close();
  }
}

/**
 * Generate share URL for Telegram
 */
export function getTelegramShareUrl(botUsername: string, type: 'market' | 'duel' | 'ref', id: string): string {
  const param = `${type}_${id}`;
  return `https://t.me/${botUsername}?startapp=${param}`;
}

/**
 * Parse start param to get type and id
 */
export function parseStartParam(startParam: string): { type: string; id: string } | null {
  if (!startParam) return null;
  
  const parts = startParam.split('_');
  if (parts.length < 2) return null;
  
  return {
    type: parts[0],
    id: parts.slice(1).join('_'),
  };
}
