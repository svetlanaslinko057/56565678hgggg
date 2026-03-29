'use client';

import { useState, useCallback, useRef } from 'react';
import { useWallet } from '@/lib/wagmi';
import { useWeb3Execution } from '@/lib/web3/useWeb3Execution';
import { env } from '@/lib/web3/env';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Claim status types
type ClaimStatusType = 'idle' | 'signing' | 'pending' | 'confirmed' | 'indexing' | 'indexed' | 'error';

export type ClaimStatus = ClaimStatusType;

export const CLAIM_STATUS_MESSAGES: Record<ClaimStatus, string> = {
  idle: 'Claim',
  signing: 'Confirm in wallet...',
  pending: 'Transaction pending...',
  confirmed: 'Confirming on blockchain...',
  indexing: 'Syncing with backend...',
  indexed: 'Claimed successfully!',
  error: 'Claim failed',
};

/**
 * Wait for indexer to confirm claim transaction
 * Returns { indexed: boolean, timeout: boolean }
 */
async function waitForIndexer(txHash: string, maxAttempts = 20, delayMs = 1500): Promise<{ indexed: boolean; timeout: boolean }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${API_BASE}/api/indexer/mirror/tx/${txHash}`);
      const data = await res.json();
      
      if (data.success && data.data?.status === 'INDEXED') {
        return { indexed: true, timeout: false };
      }
      
      if (data.data?.status === 'FAILED') {
        return { indexed: false, timeout: false };
      }
    } catch (e) {
      console.error('Indexer poll error:', e);
    }
    
    await new Promise(r => setTimeout(r, delayMs));
  }
  
  // ❗ Timeout - return false
  return { indexed: false, timeout: true };
}

/**
 * Track pending transaction with backend
 */
async function trackPendingTx(params: {
  txHash: string;
  type: string;
  wallet?: string;
  tokenId?: string;
}) {
  try {
    await fetch(`${API_BASE}/api/indexer/mirror/tx/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.error('Failed to track tx:', e);
  }
}

// ❗ Notifications are created by backend/indexer, not frontend

export interface Position {
  tokenId: string;
  marketId: string;
  chainMarketId?: string;
  outcomeId: string;
  outcomeLabel: string;
  stake: number;
  shares: number;
  potentialReturn: number;
  status: 'OPEN' | 'WON' | 'LOST' | 'CLAIMED' | 'REFUNDED';
  claimed?: boolean;
  claimedAt?: Date;
  market?: {
    question: string;
    status: string;
    winningOutcome?: string;
  };
}

/**
 * useClaim hook
 * 
 * Complete claim flow:
 * 1. Verify ownership (optional)
 * 2. Call claim(tokenId) on contract
 * 3. Wait for tx confirmation
 * 4. Wait for indexer
 * 5. Refresh positions & balance
 */
export function useClaim() {
  const { walletAddress, token } = useWallet();
  const execution = useWeb3Execution();
  
  const [status, setStatus] = useState<ClaimStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  
  // Double-click protection
  const isProcessingRef = useRef(false);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
    setClaimedAmount(null);
    isProcessingRef.current = false;
    execution.reset();
  }, [execution]);

  /**
   * Fetch claimable positions for current wallet
   */
  const getClaimablePositions = useCallback(async (): Promise<{
    winning: Position[];
    refundable: Position[];
    totalClaimable: number;
  } | null> => {
    if (!walletAddress) return null;
    
    try {
      const res = await fetch(`${API_BASE}/api/indexer/mirror/positions/claimable/${walletAddress}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch claimable positions:', e);
      return null;
    }
  }, [walletAddress, token]);

  /**
   * Check if position is claimable
   */
  const isClaimable = useCallback((position: Position): boolean => {
    if (position.claimed) return false;
    if (position.status === 'CLAIMED' || position.status === 'REFUNDED') return false;
    return position.status === 'WON';
  }, []);

  /**
   * Claim a winning position
   */
  const claim = useCallback(async (position: Position): Promise<{
    success: boolean;
    txHash?: string;
    amount?: number;
    error?: string;
  }> => {
    // Double-click protection
    if (isProcessingRef.current || status !== 'idle') {
      return { success: false, error: 'Claim already in progress' };
    }
    isProcessingRef.current = true;

    // Validation
    if (!execution.isConnected) {
      isProcessingRef.current = false;
      setError('Wallet not connected');
      setStatus('error');
      return { success: false, error: 'Wallet not connected' };
    }

    if (!isClaimable(position)) {
      isProcessingRef.current = false;
      setError('Position is not claimable');
      setStatus('error');
      return { success: false, error: 'Position is not claimable' };
    }

    if (!env.ONCHAIN_ENABLED) {
      isProcessingRef.current = false;
      setError('On-chain claims not enabled');
      setStatus('error');
      return { success: false, error: 'On-chain claims not enabled' };
    }

    setError(null);
    setTxHash(null);
    setClaimedAmount(null);

    try {
      // Step 1: Check network
      if (!(await execution.checkNetwork())) {
        throw new Error('Please switch to BSC Testnet');
      }

      // Step 2: Call claim on contract
      setStatus('signing');
      const claimHash = await execution.claim(position.tokenId);

      if (!claimHash) {
        throw new Error(execution.error || 'Claim failed');
      }

      setTxHash(claimHash);
      setStatus('pending');

      // Step 3: Track with backend
      await trackPendingTx({
        txHash: claimHash,
        type: 'CLAIM',
        wallet: walletAddress || undefined,
        tokenId: position.tokenId,
      });

      // Step 4: Wait for confirmation
      setStatus('confirmed');
      
      // Step 5: Wait for indexer (AFTER confirmed, no balance refresh until indexed)
      setStatus('indexing');
      const indexResult = await waitForIndexer(claimHash);

      // Step 6: Set claimed amount (notifications created by backend/indexer)
      const amount = position.potentialReturn || position.stake;
      setClaimedAmount(amount);

      if (indexResult.indexed) {
        setStatus('indexed');
        return { success: true, txHash: claimHash, amount };
      } else if (indexResult.timeout) {
        // Timeout but tx confirmed - still success
        setStatus('indexed');
        return { success: true, txHash: claimHash, amount };
      } else {
        setError('Claim confirmed but sync failed');
        setStatus('error');
        return { success: false, txHash: claimHash, error: 'Sync failed' };
      }

    } catch (e: any) {
      const errMsg = e.message || 'Unknown error';
      let userError = errMsg;
      
      if (errMsg.includes('User rejected') || errMsg.includes('user rejected')) {
        userError = 'Transaction cancelled';
      } else if (errMsg.includes('already claimed')) {
        userError = 'Position already claimed';
      } else if (errMsg.includes('not winner')) {
        userError = 'Only winning positions can be claimed';
      }
      
      setError(userError);
      setStatus('error');
      return { success: false, error: userError };
    } finally {
      isProcessingRef.current = false;
    }
  }, [execution, walletAddress, isClaimable, status]);

  /**
   * Claim all winning positions (batch)
   */
  const claimAll = useCallback(async (positions: Position[]): Promise<{
    success: boolean;
    claimed: number;
    failed: number;
    totalAmount: number;
  }> => {
    const claimable = positions.filter(isClaimable);
    
    let claimed = 0;
    let failed = 0;
    let totalAmount = 0;

    for (const pos of claimable) {
      const result = await claim(pos);
      if (result.success) {
        claimed++;
        totalAmount += result.amount || 0;
        reset(); // Reset for next claim
      } else {
        failed++;
      }
    }

    return { success: failed === 0, claimed, failed, totalAmount };
  }, [claim, reset, isClaimable]);

  return {
    // State
    status,
    error,
    txHash,
    claimedAmount,
    statusMessage: CLAIM_STATUS_MESSAGES[status],
    isLoading: !['idle', 'error', 'indexed'].includes(status),
    isSuccess: status === 'indexed',
    isError: status === 'error',
    
    // Actions
    claim,
    claimAll,
    reset,
    getClaimablePositions,
    isClaimable,
  };
}
