"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { bscTestnet } from 'viem/chains';
import { ARENA_CORE_ABI, ERC20_ABI } from "./abis";
import { env } from "./env";

/**
 * Transaction status lifecycle
 * idle → approving → signing → pending → confirmed → indexed → error
 */
export type TxStatus =
  | "idle"
  | "approving"
  | "signing"
  | "pending"
  | "confirmed"
  | "indexed"
  | "error";

/**
 * useWeb3Execution hook
 * 
 * Production-ready execution layer for FOMO Arena.
 * Handles all on-chain interactions:
 * - Token approval
 * - Bet placement (with signed quote)
 * - Claim winnings
 * - Refund cancelled markets
 * 
 * CRITICAL RULES:
 * 1. NEVER update UI balance directly after tx
 * 2. ALWAYS wait for indexer to confirm
 * 3. Show proper status at each step
 */
export function useWeb3Execution() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------
  // Reset state
  // -----------------------------------------
  const reset = () => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  };

  // -----------------------------------------
  // Check network
  // -----------------------------------------
  const checkNetwork = async () => {
    if (chainId !== env.CHAIN_ID) {
      try {
        await switchChain({ chainId: env.CHAIN_ID });
        return true;
      } catch (e) {
        setError(`Please switch to ${env.CHAIN_NAME}`);
        setStatus("error");
        return false;
      }
    }
    return true;
  };

  // -----------------------------------------
  // Wait for transaction
  // -----------------------------------------
  async function waitForTx(hash: `0x${string}`): Promise<boolean> {
    if (!publicClient) return false;

    setStatus("pending");

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === "success") {
        setStatus("confirmed");
        return true;
      } else {
        setStatus("error");
        setError("Transaction failed");
        return false;
      }
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Transaction failed");
      return false;
    }
  }

  // -----------------------------------------
  // Track pending transaction with backend
  // -----------------------------------------
  async function trackPendingTx(params: {
    txHash: string;
    type: string;
    tokenId?: string;
    chainMarketId?: string;
  }) {
    try {
      await fetch(`${env.API_URL}/api/indexer/mirror/tx/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          wallet: address,
        }),
      });
    } catch (e) {
      console.warn("Failed to track tx:", e);
    }
  }

  // -----------------------------------------
  // Wait for indexer to process event
  // -----------------------------------------
  async function waitForIndexer(hash: string, maxAttempts = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${env.API_URL}/api/indexer/mirror/tx/${hash}`);
        const data = await res.json();
        
        if (data.data?.status === "INDEXED") {
          setStatus("indexed");
          return true;
        }
      } catch (e) {
        // Ignore errors, keep polling
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Timeout but tx was confirmed
    return true;
  }

  // -----------------------------------------
  // APPROVE
  // -----------------------------------------
  async function approve(amount: string): Promise<string | null> {
    try {
      if (!walletClient || !address) throw new Error("Wallet not connected");
      if (!(await checkNetwork())) return null;

      setStatus("approving");
      setError(null);

      const hash = await walletClient.writeContract({
        address: env.COLLATERAL_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [env.ARENA_CORE_ADDRESS, parseUnits(amount, env.COLLATERAL_DECIMALS)],
        account: address,
        chain: bscTestnet,
      });

      setTxHash(hash);
      await waitForTx(hash);

      return hash;
    } catch (err: any) {
      setError(err.message || "Approval failed");
      setStatus("error");
      return null;
    }
  }

  // -----------------------------------------
  // CHECK ALLOWANCE
  // -----------------------------------------
  async function checkAllowance(amount: string): Promise<boolean> {
    if (!publicClient || !address) return false;

    try {
      const allowance = await (publicClient as any).readContract({
        address: env.COLLATERAL_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, env.ARENA_CORE_ADDRESS],
      });

      const amountWei = parseUnits(amount, env.COLLATERAL_DECIMALS);
      return (allowance as bigint) >= amountWei;
    } catch (e) {
      return false;
    }
  }

  // -----------------------------------------
  // PLACE BET (with signed quote)
  // -----------------------------------------
  async function placeBet({
    quote,
    signature,
  }: {
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
  }): Promise<string | null> {
    try {
      if (!walletClient || !address) throw new Error("Wallet not connected");
      if (!(await checkNetwork())) return null;

      setStatus("signing");
      setError(null);

      // Convert quote to contract format
      const contractQuote = {
        user: quote.user as `0x${string}`,
        marketId: BigInt(quote.marketId),
        outcomeId: quote.outcomeId,
        amount: BigInt(quote.amount),
        shares: BigInt(quote.shares),
        entryPriceE18: BigInt(quote.entryPriceE18),
        deadline: BigInt(quote.deadline),
        nonce: BigInt(quote.nonce),
      };

      const hash = await walletClient.writeContract({
        address: env.ARENA_CORE_ADDRESS,
        abi: ARENA_CORE_ABI,
        functionName: "placeBetWithQuote",
        args: [contractQuote, signature as `0x${string}`],
        account: address,
        chain: bscTestnet,
      });

      setTxHash(hash);

      // Track pending tx
      await trackPendingTx({
        txHash: hash,
        type: "BET",
        chainMarketId: quote.marketId,
      });

      // Wait for tx confirmation
      const success = await waitForTx(hash);
      if (!success) return null;

      // Wait for indexer (optional but recommended)
      await waitForIndexer(hash);

      return hash;
    } catch (err: any) {
      setError(err.message || "Bet failed");
      setStatus("error");
      return null;
    }
  }

  // -----------------------------------------
  // CLAIM
  // -----------------------------------------
  async function claim(tokenId: string): Promise<string | null> {
    try {
      if (!walletClient || !address) throw new Error("Wallet not connected");
      if (!(await checkNetwork())) return null;

      setStatus("signing");
      setError(null);

      const hash = await walletClient.writeContract({
        address: env.ARENA_CORE_ADDRESS,
        abi: ARENA_CORE_ABI,
        functionName: "claim",
        args: [BigInt(tokenId)],
        account: address,
        chain: bscTestnet,
      });

      setTxHash(hash);

      await trackPendingTx({
        txHash: hash,
        type: "CLAIM",
        tokenId,
      });

      const success = await waitForTx(hash);
      if (!success) return null;

      await waitForIndexer(hash);

      return hash;
    } catch (err: any) {
      setError(err.message || "Claim failed");
      setStatus("error");
      return null;
    }
  }

  // -----------------------------------------
  // BATCH CLAIM
  // -----------------------------------------
  async function batchClaim(tokenIds: string[]): Promise<string | null> {
    try {
      if (!walletClient || !address) throw new Error("Wallet not connected");
      if (!(await checkNetwork())) return null;

      setStatus("signing");
      setError(null);

      const hash = await walletClient.writeContract({
        address: env.ARENA_CORE_ADDRESS,
        abi: ARENA_CORE_ABI,
        functionName: "batchClaim",
        args: [tokenIds.map(id => BigInt(id))],
        account: address,
        chain: bscTestnet,
      });

      setTxHash(hash);

      await trackPendingTx({
        txHash: hash,
        type: "CLAIM",
      });

      const success = await waitForTx(hash);
      if (!success) return null;

      await waitForIndexer(hash);

      return hash;
    } catch (err: any) {
      setError(err.message || "Batch claim failed");
      setStatus("error");
      return null;
    }
  }

  // -----------------------------------------
  // REFUND
  // -----------------------------------------
  async function refund(tokenId: string): Promise<string | null> {
    try {
      if (!walletClient || !address) throw new Error("Wallet not connected");
      if (!(await checkNetwork())) return null;

      setStatus("signing");
      setError(null);

      const hash = await walletClient.writeContract({
        address: env.ARENA_CORE_ADDRESS,
        abi: ARENA_CORE_ABI,
        functionName: "refund",
        args: [BigInt(tokenId)],
        account: address,
        chain: bscTestnet,
      });

      setTxHash(hash);

      await trackPendingTx({
        txHash: hash,
        type: "REFUND",
        tokenId,
      });

      const success = await waitForTx(hash);
      if (!success) return null;

      await waitForIndexer(hash);

      return hash;
    } catch (err: any) {
      setError(err.message || "Refund failed");
      setStatus("error");
      return null;
    }
  }

  return {
    // State
    status,
    txHash,
    error,
    isConnected,
    address,
    chainId,
    
    // Actions
    approve,
    checkAllowance,
    placeBet,
    claim,
    batchClaim,
    refund,
    reset,
    checkNetwork,
  };
}
