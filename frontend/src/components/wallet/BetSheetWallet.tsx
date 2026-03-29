'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Wallet, AlertTriangle, Zap } from 'lucide-react';
import { useWallet } from '@/lib/wagmi';

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

const Container = styled.div`
  width: 100%;
`;

const ConnectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: rgba(0, 255, 136, 0.05);
  border: 1px dashed rgba(0, 255, 136, 0.3);
  border-radius: 16px;
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00FF88;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

const Subtitle = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
`;

const ConnectBtn = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%);
  color: #000;
  box-shadow: 0 6px 20px rgba(0, 255, 136, 0.35);
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 255, 136, 0.45);
  }
`;

const SwitchNetworkWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 16px;
`;

const WarningIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF6B6B;
  animation: ${pulse} 2s infinite;
`;

const SwitchBtn = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%);
  color: #fff;
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.35);
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const ReadyIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
`;

const ReadyIcon = styled.span`
  color: #00FF88;
`;

const ReadyText = styled.span`
  font-size: 14px;
  color: #00FF88;
  font-weight: 600;
`;

const AddressSpan = styled.span`
  font-family: monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: auto;
`;

interface BetSheetWalletProps {
  children: React.ReactNode;
}

/**
 * BetSheetWallet - Wrapper for BetSheet with wallet states
 * 
 * States:
 * A. Not connected -> Connect Wallet
 * B. Wrong network -> Switch to BSC Testnet  
 * C. Connected -> Show bet form
 */
export function BetSheetWallet({ children }: BetSheetWalletProps) {
  const { 
    isConnected, 
    isCorrectNetwork, 
    connectWallet, 
    switchToCorrectNetwork,
    shortAddress 
  } = useWallet();

  // State A: Not connected
  if (!isConnected) {
    return (
      <Container>
        <ConnectWrapper>
          <IconWrapper>
            <Wallet size={28} />
          </IconWrapper>
          <Title>Connect Your Wallet</Title>
          <Subtitle>
            Connect your wallet to place bets on prediction markets
          </Subtitle>
          <ConnectBtn 
            onClick={connectWallet}
            data-testid="betsheet-connect-wallet"
          >
            <Wallet size={20} />
            Connect Wallet
          </ConnectBtn>
        </ConnectWrapper>
      </Container>
    );
  }

  // State B: Wrong network
  if (!isCorrectNetwork) {
    return (
      <Container>
        <SwitchNetworkWrapper>
          <WarningIcon>
            <AlertTriangle size={28} />
          </WarningIcon>
          <Title>Wrong Network</Title>
          <Subtitle>
            Please switch to BSC Testnet to place bets
          </Subtitle>
          <SwitchBtn 
            onClick={switchToCorrectNetwork}
            data-testid="betsheet-switch-network"
          >
            <Zap size={20} />
            Switch to BSC Testnet
          </SwitchBtn>
        </SwitchNetworkWrapper>
      </Container>
    );
  }

  // State C: Ready
  return (
    <Container>
      <ReadyIndicator data-testid="wallet-ready-indicator">
        <ReadyIcon><Zap size={18} /></ReadyIcon>
        <ReadyText>Wallet Ready</ReadyText>
        <AddressSpan>{shortAddress}</AddressSpan>
      </ReadyIndicator>
      {children}
    </Container>
  );
}

export default BetSheetWallet;
