'use client';

import React from 'react';
import styled from 'styled-components';
import { ChevronLeft, Bell, Wallet, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/ThemeContext';
import { useWallet } from '@/lib/wagmi';
import Image from 'next/image';

const TopBarContainer = styled.header<{ $bgColor: string; $borderColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.$bgColor};
  border-bottom: 1px solid ${props => props.$borderColor};
  min-height: 56px;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button<{ $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--border-light);
  border: none;
  color: ${props => props.$textColor};
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
    background: var(--border);
  }
`;

const LogoContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  height: 32px;
  padding: ${props => props.$isDark ? '4px 8px' : '0'};
  background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.95)' : 'transparent'};
  border-radius: ${props => props.$isDark ? '8px' : '0'};
  
  img {
    height: 100%;
    width: auto;
    transition: all 0.3s ease;
  }
`;

const Title = styled.h1<{ $textColor: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 0;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button<{ $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--border-light);
  border: none;
  color: ${props => props.$textColor};
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
  }
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
`;

const ConnectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #10B981;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.97);
    background: #059669;
  }
`;

const WalletButton = styled.button<{ $isCorrect: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${props => props.$isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
  border: 1px solid ${props => props.$isCorrect ? '#10B981' : '#F59E0B'};
  border-radius: 8px;
  color: ${props => props.$isCorrect ? '#10B981' : '#F59E0B'};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.97);
  }
`;

const WrongNetworkBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FEF3C7;
  border-bottom: 1px solid #F59E0B;
  color: #92400E;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  
  &:active {
    background: #FDE68A;
  }
`;

interface TgTopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function TgTopBar({ title, showBack, onBack }: TgTopBarProps) {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const { 
    isConnected, 
    shortAddress, 
    isCorrectNetwork, 
    connectWallet, 
    switchToCorrectNetwork,
    disconnectWallet 
  } = useWallet();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Wrong Network Banner */}
      {isConnected && !isCorrectNetwork && (
        <WrongNetworkBanner onClick={switchToCorrectNetwork} data-testid="wrong-network-banner">
          <AlertTriangle size={16} />
          Wrong Network - Tap to switch to BSC Testnet
        </WrongNetworkBanner>
      )}
      
      <TopBarContainer 
        data-testid="tg-top-bar"
        $bgColor={theme.bgPrimary}
        $borderColor={theme.border}
      >
        <LeftSection>
          {showBack ? (
            <BackButton onClick={handleBack} data-testid="back-button" $textColor={theme.textPrimary}>
              <ChevronLeft size={24} />
            </BackButton>
          ) : null}
          
          {title ? (
            <Title $textColor={theme.textPrimary}>{title}</Title>
          ) : (
            <LogoContainer $isDark={mode === 'dark'}>
              <img src="/images/logo.svg" alt="FOMO Arena" />
            </LogoContainer>
          )}
        </LeftSection>

        <RightSection>
          {/* Wallet Connection */}
          {!isConnected ? (
            <ConnectButton onClick={connectWallet} data-testid="connect-wallet-btn">
              <Wallet size={16} />
              Connect
            </ConnectButton>
          ) : (
            <WalletButton 
              onClick={disconnectWallet} 
              $isCorrect={isCorrectNetwork}
              data-testid="wallet-address-btn"
            >
              <Wallet size={14} />
              {shortAddress}
            </WalletButton>
          )}
          
          <IconButton data-testid="notifications-button" $textColor={theme.textPrimary}>
            <Bell size={20} />
            <NotificationDot />
          </IconButton>
        </RightSection>
      </TopBarContainer>
    </>
  );
}

export default TgTopBar;
