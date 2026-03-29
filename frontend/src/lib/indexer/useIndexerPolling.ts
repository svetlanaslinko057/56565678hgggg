'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface TxState {
  status: 'pending' | 'indexed' | 'error' | 'timeout';
  txHash: string;
  position?: {
    tokenId: number;
    marketId: number;
    owner: string;
    outcome: number;
    amount: string;
    status: string;
  };
  error?: string;
}

interface UseIndexerPollingOptions {
  maxAttempts?: number;
  intervalMs?: number;
  onIndexed?: (state: TxState) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to poll indexer for transaction state
 * Waits for a transaction to be indexed after on-chain confirmation
 */
export function useIndexerPolling(options: UseIndexerPollingOptions = {}) {
  const {
    maxAttempts = 30, // 30 attempts * 2s = 60s max
    intervalMs = 2000,
    onIndexed,
    onError,
  } = options;

  const [txState, setTxState] = useState<TxState | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const attemptRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const checkTxState = useCallback(async (txHash: string): Promise<TxState> => {
    try {
      const response = await fetch(`${API_URL}/api/indexer/mirror/tx/${txHash}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const { status, position } = result.data;
        
        if (status === 'indexed' || position) {
          return {
            status: 'indexed',
            txHash,
            position,
          };
        }
      }
      
      return { status: 'pending', txHash };
    } catch (error) {
      console.error('Error checking tx state:', error);
      return { status: 'pending', txHash };
    }
  }, []);

  const startPolling = useCallback(async (txHash: string) => {
    attemptRef.current = 0;
    setIsPolling(true);
    setTxState({ status: 'pending', txHash });

    const poll = async () => {
      attemptRef.current += 1;
      
      const state = await checkTxState(txHash);
      setTxState(state);

      if (state.status === 'indexed') {
        stopPolling();
        onIndexed?.(state);
        return;
      }

      if (attemptRef.current >= maxAttempts) {
        const timeoutState: TxState = {
          status: 'timeout',
          txHash,
          error: 'Transaction indexing timed out. It may still be processing.',
        };
        setTxState(timeoutState);
        stopPolling();
        onError?.('Indexing timeout');
        return;
      }
    };

    // Start polling
    intervalRef.current = setInterval(poll, intervalMs);
    
    // First check immediately
    await poll();
  }, [checkTxState, maxAttempts, intervalMs, stopPolling, onIndexed, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    txState,
    isPolling,
    startPolling,
    stopPolling,
  };
}

/**
 * Get user positions from indexer mirror
 */
export async function getUserPositions(walletAddress: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/onchain/positions?owner=${walletAddress.toLowerCase()}`
    );
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

/**
 * Get claimable positions for a user
 */
export async function getClaimablePositions(walletAddress: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/indexer/mirror/positions/claimable/${walletAddress.toLowerCase()}`
    );
    const result = await response.json();
    return result.data || { winning: [], refundable: [], totalClaimable: 0 };
  } catch (error) {
    console.error('Error fetching claimable positions:', error);
    return { winning: [], refundable: [], totalClaimable: 0 };
  }
}

/**
 * Get user profile stats from on-chain data
 */
export async function getUserProfile(walletAddress: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/onchain/profile/${walletAddress.toLowerCase()}`
    );
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

/**
 * Get indexer sync status
 */
export async function getIndexerStatus() {
  try {
    const response = await fetch(`${API_URL}/api/onchain/indexer/status`);
    const result = await response.json();
    return result.data || { lastSyncedBlock: 0, isRunning: false };
  } catch (error) {
    console.error('Error fetching indexer status:', error);
    return { lastSyncedBlock: 0, isRunning: false };
  }
}

export default useIndexerPolling;
