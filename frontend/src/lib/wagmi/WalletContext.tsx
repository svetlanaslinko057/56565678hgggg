'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAccount, useDisconnect, useSwitchChain, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { TARGET_CHAIN_ID } from './config';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface AuthUser {
  id: string;
  wallet: string;
  username: string;
  xp: number;
  tier: string;
  badges: string[];
}

interface WalletContextType {
  // Wallet state
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  shortAddress: string | null;
  
  // Auth state
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  token: string | null;
  user: AuthUser | null;
  
  // Actions
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchToCorrectNetwork: () => Promise<void>;
  signIn: () => Promise<void>;
  logout: () => void;
  handleAuthError: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chain, isConnecting: wagmiConnecting } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  
  const [mounted, setMounted] = useState(false);
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const chainId = chain?.id;
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const isAuthenticated = !!(token && user);

  // Mount
  useEffect(() => {
    setMounted(true);
    
    // Restore auth from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('arenaToken');
      const storedUser = localStorage.getItem('arenaUser');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem('arenaToken');
          localStorage.removeItem('arenaUser');
        }
      }
    }
  }, []);

  // Wallet mismatch protection - check when address changes
  useEffect(() => {
    if (typeof window !== 'undefined' && address && user) {
      if (user.wallet && user.wallet.toLowerCase() !== address.toLowerCase()) {
        console.log('Wallet mismatch detected, clearing auth');
        localStorage.removeItem('arenaToken');
        localStorage.removeItem('arenaUser');
        setToken(null);
        setUser(null);
      }
    }
  }, [address, user]);

  // Save wallet address when connected
  useEffect(() => {
    if (isConnected && address && typeof window !== 'undefined') {
      localStorage.setItem('arenaWallet', address);
    }
  }, [isConnected, address]);

  // Clear auth if wallet changes while authenticated
  useEffect(() => {
    if (address && user && address.toLowerCase() !== user.wallet.toLowerCase()) {
      console.log('Wallet changed, clearing auth state');
      setToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('arenaToken');
        localStorage.removeItem('arenaUser');
      }
    }
  }, [address, user]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arenaToken');
      localStorage.removeItem('arenaUser');
    }
  }, []);

  const handleAuthError = useCallback(() => {
    console.log('Auth error (401), logging out');
    logout();
  }, [logout]);

  // Use RainbowKit modal for wallet connection
  const connectWallet = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arenaWallet');
    }
  }, [disconnect, logout]);

  const switchToCorrectNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: TARGET_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchChain]);

  /**
   * SIWE Sign-In Flow
   */
  const signIn = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);

    try {
      // Step 1: Get nonce from backend
      const nonceRes = await fetch(`${API_BASE}/api/auth/nonce?wallet=${address}`);
      const nonceData = await nonceRes.json();

      if (!nonceData.success || !nonceData.data?.message) {
        throw new Error('Failed to get authentication nonce');
      }

      const message = nonceData.data.message;

      // Step 2: Sign the message
      const signature = await signMessageAsync({ message, account: address });

      // Step 3: Verify signature with backend
      const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          message,
          signature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error(verifyData.message || verifyData.error || 'Verification failed');
      }

      // Step 4: Save token and user
      const authToken = verifyData.data.token;
      const authUser = verifyData.data.user;

      setToken(authToken);
      setUser(authUser);

      if (typeof window !== 'undefined') {
        localStorage.setItem('arenaToken', authToken);
        localStorage.setItem('arenaUser', JSON.stringify(authUser));
      }

      return;
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessageAsync]);

  if (!mounted) {
    return (
      <WalletContext.Provider
        value={{
          isConnected: false,
          isConnecting: false,
          walletAddress: null,
          chainId: undefined,
          isCorrectNetwork: false,
          shortAddress: null,
          isAuthenticated: false,
          isAuthenticating: false,
          token: null,
          user: null,
          connectWallet: () => {},
          disconnectWallet: () => {},
          switchToCorrectNetwork: async () => {},
          signIn: async () => {},
          logout: () => {},
          handleAuthError: () => {},
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting: wagmiConnecting,
        walletAddress: address || null,
        chainId,
        isCorrectNetwork,
        shortAddress,
        isAuthenticated,
        isAuthenticating,
        token,
        user,
        connectWallet,
        disconnectWallet,
        switchToCorrectNetwork,
        signIn,
        logout,
        handleAuthError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
