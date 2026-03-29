/**
 * WebSocket client for FOMO Arena real-time events
 * Connects to /arena namespace on the backend
 * 
 * BLOCK 1 & 2: Real-time notifications + Live balance updates
 */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let notificationsSocket: Socket | null = null;

const getApiBase = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  // Remove trailing /api if present
  return url.replace(/\/api$/, '').replace(/\/$/, '');
};

/**
 * Connect to /arena namespace for real-time events
 * Uses polling first, then upgrades to WebSocket
 */
export function connectSocket(wallet: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const base = getApiBase();
  
  // Connect to /arena namespace with path for backend routing
  socket = io(`${base}`, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    query: { wallet },
  });

  socket.on('connect', () => {
    console.log('[WS Arena] Connected:', socket?.id);
    socket?.emit('subscribe', { wallet });
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS Arena] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[WS Arena] Connection error:', err.message);
  });

  // Also connect to notifications namespace for backward compatibility
  notificationsSocket = io(`${base}/notifications`, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    autoConnect: true,
    query: { wallet },
  });

  notificationsSocket.on('connect', () => {
    console.log('[WS Notifications] Connected:', notificationsSocket?.id);
    notificationsSocket?.emit('subscribe', { wallet });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (notificationsSocket) {
    notificationsSocket.disconnect();
    notificationsSocket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function getNotificationsSocket(): Socket | null {
  return notificationsSocket;
}

/**
 * Subscribe to real-time events
 * Returns cleanup function
 */
export function subscribeToEvents(handlers: {
  onNotification?: (data: any) => void;
  onBalanceUpdate?: (data: { balance: number; change: number; reason: string }) => void;
  onBetPlaced?: (data: any) => void;
  onPositionWon?: (data: any) => void;
  onPositionLost?: (data: any) => void;
  onDuelInvite?: (data: any) => void;
  onDuelAccepted?: (data: any) => void;
  onDuelResult?: (data: any) => void;
  onXpEarned?: (data: any) => void;
  onMarketResolved?: (data: any) => void;
  onActivity?: (data: any) => void;
}): () => void {
  if (!socket) return () => {};

  // Universal notification handler
  if (handlers.onNotification) {
    socket.on('notification', handlers.onNotification);
  }

  // Balance update handler (BLOCK 2)
  if (handlers.onBalanceUpdate) {
    socket.on('BALANCE_UPDATE', handlers.onBalanceUpdate);
  }

  // Event-specific handlers
  if (handlers.onBetPlaced) {
    socket.on('notification', (data: any) => {
      if (data.type === 'BET_PLACED') handlers.onBetPlaced!(data.data);
    });
  }

  if (handlers.onPositionWon) {
    socket.on('notification', (data: any) => {
      if (data.type === 'POSITION_WON') handlers.onPositionWon!(data.data);
    });
  }

  if (handlers.onPositionLost) {
    socket.on('notification', (data: any) => {
      if (data.type === 'POSITION_LOST') handlers.onPositionLost!(data.data);
    });
  }

  if (handlers.onDuelInvite) {
    socket.on('notification', (data: any) => {
      if (data.type === 'DUEL_INVITE') handlers.onDuelInvite!(data.data);
    });
  }

  if (handlers.onDuelAccepted) {
    socket.on('notification', (data: any) => {
      if (data.type === 'DUEL_ACCEPTED') handlers.onDuelAccepted!(data.data);
    });
  }

  if (handlers.onDuelResult) {
    socket.on('notification', (data: any) => {
      if (data.type === 'DUEL_RESULT') handlers.onDuelResult!(data.data);
    });
  }

  if (handlers.onXpEarned) {
    socket.on('notification', (data: any) => {
      if (data.type === 'XP_EARNED') handlers.onXpEarned!(data.data);
    });
  }

  if (handlers.onMarketResolved) {
    socket.on('MARKET_RESOLVED', handlers.onMarketResolved);
  }

  if (handlers.onActivity) {
    socket.on('activity', handlers.onActivity);
  }

  // Return cleanup function
  return () => {
    if (!socket) return;
    socket.off('notification');
    socket.off('BALANCE_UPDATE');
    socket.off('MARKET_RESOLVED');
    socket.off('activity');
  };
}
