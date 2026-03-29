'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  isTelegramWebApp,
  getTelegramInitData,
  getTelegramStartParam,
  getTelegramWebApp,
  getTelegramUser,
  parseStartParam,
  initTelegramWebApp,
} from '@/lib/telegram';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN_KEY = 'arenaToken';
const USER_KEY = 'arenaUser';
const TG_MODE_KEY = 'arenaTgMode';

export interface TelegramAuthResult {
  token: string;
  user: {
    id: string;
    telegramId: string;
    telegramUsername?: string;
    telegramFirstName?: string;
    telegramPhotoUrl?: string;
    authProvider: 'telegram';
    referredBy?: string;
  };
}

/**
 * Hook for Telegram Mini App authentication and routing
 */
export function useTelegramAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramAuthResult['user'] | null>(null);

  const authenticate = useCallback(async () => {
    try {
      const tgMode = isTelegramWebApp();
      setIsTelegram(tgMode);

      if (!tgMode) {
        // Not in Telegram, skip
        setDone(true);
        setLoading(false);
        return;
      }

      // Initialize Telegram WebApp
      const tg = getTelegramWebApp();
      if (tg) {
        initTelegramWebApp();
      }

      const initData = getTelegramInitData();
      const startParam = getTelegramStartParam();

      if (!initData) {
        // No initData, can't authenticate
        console.warn('No Telegram initData available');
        setDone(true);
        setLoading(false);
        return;
      }

      // Authenticate with backend
      const res = await fetch(`${API_BASE}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, startParam }),
      });

      const json = await res.json();

      if (json?.success || json?.token || json?.data?.token) {
        const token = json.token || json.data?.token;
        const userData = json.user || json.data?.user;

        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          localStorage.setItem(TG_MODE_KEY, 'true');
        }

        setUser(userData);

        // Handle deep link routing
        if (startParam) {
          const parsed = parseStartParam(startParam);
          if (parsed) {
            switch (parsed.type) {
              case 'market':
                router.push(`/arena/${parsed.id}`);
                break;
              case 'duel':
                router.push(`/arena?tab=duels&duel=${parsed.id}`);
                break;
              case 'ref':
                // Referral handled by backend
                break;
              default:
                break;
            }
          }
        }
      } else {
        console.error('Telegram auth failed:', json.error || 'Unknown error');
        setError(json.error || 'Authentication failed');
      }
    } catch (e) {
      console.error('Telegram auth error:', e);
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setDone(true);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return {
    isTelegram,
    loading,
    done,
    error,
    user,
    telegramUser: isTelegram ? getTelegramUser() : null,
  };
}

/**
 * Check if app is in Telegram mode
 */
export function useIsTelegramMode(): boolean {
  const [isTgMode, setIsTgMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TG_MODE_KEY);
      setIsTgMode(stored === 'true' || isTelegramWebApp());
    }
  }, []);

  return isTgMode;
}

export default useTelegramAuth;
