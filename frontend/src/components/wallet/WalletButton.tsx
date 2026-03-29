'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const ButtonWrapper = styled.div`
  display: inline-flex;
`;

const CustomButton = styled.button<{ $variant: 'connect' | 'wrong_network' | 'connected' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'connect':
        return `
          background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%);
          color: #000;
          box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
          }
          
          &:active {
            transform: translateY(0);
          }
        `;
      case 'wrong_network':
        return `
          background: linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%);
          color: #fff;
          animation: ${pulse} 2s infinite;
          box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
          
          &:hover {
            animation: none;
            transform: translateY(-2px);
          }
        `;
      case 'connected':
        return `
          background: rgba(0, 255, 136, 0.15);
          color: #00FF88;
          border: 1px solid rgba(0, 255, 136, 0.3);
          
          &:hover {
            background: rgba(0, 255, 136, 0.25);
          }
        `;
      default:
        return '';
    }
  }}
`;

const AddressText = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
`;

interface WalletButtonProps {
  showBalance?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * WalletButton - Universal wallet connection component
 * 
 * Uses RainbowKit for wallet selection:
 * - MetaMask
 * - WalletConnect
 * - Trust Wallet
 * - OKX Wallet
 * - Coinbase Wallet
 * 
 * States:
 * 1. Not connected → Connect Wallet
 * 2. Wrong network → Switch to BSC Testnet
 * 3. Connected → Show address
 */
export function WalletButton({ showBalance = false, compact = false, className }: WalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;

        return (
          <ButtonWrapper className={className}>
            {(() => {
              if (!connected) {
                return (
                  <CustomButton
                    onClick={openConnectModal}
                    $variant="connect"
                    data-testid="connect-wallet-btn"
                  >
                    <Wallet size={18} />
                    {compact ? 'Connect' : 'Connect Wallet'}
                  </CustomButton>
                );
              }

              if (chain.unsupported) {
                return (
                  <CustomButton
                    onClick={openChainModal}
                    $variant="wrong_network"
                    data-testid="switch-network-btn"
                  >
                    <AlertTriangle size={18} />
                    Switch to BSC Testnet
                  </CustomButton>
                );
              }

              return (
                <CustomButton
                  onClick={openAccountModal}
                  $variant="connected"
                  data-testid="wallet-connected-btn"
                >
                  <CheckCircle size={16} />
                  <AddressText>
                    {account.displayName}
                  </AddressText>
                  {showBalance && account.displayBalance && (
                    <span style={{ opacity: 0.7, marginLeft: 4 }}>
                      ({account.displayBalance})
                    </span>
                  )}
                </CustomButton>
              );
            })()}
          </ButtonWrapper>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default WalletButton;
