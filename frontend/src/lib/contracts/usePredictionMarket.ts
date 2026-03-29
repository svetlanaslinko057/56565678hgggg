'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/lib/wagmi';
import { CONTRACTS } from './config';
import * as PredictionMarket from './predictionMarket';

export interface ContractConfig {
  stableToken: string;
  stableTokenDecimals: number;
  feeRecipient: string;
  claimFeeBps: number;
  minBet: bigint;
  minBetFormatted: string;
  minInitialStake: bigint;
  minInitialStakeFormatted: string;
  userMarketRequestsEnabled: boolean;
  owner: string;
}

export interface UserRoles {
  isOwner: boolean;
  isAdmin: boolean;
  isResolver: boolean;
}

export interface StableBalance {
  balance: bigint;
  balanceFormatted: string;
  allowance: bigint;
  allowanceFormatted: string;
  decimals: number;
}

export function usePredictionMarket() {
  const { walletAddress, isConnected } = useWallet();
  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [roles, setRoles] = useState<UserRoles>({ isOwner: false, isAdmin: false, isResolver: false });
  const [stableBalance, setStableBalance] = useState<StableBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const marketAddress = CONTRACTS.MARKET_ADDRESS;

  // Load contract config
  const loadConfig = useCallback(async () => {
    try {
      const result = await PredictionMarket.getConfig(marketAddress);
      if (result.ok) {
        setConfig(result.data);
      } else {
        setError('error' in result ? result.error : 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [marketAddress]);

  // Check user roles
  const checkRoles = useCallback(async () => {
    if (!walletAddress) {
      setRoles({ isOwner: false, isAdmin: false, isResolver: false });
      return;
    }

    try {
      const [ownerRes, adminRes, resolverRes] = await Promise.all([
        PredictionMarket.isOwner(marketAddress, walletAddress),
        PredictionMarket.isAdmin(marketAddress, walletAddress),
        PredictionMarket.isResolver(marketAddress, walletAddress),
      ]);

      setRoles({
        isOwner: ownerRes.ok ? ownerRes.data : false,
        isAdmin: adminRes.ok ? adminRes.data : false,
        isResolver: resolverRes.ok ? resolverRes.data : false,
      });
    } catch (err: any) {
      console.error('Failed to check roles:', err);
    }
  }, [walletAddress, marketAddress]);

  // Load stable token balance and allowance
  const loadStableBalance = useCallback(async () => {
    if (!walletAddress) {
      setStableBalance(null);
      return;
    }

    try {
      const [balanceRes, allowanceRes] = await Promise.all([
        PredictionMarket.getStableBalance(marketAddress, walletAddress),
        PredictionMarket.getStableAllowance(marketAddress, walletAddress),
      ]);

      if (balanceRes.ok && allowanceRes.ok) {
        setStableBalance({
          balance: balanceRes.data.balance,
          balanceFormatted: balanceRes.data.balanceFormatted,
          allowance: allowanceRes.data.allowance,
          allowanceFormatted: allowanceRes.data.allowanceFormatted,
          decimals: balanceRes.data.decimals,
        });
      }
    } catch (err: any) {
      console.error('Failed to load balance:', err);
    }
  }, [walletAddress, marketAddress]);

  // Initialize
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      loadConfig();
    }
  }, [loadConfig]);

  useEffect(() => {
    if (isConnected && walletAddress) {
      checkRoles();
      loadStableBalance();
    }
  }, [isConnected, walletAddress, checkRoles, loadStableBalance]);

  // ========== User Actions ==========

  const approve = useCallback(async (amount: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.approveStableToken(marketAddress, amount);
      if (result.ok) {
        await loadStableBalance();
      } else {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, loadStableBalance]);

  const placeBet = useCallback(async (marketId: number, outcome: number, amount: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.placeBet(marketAddress, marketId, outcome, amount);
      if (result.ok) {
        await loadStableBalance();
      } else {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, loadStableBalance]);

  const claim = useCallback(async (tokenId: number | bigint) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.claimPosition(marketAddress, tokenId);
      if (result.ok) {
        await loadStableBalance();
      } else {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, loadStableBalance]);

  const refund = useCallback(async (tokenId: number | bigint) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.refundPosition(marketAddress, tokenId);
      if (result.ok) {
        await loadStableBalance();
      } else {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, loadStableBalance]);

  const requestMarket = useCallback(async (params: {
    endTime: number;
    question: string;
    labels: string[];
    firstOutcome: number;
    firstStakeAmountStr: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.requestMarket(marketAddress, params);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress]);

  const cancelRequest = useCallback(async (requestId: number | bigint) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.cancelOwnRequest(marketAddress, requestId);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress]);

  // ========== Read Functions ==========

  const getMarket = useCallback(async (marketId: number | bigint) => {
    return PredictionMarket.getMarketWithLabels(marketAddress, marketId);
  }, [marketAddress]);

  const getPosition = useCallback(async (tokenId: number | bigint) => {
    return PredictionMarket.getPosition(marketAddress, tokenId);
  }, [marketAddress]);

  const previewClaim = useCallback(async (tokenId: number | bigint) => {
    return PredictionMarket.previewClaim(marketAddress, tokenId);
  }, [marketAddress]);

  const previewRefund = useCallback(async (tokenId: number | bigint) => {
    return PredictionMarket.previewRefund(marketAddress, tokenId);
  }, [marketAddress]);

  // ========== Admin Functions ==========

  const createMarket = useCallback(async (endTime: number, question: string, labels: string[]) => {
    if (!roles.isAdmin && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Admin role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.createMarket(marketAddress, endTime, question, labels);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  const approveMarketRequest = useCallback(async (requestId: number | bigint) => {
    if (!roles.isAdmin && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Admin role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.approveMarketRequest(marketAddress, requestId);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  const rejectMarketRequest = useCallback(async (requestId: number | bigint) => {
    if (!roles.isAdmin && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Admin role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.rejectMarketRequest(marketAddress, requestId);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  // ========== Resolver Functions ==========

  const lockMarket = useCallback(async (marketId: number | bigint) => {
    if (!roles.isResolver && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Resolver role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.lockMarket(marketAddress, marketId);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  const disputeMarket = useCallback(async (marketId: number | bigint) => {
    if (!roles.isResolver && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Resolver role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.disputeMarket(marketAddress, marketId);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  const resolveMarket = useCallback(async (marketId: number | bigint, outcome: number) => {
    if (!roles.isResolver && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Resolver role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.resolveMarket(marketAddress, marketId, outcome);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  const cancelMarket = useCallback(async (marketId: number | bigint) => {
    if (!roles.isResolver && !roles.isOwner) {
      return { ok: false, error: 'Not authorized: Resolver role required' } as const;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await PredictionMarket.cancelMarket(marketAddress, marketId);
      if (!result.ok) {
        setError('error' in result ? result.error : 'Unknown error');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  // ========== Owner Functions ==========

  const setAdmin = useCallback(async (admin: string, allowed: boolean) => {
    if (!roles.isOwner) {
      return { ok: false, error: 'Not authorized: Owner required' } as const;
    }
    setLoading(true);
    try {
      const result = await PredictionMarket.setAdmin(marketAddress, admin, allowed);
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  const setResolver = useCallback(async (resolver: string, allowed: boolean) => {
    if (!roles.isOwner) {
      return { ok: false, error: 'Not authorized: Owner required' } as const;
    }
    setLoading(true);
    try {
      const result = await PredictionMarket.setResolver(marketAddress, resolver, allowed);
      return result;
    } finally {
      setLoading(false);
    }
  }, [marketAddress, roles]);

  return {
    // State
    config,
    roles,
    stableBalance,
    loading,
    error,
    marketAddress,

    // Refresh functions
    refresh: useCallback(async () => {
      await Promise.all([loadConfig(), checkRoles(), loadStableBalance()]);
    }, [loadConfig, checkRoles, loadStableBalance]),

    // User actions
    approve,
    placeBet,
    claim,
    refund,
    requestMarket,
    cancelRequest,

    // Read functions
    getMarket,
    getPosition,
    previewClaim,
    previewRefund,

    // Admin functions
    createMarket,
    approveMarketRequest,
    rejectMarketRequest,

    // Resolver functions
    lockMarket,
    disputeMarket,
    resolveMarket,
    cancelMarket,

    // Owner functions
    setAdmin,
    setResolver,
  };
}

// Export types
export type { TxResult, ReadResult } from './predictionMarket';
export { MarketStatus, RequestStatus } from './predictionMarket';
