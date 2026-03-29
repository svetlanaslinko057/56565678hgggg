'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useArena } from '@/lib/api/ArenaContext';

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ConnectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #0F172A;
  color: #fff;
  border: none;
  
  &:hover {
    background: #1e293b;
    transform: scale(1.02);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const WalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
`;

const WalletAddress = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
`;

const Balance = styled.span`
  font-size: 13px;
  color: #05A584;
  font-weight: 600;
`;

const DisconnectButton = styled.button`
  background: transparent;
  border: none;
  color: #738094;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  
  &:hover {
    color: #ff6b6b;
  }
`;

const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const ConnectWalletButton: React.FC = () => {
  const arenaContext = useArena();
  const isDemo = false; // Demo mode removed
  const endDemo = () => {}; // No-op
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check if already connected
  useEffect(() => {
    const token = localStorage.getItem('arenaToken');
    const address = localStorage.getItem('arenaWallet');
    if (token && address) {
      setIsConnected(true);
      setWalletAddress(address);
      fetchBalance(token);
    }
  }, []);

  const fetchBalance = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.data?.balanceUsdt || 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to connect your wallet');
      return;
    }

    setLoading(true);

    try {
      // Dynamic import ethers for client-side only
      const { ethers } = await import('ethers');
      
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Get nonce from backend
      const nonceRes = await fetch(`${API_BASE}/api/auth/nonce?wallet=${address}`);
      const nonceData = await nonceRes.json();
      
      if (!nonceData.success) {
        throw new Error('Failed to get nonce');
      }

      // Sign message
      const message = nonceData.data.message;
      const signature = await signer.signMessage(message);

      // Verify with backend
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

      // Save token and address
      localStorage.setItem('arenaToken', verifyData.data.token);
      localStorage.setItem('arenaWallet', address);
      
      // Clear demo mode if active
      if (isDemo) {
        endDemo();
      }

      setIsConnected(true);
      setWalletAddress(address);
      
      // Reload to refresh all data
      window.location.reload();
    } catch (err) {
      console.error('Connect wallet failed:', err);
      alert(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('arenaToken');
    localStorage.removeItem('arenaWallet');
    setIsConnected(false);
    setWalletAddress(null);
    setBalance(0);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && walletAddress) {
    return (
      <WalletContainer>
        <WalletInfo>
          <WalletIcon />
          <WalletAddress>{formatAddress(walletAddress)}</WalletAddress>
          {balance > 0 && <Balance>${balance.toFixed(2)}</Balance>}
        </WalletInfo>
        <DisconnectButton onClick={disconnectWallet}>Disconnect</DisconnectButton>
      </WalletContainer>
    );
  }

  return (
    <ConnectButton onClick={connectWallet} disabled={loading} data-testid="connect-wallet-btn">
      <WalletIcon />
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </ConnectButton>
  );
};

export default ConnectWalletButton;

// Add ethereum type to window
declare global {
  interface Window {
    ethereum?: any;
  }
}
