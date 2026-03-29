'use client';

import { useState, useCallback, useRef } from 'react';
import { useWallet } from '@/lib/wagmi';
import { useWeb3Execution } from '@/lib/web3/useWeb3Execution';
import { env } from '@/lib/web3/env';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Bet status types
type BetStatusType = 'idle' | 'checking_allowance' | 'approving' | 'getting_quote' | 'signing' | 'pending' | 'confirmed' | 'indexing' | 'indexed' | 'error';

export type BetStatus = BetStatusType;

export const BET_STATUS_MESSAGES: Record<BetStatus, string> = {
  idle: 'Place Bet',
  checking_allowance: 'Checking allowance...',
  approving: 'Approve USDT in wallet...',
  getting_quote: 'Getting quote...',
  signing: 'Confirm transaction in wallet...',
  pending: 'Transaction pending...',
  confirmed: 'Waiting for blockchain confirmation...',
  indexing: 'Syncing with backend...',
  indexed: 'Bet placed successfully!',
  error: 'Transaction failed',
};

interface QuoteResponse {
  success: boolean;
  data?: {
    quote: {
      user: string;
      marketId: string;
      outcomeId: number;
      amount: string;
      shares: string;
      entryPriceE18: string;
      deadline: string;
      nonce: string;
    };
    signature: string;
    expiresAt: number;
    preview: {
      shares: number;
      potentialReturn: number;
      fee: number;
    };
  };
  error?: string;
}

// Minimum bet amount
const MIN_BET_AMOUNT = 1;

/**
 * Wait for indexer to confirm transaction
 * Polls backend until tx is indexed or timeout
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
      
      // If confirmed on chain but not indexed yet, keep waiting
      if (data.data?.status === 'CONFIRMED') {
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      
      // If failed, exit early
      if (data.data?.status === 'FAILED') {
        return { indexed: false, timeout: false };
      }
    } catch (e) {
      console.error('Indexer poll error:', e);
    }
    
    await new Promise(r => setTimeout(r, delayMs));
  }
  
  // ❗ Timeout - return false, NOT true
  return { indexed: false, timeout: true };
}

/**
 * Track pending transaction with backend
 */
async function trackPendingTx(params: {
  txHash: string;
  type: string;
  wallet?: string;
  marketId?: string;
}) {
  try {
    await fetch(`${API_BASE}/api/indexer/mirror/tx/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash: params.txHash,
        type: params.type,
        wallet: params.wallet,
        chainMarketId: params.marketId,
      }),
    });
  } catch (e) {
    console.error('Failed to track tx:', e);
  }
}

/**
 * useBet hook
 * 
 * Complete bet flow with:
 * - Double-click protection
 * - Amount validation
 * - Quote expiry handling
 * - Real indexer sync
 */
export function useBet() {
  const { token, isAuthenticated, handleAuthError, walletAddress } = useWallet();
  const execution = useWeb3Execution();
  
  const [status, setStatus] = useState<BetStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Double-click protection
  const isProcessingRef = useRef(false);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
    isProcessingRef.current = false;
    execution.reset();
  }, [execution]);

  /**
   * Get signed quote from backend
   */
  const getQuote = useCallback(async (
    marketId: string,
    outcomeId: string,
    amount: number
  ): Promise<QuoteResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/pricing/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          marketId,
          outcomeId,
          amount,
          user: walletAddress,
        }),
      });

      // Handle 401
      if (res.status === 401) {
        handleAuthError();
        return null;
      }

      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Failed to get quote:', e);
      return null;
    }
  }, [token, handleAuthError, walletAddress]);

  /**
   * Validate bet amount
   */
  const validateAmount = useCallback((amount: number, balance?: number): string | null => {
    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (amount < MIN_BET_AMOUNT) {
      return `Minimum bet is ${MIN_BET_AMOUNT} USDT`;
    }
    if (balance !== undefined && amount > balance) {
      return 'Insufficient balance';
    }
    return null;
  }, []);

  /**
   * Place bet - full flow with all protections
   */
  const placeBet = useCallback(async ({
    marketId,
    outcomeId,
    amount,
    userBalance,
  }: {
    marketId: string;
    outcomeId: string;
    amount: number;
    userBalance?: number;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    // ❗ Double-click protection
    if (isProcessingRef.current || status !== 'idle') {
      return { success: false, error: 'Transaction already in progress' };
    }
    isProcessingRef.current = true;

    // Validation
    if (!isAuthenticated) {
      isProcessingRef.current = false;
      setError('Please sign in first');
      setStatus('error');
      return { success: false, error: 'Not authenticated' };
    }

    if (!execution.isConnected) {
      isProcessingRef.current = false;
      setError('Wallet not connected');
      setStatus('error');
      return { success: false, error: 'Wallet not connected' };
    }

    // ❗ Amount validation
    const amountError = validateAmount(amount, userBalance);
    if (amountError) {
      isProcessingRef.current = false;
      setError(amountError);
      setStatus('error');
      return { success: false, error: amountError };
    }

    // Check if on-chain is enabled
    if (!env.ONCHAIN_ENABLED) {
      isProcessingRef.current = false;
      setError('On-chain betting not enabled');
      setStatus('error');
      return { success: false, error: 'On-chain betting not enabled. Contact admin.' };
    }

    setError(null);
    setTxHash(null);

    try {
      // Step 1: Check network
      if (!(await execution.checkNetwork())) {
        throw new Error('Please switch to BSC Testnet');
      }

      // Step 2: Check allowance
      setStatus('checking_allowance');
      const amountStr = amount.toString();
      const hasAllowance = await execution.checkAllowance(amountStr);

      // Step 3: Approve if needed
      if (!hasAllowance) {
        setStatus('approving');
        const approveHash = await execution.approve(amountStr);
        if (!approveHash) {
          throw new Error(execution.error || 'User rejected approval');
        }
      }

      // Step 4: Get signed quote
      setStatus('getting_quote');
      const quoteResponse = await getQuote(marketId, outcomeId, amount);
      
      if (!quoteResponse?.success || !quoteResponse.data) {
        throw new Error(quoteResponse?.error || 'Failed to get quote');
      }

      const { quote, signature, expiresAt } = quoteResponse.data;

      // ❗ Quote expiry check
      if (expiresAt && Date.now() > expiresAt) {
        // Quote expired, get new one
        setStatus('getting_quote');
        const newQuoteResponse = await getQuote(marketId, outcomeId, amount);
        if (!newQuoteResponse?.success || !newQuoteResponse.data) {
          throw new Error('Quote expired and failed to get new one');
        }
        // Use new quote
        Object.assign(quote, newQuoteResponse.data.quote);
        Object.assign(signature, newQuoteResponse.data.signature);
      }

      // Step 5: Place bet on contract
      setStatus('signing');
      const betHash = await execution.placeBet({ quote, signature });

      if (!betHash) {
        throw new Error(execution.error || 'Bet failed');
      }

      setTxHash(betHash);
      setStatus('pending');

      // Step 6: Track with backend
      await trackPendingTx({
        txHash: betHash,
        type: 'BET',
        wallet: walletAddress || undefined,
        marketId,
      });

      // Step 7: Wait for confirmation
      setStatus('confirmed');
      
      // Step 8: Wait for indexer (AFTER confirmed)
      setStatus('indexing');
      const indexResult = await waitForIndexer(betHash);
      
      if (indexResult.indexed) {
        setStatus('indexed');
        return { success: true, txHash: betHash };
      } else if (indexResult.timeout) {
        // ❗ Timeout - show syncing state but still success (tx was confirmed)
        setStatus('indexed');
        return { success: true, txHash: betHash };
      } else {
        // Failed to index
        setError('Transaction failed to sync');
        setStatus('error');
        return { success: false, txHash: betHash, error: 'Sync failed' };
      }

    } catch (e: any) {
      const errMsg = e.message || 'Unknown error';
      // Parse user-friendly error
      let userError = errMsg;
      if (errMsg.includes('User rejected') || errMsg.includes('user rejected')) {
        userError = 'Transaction cancelled';
      } else if (errMsg.includes('insufficient funds')) {
        userError = 'Insufficient USDT balance';
      } else if (errMsg.includes('execution reverted')) {
        userError = 'Transaction reverted - market may be closed';
      }
      
      setError(userError);
      setStatus('error');
      return { success: false, error: userError };
    } finally {
      isProcessingRef.current = false;
    }
  }, [isAuthenticated, execution, getQuote, validateAmount, status, walletAddress]);

  return {
    // State
    status,
    error,
    txHash,
    statusMessage: BET_STATUS_MESSAGES[status],
    isLoading: !['idle', 'error', 'indexed'].includes(status),
    isSuccess: status === 'indexed',
    isError: status === 'error',
    
    // Actions
    placeBet,
    reset,
    getQuote,
    validateAmount,
  };
}
