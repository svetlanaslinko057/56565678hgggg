'use client';

import { useCallback, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses (from environment)
const ARENA_CORE_ADDRESS = process.env.NEXT_PUBLIC_ARENA_CORE_ADDRESS || '';
const ARENA_NFT_ADDRESS = process.env.NEXT_PUBLIC_ARENA_POSITION_NFT_ADDRESS || '';
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-testnet.publicnode.com';

// ABIs
const ARENA_CORE_ABI = [
  "function placeBet(uint256 marketId, uint8 outcomeId, uint256 amount, uint256 shares) external returns (uint256)",
  "function claim(uint256 tokenId) external",
  "function refund(uint256 tokenId) external",
  "function getMarket(uint256 marketId) external view returns (tuple(uint256 externalMarketId, uint64 closeTime, uint8 outcomeCount, uint8 winningOutcome, uint8 status, uint256 totalStaked, uint256 totalShares, uint256 createdAt))",
  "function calculatePayout(uint256 tokenId) external view returns (uint256)",
  "event PositionMinted(uint256 indexed tokenId, uint256 indexed marketId, address indexed user, uint8 outcome, uint256 stake, uint256 shares)",
  "event PositionClaimed(uint256 indexed tokenId, address indexed user, uint256 payout)",
  "event PositionRefunded(uint256 indexed tokenId, address indexed user, uint256 refund)",
];

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

const ARENA_NFT_ABI = [
  "function getPosition(uint256 tokenId) external view returns (tuple(uint256 marketId, uint8 outcomeId, uint256 stake, uint256 shares, uint256 timestamp, bool claimed, bool refunded))",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokensOfOwner(address owner) external view returns (uint256[])",
];

// Transaction states
export type TxStatus = 'idle' | 'approving' | 'confirming' | 'pending' | 'success' | 'failed';

interface TxState {
  status: TxStatus;
  hash?: string;
  error?: string;
}

/**
 * Web3 Hook for FOMO Arena
 * Handles wallet connection and contract interactions
 */
export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });
  const [usdtBalance, setUsdtBalance] = useState<string>('0');

  // Initialize provider on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          disconnect();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setIsCorrectNetwork(newChainId === CHAIN_ID);
      });

      // Check if already connected
      browserProvider.listAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0].address);
          setIsConnected(true);
          browserProvider.getSigner().then(setSigner);
          browserProvider.getNetwork().then(network => {
            const networkChainId = Number(network.chainId);
            setChainId(networkChainId);
            setIsCorrectNetwork(networkChainId === CHAIN_ID);
          });
        }
      });
    }
  }, []);

  // Fetch USDT balance when address changes
  useEffect(() => {
    if (address && provider && USDT_ADDRESS) {
      const fetchBalance = async () => {
        try {
          const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
          const balance = await usdt.balanceOf(address);
          const decimals = await usdt.decimals();
          setUsdtBalance(ethers.formatUnits(balance, decimals));
        } catch (e) {
          console.error('Error fetching USDT balance:', e);
        }
      };
      fetchBalance();
    }
  }, [address, provider]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!provider) {
      throw new Error('No wallet detected. Please install MetaMask.');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        const signerInstance = await provider.getSigner();
        setSigner(signerInstance);
        
        const network = await provider.getNetwork();
        const networkChainId = Number(network.chainId);
        setChainId(networkChainId);
        setIsCorrectNetwork(networkChainId === CHAIN_ID);
        
        return accounts[0];
      }
    } catch (e: any) {
      throw new Error(e.message || 'Failed to connect wallet');
    }
  }, [provider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setIsCorrectNetwork(false);
  }, []);

  // Switch to correct network (BSC Testnet)
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${CHAIN_ID.toString(16)}`,
            chainName: CHAIN_ID === 97 ? 'BSC Testnet' : 'BSC Mainnet',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [CHAIN_ID === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com'],
          }],
        });
      }
    }
  }, []);

  // Approve USDT for ArenaCore
  const approveUsdt = useCallback(async (amount: string): Promise<string> => {
    if (!signer || !USDT_ADDRESS || !ARENA_CORE_ADDRESS) {
      throw new Error('Wallet not connected or contracts not configured');
    }

    setTxState({ status: 'approving' });

    try {
      const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const decimals = await usdt.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await usdt.approve(ARENA_CORE_ADDRESS, amountWei);
      setTxState({ status: 'pending', hash: tx.hash });

      const receipt = await tx.wait();
      setTxState({ status: 'success', hash: receipt.hash });

      return receipt.hash;
    } catch (e: any) {
      setTxState({ status: 'failed', error: e.message });
      throw e;
    }
  }, [signer]);

  // Check USDT allowance
  const checkAllowance = useCallback(async (): Promise<string> => {
    if (!provider || !address || !USDT_ADDRESS || !ARENA_CORE_ADDRESS) {
      return '0';
    }

    const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
    const allowance = await usdt.allowance(address, ARENA_CORE_ADDRESS);
    const decimals = await usdt.decimals();
    return ethers.formatUnits(allowance, decimals);
  }, [provider, address]);

  // Place bet on-chain
  const placeBet = useCallback(async (
    marketId: number,
    outcomeId: number,
    amount: string,
    shares: string
  ): Promise<{ tokenId: string; txHash: string }> => {
    if (!signer || !ARENA_CORE_ADDRESS || !USDT_ADDRESS) {
      throw new Error('Wallet not connected or contracts not configured');
    }

    setTxState({ status: 'confirming' });

    try {
      // Check and approve if needed
      const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const decimals = await usdt.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      const sharesWei = ethers.parseUnits(shares, decimals);

      const allowance = await usdt.allowance(address, ARENA_CORE_ADDRESS);
      if (allowance < amountWei) {
        setTxState({ status: 'approving' });
        const approveTx = await usdt.approve(ARENA_CORE_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Place bet
      setTxState({ status: 'confirming' });
      const arenaCore = new ethers.Contract(ARENA_CORE_ADDRESS, ARENA_CORE_ABI, signer);
      const tx = await arenaCore.placeBet(marketId, outcomeId, amountWei, sharesWei);
      
      setTxState({ status: 'pending', hash: tx.hash });
      const receipt = await tx.wait();

      // Parse PositionMinted event to get tokenId
      let tokenId = '0';
      for (const log of receipt.logs) {
        try {
          const parsed = arenaCore.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === 'PositionMinted') {
            tokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch {
          continue;
        }
      }

      setTxState({ status: 'success', hash: receipt.hash });
      return { tokenId, txHash: receipt.hash };
    } catch (e: any) {
      setTxState({ status: 'failed', error: e.message });
      throw e;
    }
  }, [signer, address]);

  // Claim winnings on-chain
  const claim = useCallback(async (tokenId: number): Promise<string> => {
    if (!signer || !ARENA_CORE_ADDRESS) {
      throw new Error('Wallet not connected or contracts not configured');
    }

    setTxState({ status: 'confirming' });

    try {
      const arenaCore = new ethers.Contract(ARENA_CORE_ADDRESS, ARENA_CORE_ABI, signer);
      const tx = await arenaCore.claim(tokenId);
      
      setTxState({ status: 'pending', hash: tx.hash });
      const receipt = await tx.wait();

      setTxState({ status: 'success', hash: receipt.hash });
      return receipt.hash;
    } catch (e: any) {
      setTxState({ status: 'failed', error: e.message });
      throw e;
    }
  }, [signer]);

  // Refund on-chain
  const refund = useCallback(async (tokenId: number): Promise<string> => {
    if (!signer || !ARENA_CORE_ADDRESS) {
      throw new Error('Wallet not connected or contracts not configured');
    }

    setTxState({ status: 'confirming' });

    try {
      const arenaCore = new ethers.Contract(ARENA_CORE_ADDRESS, ARENA_CORE_ABI, signer);
      const tx = await arenaCore.refund(tokenId);
      
      setTxState({ status: 'pending', hash: tx.hash });
      const receipt = await tx.wait();

      setTxState({ status: 'success', hash: receipt.hash });
      return receipt.hash;
    } catch (e: any) {
      setTxState({ status: 'failed', error: e.message });
      throw e;
    }
  }, [signer]);

  // Calculate potential payout
  const calculatePayout = useCallback(async (tokenId: number): Promise<string> => {
    if (!provider || !ARENA_CORE_ADDRESS) return '0';

    try {
      const arenaCore = new ethers.Contract(ARENA_CORE_ADDRESS, ARENA_CORE_ABI, provider);
      const payout = await arenaCore.calculatePayout(tokenId);
      return ethers.formatEther(payout);
    } catch {
      return '0';
    }
  }, [provider]);

  // Get user's NFT positions
  const getUserPositions = useCallback(async (): Promise<number[]> => {
    if (!provider || !address || !ARENA_NFT_ADDRESS) return [];

    try {
      const nft = new ethers.Contract(ARENA_NFT_ADDRESS, ARENA_NFT_ABI, provider);
      const tokens = await nft.tokensOfOwner(address);
      return tokens.map((t: bigint) => Number(t));
    } catch {
      return [];
    }
  }, [provider, address]);

  // Reset transaction state
  const resetTxState = useCallback(() => {
    setTxState({ status: 'idle' });
  }, []);

  return {
    // Connection state
    isConnected,
    address,
    chainId,
    isCorrectNetwork,
    usdtBalance,
    
    // Transaction state
    txState,
    resetTxState,
    
    // Actions
    connect,
    disconnect,
    switchNetwork,
    
    // Contract interactions
    approveUsdt,
    checkAllowance,
    placeBet,
    claim,
    refund,
    calculatePayout,
    getUserPositions,
    
    // Config
    targetChainId: CHAIN_ID,
    hasWallet: typeof window !== 'undefined' && !!window.ethereum,
  };
}

export default useWeb3;
