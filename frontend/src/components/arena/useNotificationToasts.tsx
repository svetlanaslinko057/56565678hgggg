'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/arena/ToastProvider';
import { useArena } from '@/lib/api/ArenaContext';
import { getSocket } from '@/lib/ws';

/**
 * Hook to listen for WebSocket notifications and show toasts
 * Should be used in a component inside both ArenaProvider and ToastProvider
 */
export function useNotificationToasts() {
  const { notifyWin, notifyLoss, notifyResolved, notifyBetPlaced, addToast } = useToast();
  const { isConnected, currentWallet } = useArena();

  useEffect(() => {
    if (!isConnected || !currentWallet) return;

    const socket = getSocket();
    if (!socket) return;

    // Listen for new notifications
    const handleNotification = (data: any) => {
      console.log('📬 Notification received:', data);
      
      const type = data.type?.toLowerCase() || '';
      const payload = data.payload || data.data || {};
      
      // Position Won
      if (type.includes('won') || type.includes('win')) {
        const amount = payload.winnings || payload.payout || payload.amount || '0';
        notifyWin(
          'Position Won!',
          `${amount} USDT`,
          payload.marketTitle || data.message
        );
      }
      // Position Lost
      else if (type.includes('lost') || type.includes('loss')) {
        notifyLoss(
          'Position Lost',
          payload.marketTitle || data.message
        );
      }
      // Market Resolved
      else if (type.includes('resolved') || type.includes('resolve')) {
        notifyResolved(
          payload.marketTitle || 'Market',
          payload.outcome || payload.winningOutcome || 'Unknown'
        );
      }
      // Duel events
      else if (type.includes('duel')) {
        if (type.includes('accept')) {
          addToast({
            type: 'success',
            title: 'Duel Accepted',
            message: data.message || 'Your duel was accepted!',
          });
        } else if (type.includes('result')) {
          if (payload.won) {
            notifyWin('Duel Won!', `${payload.winnings} USDT`);
          } else {
            notifyLoss('Duel Lost', 'Better luck next time!');
          }
        } else if (type.includes('request') || type.includes('invite')) {
          addToast({
            type: 'info',
            title: 'New Duel Challenge',
            message: data.message || 'You have a new duel invitation',
          });
        }
      }
      // XP Earned
      else if (type.includes('xp')) {
        addToast({
          type: 'success',
          title: '⭐ XP Earned!',
          message: `+${payload.xpAmount || payload.amount || 10} XP`,
          duration: 3000,
        });
      }
      // Generic notification
      else if (data.title || data.message) {
        addToast({
          type: 'info',
          title: data.title || 'Notification',
          message: data.message,
        });
      }
    };

    // Listen for live activity (new bets)
    const handleActivity = (data: any) => {
      const type = data.type?.toLowerCase() || '';
      
      // Only show for current user's bets
      if (data.user?.toLowerCase() === currentWallet?.toLowerCase()) {
        if (type === 'bet_placed') {
          notifyBetPlaced(
            data.marketTitle || 'Market',
            `${data.amount || '0'} USDT`,
            data.outcome === 0 ? 'YES' : 'NO'
          );
        }
      }
    };

    // Subscribe to events
    socket.on('notification:new', handleNotification);
    socket.on('notification', handleNotification);
    socket.on('activity', handleActivity);
    socket.on('bet:placed', handleActivity);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('notification', handleNotification);
      socket.off('activity', handleActivity);
      socket.off('bet:placed', handleActivity);
    };
  }, [isConnected, currentWallet, notifyWin, notifyLoss, notifyResolved, notifyBetPlaced, addToast]);
}

/**
 * Component that activates notification toasts
 * Place this inside layout after all providers
 */
export function NotificationToastListener() {
  useNotificationToasts();
  return null;
}
