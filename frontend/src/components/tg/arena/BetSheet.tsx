'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Minus, Plus, Zap, TrendingUp, ShieldCheck, Brain, Wallet, AlertTriangle, Loader2, Check, ExternalLink, Clock } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket } from '@/lib/contracts';
import { CHAIN_CONFIG } from '@/lib/contracts/config';
import * as PredictionMarket from '@/lib/contracts/predictionMarket';
import { BetSheetData } from './types';
import { getTelegramWebApp, triggerHaptic } from '@/lib/telegram';
import { useIndexerPolling } from '@/lib/indexer';

// ==================== ANIMATIONS ====================
const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// ==================== STYLED COMPONENTS ====================
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: flex-end;
  animation: ${fadeIn} 0.2s ease;
  backdrop-filter: blur(8px);
`;

const Sheet = styled.div<{ $bgColor: string }>`
  width: 100%;
  background: ${props => props.$bgColor};
  border-radius: 24px 24px 0 0;
  padding: 20px 20px 40px;
  animation: ${slideUp} 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
`;

const Handle = styled.div<{ $mutedColor: string }>`
  width: 40px;
  height: 4px;
  background: ${props => props.$mutedColor};
  border-radius: 2px;
  margin: 0 auto 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const Title = styled.h3<{ $textColor: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 0;
  flex: 1;
  padding-right: 16px;
`;

const CloseButton = styled.button<{ $bgColor: string; $textColor: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$bgColor};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$textColor};
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
`;

const SideIndicator = styled.div<{ $side: 'YES' | 'NO'; $successColor: string; $dangerColor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 16px;
  
  ${({ $side, $successColor, $dangerColor }) => $side === 'YES' ? `
    background: ${$successColor}20;
    color: ${$successColor};
    border: 1px solid ${$successColor}50;
  ` : `
    background: ${$dangerColor}20;
    color: ${$dangerColor};
    border: 1px solid ${$dangerColor}50;
  `}
`;

// Wallet Section
const WalletSection = styled.div<{ $bgColor: string; $borderColor: string }>`
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  text-align: center;
`;

const WalletIcon = styled.div<{ $accentColor: string }>`
  width: 64px;
  height: 64px;
  background: ${props => props.$accentColor}20;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${props => props.$accentColor};
`;

const WalletTitle = styled.h4<{ $textColor: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 0 0 8px 0;
`;

const WalletDesc = styled.p<{ $mutedColor: string }>`
  font-size: 14px;
  color: ${props => props.$mutedColor};
  margin: 0 0 20px 0;
`;

const ConnectWalletButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #10B981;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
    background: #059669;
  }
`;

const WrongNetworkSection = styled.div`
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  text-align: center;
`;

const SwitchNetworkButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #F59E0B;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
    background: #D97706;
  }
`;

// Balance Info
const BalanceCard = styled.div<{ $bgColor: string; $borderColor: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 12px;
  margin-bottom: 16px;
`;

const BalanceLabel = styled.span<{ $mutedColor: string }>`
  font-size: 13px;
  color: ${props => props.$mutedColor};
`;

const BalanceValue = styled.span<{ $textColor: string }>`
  font-size: 15px;
  font-weight: 700;
  color: ${props => props.$textColor};
`;

// Amount Input
const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionLabel = styled.label<{ $mutedColor: string }>`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$mutedColor};
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AmountPresets = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
`;

const PresetButton = styled.button<{ $active: boolean; $accentColor: string; $bgColor: string; $textColor: string }>`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  
  ${({ $active, $accentColor, $bgColor, $textColor }) => $active ? `
    background: ${$accentColor}25;
    color: ${$accentColor};
    border-color: ${$accentColor};
  ` : `
    background: ${$bgColor};
    color: ${$textColor};
    
    &:active {
      background: ${$accentColor}15;
    }
  `}
`;

const CustomAmount = styled.div<{ $bgColor: string; $borderColor: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 12px;
`;

const AmountButton = styled.button<{ $accentColor: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.$accentColor}20;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$accentColor};
  cursor: pointer;
  
  &:active {
    background: ${props => props.$accentColor}30;
    transform: scale(0.95);
  }
`;

const AmountInput = styled.input<{ $textColor: string }>`
  flex: 1;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.$textColor};
  background: transparent;
  border: none;
  outline: none;
`;

const PayoutPreview = styled.div<{ $successColor: string; $textColor: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${props => props.$successColor}10;
  border: 1px solid ${props => props.$successColor}30;
  border-radius: 12px;
  margin-bottom: 20px;
  
  .label {
    font-size: 14px;
    color: ${props => props.$textColor};
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .value {
    font-size: 24px;
    font-weight: 800;
    color: ${props => props.$successColor};
  }
`;

// Transaction Status
const TxStatusContainer = styled.div`
  text-align: center;
  padding: 24px 16px;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  
  ${({ $status }) => {
    switch ($status) {
      case 'loading':
        return `background: rgba(16, 185, 129, 0.15);`;
      case 'success':
        return `background: rgba(16, 185, 129, 0.25);`;
      case 'error':
        return `background: rgba(239, 68, 68, 0.2);`;
    }
  }}
  
  svg {
    ${({ $status }) => $status === 'loading' && `animation: ${spin} 1s linear infinite;`}
    color: ${({ $status }) => {
      switch ($status) {
        case 'loading': return '#10B981';
        case 'success': return '#10B981';
        case 'error': return '#EF4444';
      }
    }};
  }
`;

const StatusTitle = styled.h3<{ $textColor: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 0 0 8px 0;
`;

const StatusDescription = styled.p<{ $mutedColor: string }>`
  font-size: 14px;
  color: ${props => props.$mutedColor};
  margin: 0;
  line-height: 1.6;
`;

const TelegramHint = styled.div<{ $accentColor: string }>`
  margin-top: 16px;
  padding: 12px;
  background: ${props => props.$accentColor}15;
  border-radius: 10px;
  font-size: 13px;
  color: ${props => props.$accentColor};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TxLink = styled.a<{ $accentColor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.$accentColor};
  font-size: 14px;
  margin-top: 16px;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Step Indicator
const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const Step = styled.div<{ $active?: boolean; $completed?: boolean; $accentColor: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  
  ${({ $active, $completed, $accentColor }) => {
    if ($completed) return `background: ${$accentColor}25; color: ${$accentColor};`;
    if ($active) return `background: #F59E0B20; color: #F59E0B;`;
    return `background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4);`;
  }}
`;

const StepArrow = styled.div<{ $mutedColor: string }>`
  color: ${props => props.$mutedColor};
  font-size: 16px;
`;

// Buttons
const ActionButton = styled.button<{ 
  $side?: 'YES' | 'NO'; 
  $variant?: 'approve' | 'bet' | 'done';
  $successColor: string; 
  $dangerColor: string;
  $disabled?: boolean;
}>`
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 700;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  ${({ $variant, $side, $successColor, $dangerColor, $disabled }) => {
    if ($disabled) {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.4);
      `;
    }
    if ($variant === 'approve') {
      return `
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        color: #000;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
      `;
    }
    if ($variant === 'done') {
      return `
        background: ${$successColor};
        color: #000;
      `;
    }
    // Bet button
    if ($side === 'YES') {
      return `
        background: linear-gradient(135deg, ${$successColor} 0%, ${$successColor}dd 100%);
        color: #000;
        box-shadow: 0 8px 24px ${$successColor}40;
      `;
    }
    return `
      background: linear-gradient(135deg, ${$dangerColor} 0%, ${$dangerColor}dd 100%);
      color: #fff;
      box-shadow: 0 8px 24px ${$dangerColor}40;
    `;
  }}
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const SpinIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

// Error
const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #EF4444;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BalanceInfo = styled.div<{ $mutedColor: string }>`
  text-align: center;
  font-size: 12px;
  color: ${props => props.$mutedColor};
  margin-top: 12px;
`;

// ==================== TYPES ====================
type TxStep = 'idle' | 'checking' | 'approving' | 'approved' | 'betting' | 'indexing' | 'success' | 'error';

interface BetSheetProps {
  isOpen: boolean;
  data: BetSheetData | null;
  onClose: () => void;
  onBetPlaced?: (txHash: string, tokenId: number) => void;
}

const presets = [10, 25, 50, 100];

// ==================== COMPONENT ====================
export function BetSheet({ isOpen, data, onClose, onBetPlaced }: BetSheetProps) {
  const { theme } = useTheme();
  const { isConnected, isCorrectNetwork, shortAddress, connectWallet, switchToCorrectNetwork } = useWallet();
  const { 
    config, 
    stableBalance, 
    marketAddress,
    approve: approveToken,
    placeBet: placeBetOnchain,
    refresh
  } = usePredictionMarket();
  
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [txStep, setTxStep] = useState<TxStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTxStep('idle');
      setTxHash(null);
      setTokenId(null);
      setError(null);
      setAmount(25);
      setCustomAmount('');
      if (isConnected) {
        refresh();
      }
    }
  }, [isOpen, isConnected, refresh]);

  if (!data) return null;

  const currentAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const potentialPayout = currentAmount * data.odds;
  
  // Calculate if we need approval
  const amountBigInt = currentAmount > 0 && stableBalance 
    ? BigInt(Math.floor(currentAmount * (10 ** stableBalance.decimals)))
    : BigInt(0);
  
  const needsApproval = stableBalance && amountBigInt > stableBalance.allowance;
  const hasInsufficientBalance = stableBalance && amountBigInt > stableBalance.balance;
  const minBet = config ? parseFloat(config.minBetFormatted) : 10;
  const belowMinBet = currentAmount > 0 && currentAmount < minBet;

  const canProceed = isConnected && 
    isCorrectNetwork &&
    currentAmount >= minBet && 
    !hasInsufficientBalance &&
    txStep === 'idle';

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
    triggerHaptic('light');
  };

  const handleAmountChange = (delta: number) => {
    const newAmount = Math.max(1, currentAmount + delta);
    setCustomAmount(String(newAmount));
    triggerHaptic('light');
  };

  // ==================== APPROVE ====================
  const handleApprove = async () => {
    if (!currentAmount) return;
    
    setTxStep('approving');
    setError(null);
    triggerHaptic('medium');
    
    // Approve a large amount to avoid frequent approvals
    const approveAmount = String(currentAmount * 100);
    const result = await approveToken(approveAmount);
    
    if (result.ok) {
      setTxStep('approved');
      triggerHaptic('success');
      // Auto-proceed to bet after short delay
      setTimeout(() => handlePlaceBet(), 1000);
    } else {
      setTxStep('error');
      setError('error' in result ? result.error : 'Approval failed');
      triggerHaptic('error');
    }
  };

  // ==================== PLACE BET ====================
  const handlePlaceBet = async () => {
    // Get on-chain market ID
    const onchainMarketId = data.onchainId ?? parseInt(data.marketId);
    const outcome = data.side === 'YES' ? 0 : 1; // YES = 0, NO = 1
    
    setTxStep('betting');
    setError(null);
    triggerHaptic('medium');
    
    const result = await placeBetOnchain(onchainMarketId, outcome, String(currentAmount));
    
    if (result.ok) {
      setTxHash(result.txHash);
      
      // Extract token ID from receipt
      const tokenIdResult = await PredictionMarket.extractPlacedTokenId(marketAddress, result.receipt);
      if (tokenIdResult.ok) {
        setTokenId(tokenIdResult.data);
      }
      
      // Show indexing state briefly, then success
      setTxStep('indexing');
      triggerHaptic('success');
      
      // Simulate indexer wait (in production, use useIndexerPolling)
      setTimeout(() => {
        setTxStep('success');
        // Callback
        onBetPlaced?.(result.txHash, tokenIdResult.ok ? tokenIdResult.data : 0);
      }, 2000);
      
    } else {
      setTxStep('error');
      
      // Parse error messages
      let errorMsg = 'error' in result ? result.error : 'Transaction failed';
      if (errorMsg.includes('user rejected') || errorMsg.includes('User rejected')) {
        errorMsg = 'Transaction cancelled by user';
      } else if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'Insufficient BNB for gas fees';
      }
      
      setError(errorMsg);
      triggerHaptic('error');
    }
  };

  // ==================== ACTIONS ====================
  const handleAction = () => {
    if (needsApproval) {
      handleApprove();
    } else {
      handlePlaceBet();
    }
  };

  const handleClose = () => {
    if (txStep === 'approving' || txStep === 'betting' || txStep === 'indexing') {
      // Don't close while transaction is pending
      return;
    }
    onClose();
  };

  const handleRetry = () => {
    setTxStep('idle');
    setError(null);
    setTxHash(null);
  };

  const explorerUrl = CHAIN_CONFIG.blockExplorer + '/tx/';

  // ==================== RENDER ====================
  return (
    <Overlay $isOpen={isOpen} onClick={handleClose}>
      <Sheet $bgColor={theme.bgPrimary} onClick={(e) => e.stopPropagation()} data-testid="bet-sheet">
        <Handle $mutedColor={theme.textMuted} />
        
        <Header>
          <Title $textColor={theme.textPrimary}>{data.marketTitle}</Title>
          <CloseButton 
            onClick={handleClose}
            $bgColor={theme.bgCard}
            $textColor={theme.textPrimary}
            disabled={txStep === 'approving' || txStep === 'betting'}
          >
            <X size={20} />
          </CloseButton>
        </Header>

        <SideIndicator 
          $side={data.side}
          $successColor={theme.success}
          $dangerColor={theme.danger}
        >
          Betting {data.side} @ {data.odds.toFixed(2)}x
        </SideIndicator>

        {/* NOT CONNECTED */}
        {!isConnected && (
          <WalletSection $bgColor={theme.bgCard} $borderColor={theme.border}>
            <WalletIcon $accentColor={theme.accent}>
              <Wallet size={32} />
            </WalletIcon>
            <WalletTitle $textColor={theme.textPrimary}>Connect Wallet</WalletTitle>
            <WalletDesc $mutedColor={theme.textMuted}>
              Connect your wallet to place bets on BSC Testnet
            </WalletDesc>
            <ConnectWalletButton onClick={connectWallet} data-testid="bet-sheet-connect-wallet">
              <Wallet size={20} />
              Connect Wallet
            </ConnectWalletButton>
          </WalletSection>
        )}

        {/* WRONG NETWORK */}
        {isConnected && !isCorrectNetwork && (
          <WrongNetworkSection>
            <WalletIcon $accentColor="#F59E0B">
              <AlertTriangle size={32} />
            </WalletIcon>
            <WalletTitle $textColor="#92400E">Wrong Network</WalletTitle>
            <WalletDesc $mutedColor="#92400E">
              Please switch to BSC Testnet to continue
            </WalletDesc>
            <SwitchNetworkButton onClick={switchToCorrectNetwork} data-testid="switch-network-btn">
              <AlertTriangle size={20} />
              Switch to BSC Testnet
            </SwitchNetworkButton>
          </WrongNetworkSection>
        )}

        {/* CONNECTED & CORRECT NETWORK */}
        {isConnected && isCorrectNetwork && (
          <>
            {/* ERROR */}
            {error && (
              <ErrorBanner>
                <AlertTriangle size={18} />
                {error}
              </ErrorBanner>
            )}

            {/* TRANSACTION IN PROGRESS */}
            {(txStep === 'approving' || txStep === 'approved' || txStep === 'betting' || txStep === 'indexing') && (
              <>
                <StepIndicator>
                  <Step 
                    $completed={txStep === 'approved' || txStep === 'betting' || txStep === 'indexing'} 
                    $active={txStep === 'approving'}
                    $accentColor={theme.accent}
                  >
                    {txStep === 'approving' ? <SpinIcon size={14} /> : <Check size={14} />}
                    Approve
                  </Step>
                  <StepArrow $mutedColor={theme.textMuted}>→</StepArrow>
                  <Step 
                    $completed={txStep === 'indexing'} 
                    $active={txStep === 'betting'}
                    $accentColor={theme.accent}
                  >
                    {txStep === 'betting' ? <SpinIcon size={14} /> : (txStep === 'indexing' ? <Check size={14} /> : null)}
                    Place Bet
                  </Step>
                  <StepArrow $mutedColor={theme.textMuted}>→</StepArrow>
                  <Step 
                    $completed={false} 
                    $active={txStep === 'indexing'}
                    $accentColor={theme.accent}
                  >
                    {txStep === 'indexing' ? <SpinIcon size={14} /> : null}
                    Sync
                  </Step>
                </StepIndicator>
                
                <TxStatusContainer>
                  <StatusIcon $status="loading">
                    <SpinIcon size={36} />
                  </StatusIcon>
                  <StatusTitle $textColor={theme.textPrimary}>
                    {txStep === 'approving' && 'Approving USDT...'}
                    {txStep === 'approved' && 'Approved!'}
                    {txStep === 'betting' && 'Placing Bet...'}
                    {txStep === 'indexing' && 'Syncing Position...'}
                  </StatusTitle>
                  <StatusDescription $mutedColor={theme.textMuted}>
                    {txStep === 'approving' && 'Confirm the approval transaction in your wallet'}
                    {txStep === 'approved' && 'Now proceeding to place your bet...'}
                    {txStep === 'betting' && 'Confirm the bet transaction in your wallet'}
                    {txStep === 'indexing' && 'Transaction confirmed! Waiting for indexer sync...'}
                  </StatusDescription>
                  
                  {(txStep === 'approving' || txStep === 'betting') && (
                    <TelegramHint $accentColor={theme.accent}>
                      <Wallet size={16} />
                      Open your wallet app to confirm
                    </TelegramHint>
                  )}
                  
                  {txStep === 'indexing' && (
                    <TelegramHint $accentColor={theme.success}>
                      <Clock size={16} />
                      Your position will appear shortly
                    </TelegramHint>
                  )}
                </TxStatusContainer>
              </>
            )}

            {/* SUCCESS */}
            {txStep === 'success' && (
              <TxStatusContainer>
                <StatusIcon $status="success">
                  <Check size={36} />
                </StatusIcon>
                <StatusTitle $textColor={theme.textPrimary}>Bet Placed!</StatusTitle>
                <StatusDescription $mutedColor={theme.textMuted}>
                  Your ${currentAmount} bet on {data.side} has been confirmed on-chain.
                  {tokenId && <><br />Position NFT: #{tokenId}</>}
                </StatusDescription>
                {txHash && (
                  <TxLink 
                    href={`${explorerUrl}${txHash}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    $accentColor={theme.accent}
                  >
                    View on Explorer <ExternalLink size={14} />
                  </TxLink>
                )}
                
                <ActionButton
                  onClick={handleClose}
                  $variant="done"
                  $successColor={theme.success}
                  $dangerColor={theme.danger}
                  style={{ marginTop: 24 }}
                  data-testid="done-btn"
                >
                  Done
                </ActionButton>
              </TxStatusContainer>
            )}

            {/* ERROR STATE */}
            {txStep === 'error' && (
              <TxStatusContainer>
                <StatusIcon $status="error">
                  <AlertTriangle size={36} />
                </StatusIcon>
                <StatusTitle $textColor={theme.textPrimary}>Transaction Failed</StatusTitle>
                <StatusDescription $mutedColor={theme.textMuted}>
                  {error || 'Something went wrong. Please try again.'}
                </StatusDescription>
                
                <ActionButton
                  onClick={handleRetry}
                  $variant="approve"
                  $successColor={theme.success}
                  $dangerColor={theme.danger}
                  style={{ marginTop: 24 }}
                  data-testid="retry-btn"
                >
                  Try Again
                </ActionButton>
              </TxStatusContainer>
            )}

            {/* IDLE STATE - BET FORM */}
            {txStep === 'idle' && (
              <>
                {/* Balance */}
                {stableBalance && (
                  <BalanceCard $bgColor={theme.bgCard} $borderColor={theme.border}>
                    <BalanceLabel $mutedColor={theme.textMuted}>Your Balance</BalanceLabel>
                    <BalanceValue $textColor={theme.textPrimary}>
                      {parseFloat(stableBalance.balanceFormatted).toFixed(2)} USDT
                    </BalanceValue>
                  </BalanceCard>
                )}

                {/* Amount Selection */}
                <Section>
                  <SectionLabel $mutedColor={theme.textMuted}>
                    Amount (Min: {minBet} USDT)
                  </SectionLabel>
                  <AmountPresets>
                    {presets.map((preset) => (
                      <PresetButton
                        key={preset}
                        $active={amount === preset && !customAmount}
                        $accentColor={theme.accent}
                        $bgColor={theme.bgCard}
                        $textColor={theme.textSecondary}
                        onClick={() => handlePresetClick(preset)}
                      >
                        ${preset}
                      </PresetButton>
                    ))}
                  </AmountPresets>
                  
                  <CustomAmount $bgColor={theme.bgCard} $borderColor={theme.border}>
                    <AmountButton onClick={() => handleAmountChange(-5)} $accentColor={theme.accent}>
                      <Minus size={20} />
                    </AmountButton>
                    <AmountInput
                      type="number"
                      value={customAmount || amount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0"
                      $textColor={theme.textPrimary}
                      data-testid="amount-input"
                    />
                    <AmountButton onClick={() => handleAmountChange(5)} $accentColor={theme.accent}>
                      <Plus size={20} />
                    </AmountButton>
                  </CustomAmount>
                </Section>

                {/* Validation Errors */}
                {hasInsufficientBalance && (
                  <ErrorBanner>
                    <AlertTriangle size={16} />
                    Insufficient USDT balance
                  </ErrorBanner>
                )}

                {belowMinBet && (
                  <ErrorBanner>
                    <AlertTriangle size={16} />
                    Minimum bet is {minBet} USDT
                  </ErrorBanner>
                )}

                {/* Payout Preview */}
                {currentAmount >= minBet && !hasInsufficientBalance && (
                  <PayoutPreview $successColor={theme.success} $textColor={theme.textSecondary}>
                    <span className="label">
                      <TrendingUp size={16} /> Potential Win
                    </span>
                    <span className="value">${potentialPayout.toFixed(2)}</span>
                  </PayoutPreview>
                )}

                {/* Action Button */}
                <ActionButton
                  onClick={handleAction}
                  $side={data.side}
                  $variant={needsApproval ? 'approve' : 'bet'}
                  $successColor={theme.success}
                  $dangerColor={theme.danger}
                  $disabled={!canProceed}
                  disabled={!canProceed}
                  data-testid={needsApproval ? "approve-btn" : "place-bet-btn"}
                >
                  <Zap size={20} />
                  {needsApproval ? 'Approve USDT' : `Place $${currentAmount} Bet`}
                </ActionButton>

                <BalanceInfo $mutedColor={theme.textMuted}>
                  <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {shortAddress} • On-chain via BSC Testnet
                </BalanceInfo>
              </>
            )}
          </>
        )}
      </Sheet>
    </Overlay>
  );
}

export default BetSheet;
