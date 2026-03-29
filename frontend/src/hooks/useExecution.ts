'use client';

import { useCallback, useState } from 'react';
import { MarketsAPI, PositionsAPI } from '@/lib/api/arena';

// Feature flag for on-chain execution
const ARENA_ONCHAIN_ENABLED = process.env.NEXT_PUBLIC_ONCHAIN_ENABLED === 'true';

interface ExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}

interface BetParams {
  marketId: string;
  outcomeId: string;
  stake: number;
  wallet: string;
}

interface ClaimParams {
  positionId: string;
  wallet: string;
}

interface CreateMarketParams {
  question: string;
  outcomes: { id: string; label: string }[];
  closeTime: Date;
  category: string;
  wallet: string;
}

/**
 * Execution Abstraction Layer
 * Switches between API execution (off-chain) and Contract execution (on-chain)
 * based on ARENA_ONCHAIN_ENABLED flag
 */
export function useExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== API Execution (Off-chain) ====================
  
  const apiPlaceBet = async (params: BetParams): Promise<ExecutionResult<any>> => {
    try {
      const result = await MarketsAPI.placeBet(params.marketId, params.stake, params.outcomeId);
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to place bet' };
    }
  };

  const apiClaim = async (params: ClaimParams): Promise<ExecutionResult<any>> => {
    try {
      const result = await PositionsAPI.claimPayout(params.positionId);
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to claim' };
    }
  };

  const apiCreateMarket = async (params: CreateMarketParams): Promise<ExecutionResult<any>> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/predictions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Wallet-Address': params.wallet,
        },
        body: JSON.stringify({
          question: params.question,
          outcomes: params.outcomes,
          closeTime: params.closeTime,
          category: params.category,
          createdBy: params.wallet,
        }),
      });
      const data = await res.json();
      return { success: data.success, data: data.data, error: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create market' };
    }
  };

  // ==================== Contract Execution (On-chain) ====================
  // These will be implemented when smart contracts are integrated
  
  const contractPlaceBet = async (params: BetParams): Promise<ExecutionResult<any>> => {
    // TODO: Implement when ArenaCore.sol is deployed
    // const contract = new ethers.Contract(ARENA_CORE_ADDRESS, ArenaCore.abi, signer);
    // const tx = await contract.placeBet(params.marketId, params.outcomeId, params.stake);
    // const receipt = await tx.wait();
    // return { success: true, txHash: receipt.transactionHash };
    
    console.warn('[Execution] Contract execution not yet implemented');
    return { success: false, error: 'On-chain execution not yet available' };
  };

  const contractClaim = async (params: ClaimParams): Promise<ExecutionResult<any>> => {
    // TODO: Implement when ArenaCore.sol is deployed
    // const contract = new ethers.Contract(ARENA_CORE_ADDRESS, ArenaCore.abi, signer);
    // const tx = await contract.claim(params.positionId);
    // const receipt = await tx.wait();
    // return { success: true, txHash: receipt.transactionHash };
    
    console.warn('[Execution] Contract execution not yet implemented');
    return { success: false, error: 'On-chain execution not yet available' };
  };

  const contractCreateMarket = async (params: CreateMarketParams): Promise<ExecutionResult<any>> => {
    // TODO: Implement when ArenaCore.sol is deployed
    // const contract = new ethers.Contract(ARENA_CORE_ADDRESS, ArenaCore.abi, signer);
    // const tx = await contract.createMarket(...);
    // const receipt = await tx.wait();
    // return { success: true, txHash: receipt.transactionHash, data: { marketId: ... } };
    
    console.warn('[Execution] Contract execution not yet implemented');
    return { success: false, error: 'On-chain execution not yet available' };
  };

  // ==================== Unified Execution Interface ====================

  const placeBet = useCallback(async (params: BetParams): Promise<ExecutionResult<any>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = ARENA_ONCHAIN_ENABLED 
        ? await contractPlaceBet(params)
        : await apiPlaceBet(params);
      
      if (!result.success) {
        setError(result.error || 'Execution failed');
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const claim = useCallback(async (params: ClaimParams): Promise<ExecutionResult<any>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = ARENA_ONCHAIN_ENABLED 
        ? await contractClaim(params)
        : await apiClaim(params);
      
      if (!result.success) {
        setError(result.error || 'Execution failed');
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const createMarket = useCallback(async (params: CreateMarketParams): Promise<ExecutionResult<any>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = ARENA_ONCHAIN_ENABLED 
        ? await contractCreateMarket(params)
        : await apiCreateMarket(params);
      
      if (!result.success) {
        setError(result.error || 'Execution failed');
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    isOnChain: ARENA_ONCHAIN_ENABLED,
    
    // Actions
    placeBet,
    claim,
    createMarket,
    
    // Direct access (for advanced use cases)
    api: {
      placeBet: apiPlaceBet,
      claim: apiClaim,
      createMarket: apiCreateMarket,
    },
    contract: {
      placeBet: contractPlaceBet,
      claim: contractClaim,
      createMarket: contractCreateMarket,
    },
  };
}

export default useExecution;
