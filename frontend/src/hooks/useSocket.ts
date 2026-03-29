'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWallet } from '@/lib/wagmi';

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Event types from backend
export type SocketEventType = 
  | 'notification'
  | 'notification:new'
  | 'activity'
  | 'BALANCE_UPDATE'
  | 'balance:update'
  | 'BET_PLACED'
  | 'POSITION_WON'
  | 'POSITION_LOST'
  | 'MARKET_RESOLVED'
  | 'odds:update';

export interface BalanceUpdate {
  balance: number;
  change: number;
  reason: string;
  timestamp?: string;
}

export interface ActivityEvent {
  type: string;
  wallet: string;
  marketId?: string;
  marketTitle?: string;
  outcomeLabel?: string;
  stake?: number;
  odds?: number;
  timestamp: string;
}

export interface OddsUpdate {
  marketId: string;
  odds: Record<string, number>;
}

interface UseSocketOptions {
  autoConnect?: boolean;
}

/**
 * useSocket hook - Socket.IO client for real-time updates
 * 
 * Features:
 * - Auto-connect on mount
 * - Auto-subscribe to wallet events
 * - Auth token support
 * - Infinite reconnection
 * - Throttled updates
 */
export function useSocket(options: UseSocketOptions = { autoConnect: true }) {
  const { walletAddress, isConnected: walletConnected, token } = useWallet();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<BalanceUpdate | null>(null);
  const [oddsCache, setOddsCache] = useState<Record<string, Record<string, number>>>({});
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  
  // Throttle refs for odds updates
  const oddsThrottleRef = useRef<Record<string, number>>({});
  const THROTTLE_MS = 300;
  
  // Activity limit
  const MAX_ACTIVITIES = 30;

  // Initialize socket connection
  useEffect(() => {
    if (options.autoConnect === false) return;
    if (!WS_URL) {
      console.warn('[Socket] WebSocket URL not configured');
      return;
    }

    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      // ❗ Infinite reconnection for production
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // ❗ Auth token for wallet identification
      auth: token ? { token } : undefined,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      // console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);
      
      // Auto-subscribe to wallet if connected
      if (walletAddress) {
        newSocket.emit('subscribe', { wallet: walletAddress });
        // console.log('[Socket] Subscribed to wallet:', walletAddress);
      }
    });

    newSocket.on('disconnect', (reason) => {
      // console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // ============ Event Handlers ============

    // Activity feed (broadcast to all) - with flood control
    newSocket.on('activity', (event: ActivityEvent) => {
      setActivities(prev => [event, ...prev.slice(0, MAX_ACTIVITIES - 1)]); // ❗ Hard limit
      notifySubscribers('activity', event);
    });

    // Balance updates (wallet-specific)
    newSocket.on('BALANCE_UPDATE', (update: BalanceUpdate) => {
      setLastBalanceUpdate(update);
      notifySubscribers('balance', update);
    });

    newSocket.on('balance:update', (update: BalanceUpdate) => {
      setLastBalanceUpdate(update);
      notifySubscribers('balance', update);
    });

    // Notifications
    newSocket.on('notification', (event: any) => {
      notifySubscribers('notification', event);
    });

    newSocket.on('notification:new', (event: any) => {
      notifySubscribers('notification', event);
    });

    // Odds updates - with throttling
    newSocket.on('odds:update', (data: OddsUpdate) => {
      const now = Date.now();
      const lastUpdate = oddsThrottleRef.current[data.marketId] || 0;
      
      // ❗ Throttle: ignore updates within THROTTLE_MS
      if (now - lastUpdate < THROTTLE_MS) {
        return;
      }
      oddsThrottleRef.current[data.marketId] = now;
      
      setOddsCache(prev => ({
        ...prev,
        [data.marketId]: data.odds,
      }));
      notifySubscribers('odds', data);
    });

    // Market resolved
    newSocket.on('MARKET_RESOLVED', (data: any) => {
      notifySubscribers('market_resolved', data);
    });

    // Position events
    newSocket.on('BET_PLACED', (data: any) => {
      notifySubscribers('bet_placed', data);
    });

    newSocket.on('POSITION_WON', (data: any) => {
      notifySubscribers('position_won', data);
    });

    newSocket.on('POSITION_LOST', (data: any) => {
      notifySubscribers('position_lost', data);
    });

    setSocket(newSocket);

    return () => {
      if (walletAddress) {
        newSocket.emit('unsubscribe', { wallet: walletAddress });
      }
      newSocket.disconnect();
    };
  }, [options.autoConnect, token]);

  // Reconnect with new auth when token changes
  useEffect(() => {
    if (socket && token) {
      // Update auth and reconnect if needed
      (socket as any).auth = { token };
      if (!socket.connected) {
        socket.connect();
      }
    }
  }, [socket, token]);

  // Subscribe when wallet changes
  useEffect(() => {
    if (socket && connected && walletAddress) {
      socket.emit('subscribe', { wallet: walletAddress });
      // console.log('[Socket] Subscribed to wallet:', walletAddress);
    }
  }, [socket, connected, walletAddress]);

  // Notify subscribers
  const notifySubscribers = useCallback((eventType: string, data: any) => {
    const subscribers = subscribersRef.current.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }, []);

  /**
   * Subscribe to specific events
   */
  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  }, []);

  /**
   * Subscribe to market odds updates
   */
  const subscribeMarket = useCallback((marketId: string) => {
    if (socket && connected) {
      socket.emit('subscribe:market', { marketId });
    }
  }, [socket, connected]);

  /**
   * Unsubscribe from market
   */
  const unsubscribeMarket = useCallback((marketId: string) => {
    if (socket && connected) {
      socket.emit('unsubscribe:market', { marketId });
    }
  }, [socket, connected]);

  /**
   * Get cached odds for a market
   */
  const getOdds = useCallback((marketId: string): Record<string, number> | undefined => {
    return oddsCache[marketId];
  }, [oddsCache]);

  return {
    socket,
    connected,
    activities,
    lastBalanceUpdate,
    oddsCache,
    subscribe,
    subscribeMarket,
    unsubscribeMarket,
    getOdds,
  };
}

/**
 * useLiveOdds - Hook for live odds on a specific market
 */
export function useLiveOdds(marketId: string) {
  const [odds, setOdds] = useState<Record<string, number>>({});
  const { subscribe, connected, getOdds, subscribeMarket, unsubscribeMarket } = useSocket();

  useEffect(() => {
    if (!marketId) return;

    // Get cached odds
    const cached = getOdds(marketId);
    if (cached) setOdds(cached);

    // Subscribe to updates
    subscribeMarket(marketId);

    const unsubscribe = subscribe('odds', (data) => {
      if (data.marketId === marketId) {
        setOdds(data.odds);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeMarket(marketId);
    };
  }, [marketId, subscribe, getOdds, subscribeMarket, unsubscribeMarket]);

  return { odds, isLive: connected };
}

/**
 * useLiveBalance - Hook for real-time balance updates
 */
export function useLiveBalance() {
  const { walletAddress } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [lastChange, setLastChange] = useState<{ amount: number; reason: string } | null>(null);
  const { subscribe, connected } = useSocket();

  useEffect(() => {
    if (!walletAddress) return;

    const unsubscribe = subscribe('balance', (data: BalanceUpdate) => {
      setBalance(data.balance);
      setLastChange({ amount: data.change, reason: data.reason });
    });

    return unsubscribe;
  }, [walletAddress, subscribe]);

  return { balance, lastChange, isLive: connected };
}

/**
 * useLiveActivity - Hook for live activity feed
 */
export function useLiveActivity(limit: number = 10) {
  const { activities, connected } = useSocket();
  
  return { 
    activities: activities.slice(0, limit), 
    isLive: connected 
  };
}

/**
 * useLiveNotifications - Hook for real-time notifications
 */
export function useLiveNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe, connected } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe('notification', (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [subscribe]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAllRead, isLive: connected };
}

export default useSocket;
