'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { WalletAPI, PositionsAPI, NotificationsAPI } from './arena';
import { connectSocket, disconnectSocket, getSocket, getNotificationsSocket, subscribeToEvents } from '../ws';
import { toast } from 'react-toastify';

interface ArenaContextType {
  // Wallet state (no more demo)
  isConnected: boolean;
  currentWallet: string | null;
  
  // Balance
  balance: number;
  
  // Positions
  positions: any[];
  positionsLoading: boolean;
  
  // Notifications
  unreadCount: number;
  
  // Real-time
  lastNotification: any | null;
  
  // Actions
  connectWallet: (wallet: string) => void;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setBalance: (b: number) => void;
}

const ArenaContext = createContext<ArenaContextType | null>(null);

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const wsConnected = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== 'undefined') {
        const wallet = localStorage.getItem('arenaWallet');
        const token = localStorage.getItem('arenaToken');
        if (wallet && token) {
          setIsConnected(true);
          setCurrentWallet(wallet);
        }
      }
    };
    
    checkWallet();
  }, []);

  // Connect wallet
  const connectWallet = useCallback((wallet: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('arenaWallet', wallet);
      setIsConnected(true);
      setCurrentWallet(wallet);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arenaWallet');
      localStorage.removeItem('arenaToken');
    }
    disconnectSocket();
    wsConnected.current = false;
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsConnected(false);
    setCurrentWallet(null);
    setBalance(0);
    setPositions([]);
    setUnreadCount(0);
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    const result = await WalletAPI.getBalance();
    if (result) {
      setBalance(result.balanceUsdt);
    }
  }, []);

  // Refresh positions
  const refreshPositions = useCallback(async () => {
    setPositionsLoading(true);
    try {
      const result = await PositionsAPI.getMyPositions({ limit: 50 });
      setPositions(result.data);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    const count = await NotificationsAPI.getUnreadCount();
    setUnreadCount(count);
  }, []);

  // WebSocket connection with real-time handlers
  useEffect(() => {
    const wallet = currentWallet || (typeof window !== 'undefined' ? localStorage.getItem('arenaWallet') : null);
    
    if (wallet && !wsConnected.current) {
      const socket = connectSocket(wallet);
      wsConnected.current = true;

      // Subscribe to real-time events
      cleanupRef.current = subscribeToEvents({
        // Live balance updates
        onBalanceUpdate: (data) => {
          setBalance(data.balance);
          
          const changeText = data.change > 0 
            ? `+$${data.change.toFixed(2)}` 
            : `-$${Math.abs(data.change).toFixed(2)}`;
          
          if (data.change > 0) {
            toast.success(`Balance: ${changeText} (${data.reason})`, {
              position: 'bottom-right',
              autoClose: 3000,
            });
          } else if (data.change < 0) {
            toast.info(`Balance: ${changeText} (${data.reason})`, {
              position: 'bottom-right',
              autoClose: 2000,
            });
          }
        },

        // Notification handler
        onNotification: (data) => {
          setUnreadCount(prev => prev + 1);
          setLastNotification(data);
          
          const notifType = data.type;
          if (notifType === 'POSITION_WON') {
            toast.success(`You won! +$${data.data?.payout || 0}`, {
              position: 'top-right',
              autoClose: 5000,
            });
          } else if (notifType === 'DUEL_INVITE') {
            toast.info('New duel invitation!', {
              position: 'top-right',
              autoClose: 5000,
            });
          } else if (notifType === 'XP_EARNED') {
            toast.success(`+${data.data?.amount || 0} XP earned!`, {
              position: 'bottom-right',
              autoClose: 3000,
            });
          }
        },

        // Position won
        onPositionWon: (data) => {
          refreshPositions();
          refreshBalance();
        },

        // Position lost
        onPositionLost: (data) => {
          refreshPositions();
        },

        // Duel events
        onDuelAccepted: (data) => {
          toast.info('Your duel was accepted!', {
            position: 'top-right',
            autoClose: 4000,
          });
        },

        onDuelResult: (data) => {
          if (data.won) {
            toast.success(`Duel won! +$${data.winnings}`, {
              position: 'top-right',
              autoClose: 5000,
            });
          } else {
            toast.info('Duel finished - better luck next time!', {
              position: 'top-right',
              autoClose: 4000,
            });
          }
          refreshBalance();
        },
      });

      // Also handle notifications socket events
      const notifSocket = getNotificationsSocket();
      if (notifSocket) {
        notifSocket.on('notification:new', (data: any) => {
          setUnreadCount(prev => prev + 1);
          setLastNotification(data);
        });

        notifSocket.on('balance:update', (data: { balance: number }) => {
          setBalance(data.balance);
        });

        notifSocket.on('notification:unread-count', (data: { count: number }) => {
          setUnreadCount(data.count);
        });
      }
    }

    return () => {
      // Don't disconnect on unmount — keep connection alive
    };
  }, [currentWallet, refreshBalance, refreshPositions]);

  // Auto-refresh when user is authenticated
  useEffect(() => {
    if (isConnected) {
      refreshPositions();
      refreshNotifications();
      
      const interval = setInterval(() => {
        refreshBalance();
        refreshPositions();
        refreshNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, refreshBalance, refreshPositions, refreshNotifications]);

  return (
    <ArenaContext.Provider
      value={{
        isConnected,
        currentWallet,
        balance,
        positions,
        positionsLoading,
        unreadCount,
        lastNotification,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        refreshPositions,
        refreshNotifications,
        setBalance,
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
}

export function useArena() {
  const context = useContext(ArenaContext);
  if (!context) {
    throw new Error('useArena must be used within ArenaProvider');
  }
  return context;
}

export default ArenaContext;
