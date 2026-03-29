'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Minus, Plus, Zap, TrendingUp, ShieldCheck, Brain, Wallet, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useWallet } from '@/lib/wagmi';
import { BetSheetData } from './types';
import { getTelegramWebApp } from '@/lib/telegram';

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

// Wallet Connection Section
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

const WrongNetworkSection = styled.div<{ $bgColor: string }>`
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

// AI Analysis Section
const AISection = styled.div<{ $bgColor: string; $borderColor: string }>`
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
`;

const AISectionTitle = styled.div<{ $accentColor: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: ${props => props.$accentColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const AIStats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
`;

const AIStat = styled.div<{ $textColor: string; $mutedColor: string }>`
  .value {
    font-size: 20px;
    font-weight: 800;
    color: ${props => props.$textColor};
  }
  
  .label {
    font-size: 11px;
    color: ${props => props.$mutedColor};
    text-transform: uppercase;
  }
`;

const AIReasoning = styled.div<{ $textColor: string }>`
  font-size: 13px;
  color: ${props => props.$textColor};
  line-height: 1.5;
  padding: 10px 12px;
  background: rgba(0, 255, 136, 0.05);
  border-radius: 10px;
  border-left: 3px solid var(--accent);
`;

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

const PayoutPreview = styled.div<{ $bgColor: string; $successColor: string; $textColor: string }>`
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

const PlaceBetButton = styled.button<{ $side: 'YES' | 'NO'; $successColor: string; $dangerColor: string; $hasEdge: boolean }>`
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  ${({ $side, $successColor, $dangerColor, $hasEdge }) => $side === 'YES' ? `
    background: linear-gradient(135deg, ${$successColor} 0%, ${$successColor}dd 100%);
    color: #000;
    box-shadow: 0 8px 24px ${$successColor}40;
  ` : `
    background: linear-gradient(135deg, ${$dangerColor} 0%, ${$dangerColor}dd 100%);
    color: #fff;
    box-shadow: 0 8px 24px ${$dangerColor}40;
  `}
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EdgeHint = styled.span`
  font-size: 13px;
  opacity: 0.9;
`;

const BalanceInfo = styled.div<{ $mutedColor: string }>`
  text-align: center;
  font-size: 12px;
  color: ${props => props.$mutedColor};
  margin-top: 12px;
`;

interface BetSheetProps {
  isOpen: boolean;
  data: BetSheetData | null;
  onClose: () => void;
  onPlaceBet: (marketId: string, side: 'YES' | 'NO', amount: number) => void;
}

const presets = [10, 25, 50, 100];

export function BetSheet({ isOpen, data, onClose, onPlaceBet }: BetSheetProps) {
  const { theme } = useTheme();
  const { isConnected, isCorrectNetwork, shortAddress, connectWallet, switchToCorrectNetwork } = useWallet();
  const [amount, setAmount] = React.useState(25);
  const [customAmount, setCustomAmount] = React.useState('');

  if (!data) return null;

  const currentAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const potentialPayout = currentAmount * data.odds;
  
  const aiPercent = data.ai ? Math.round(data.ai.probability * 100) : null;
  const edgePercent = data.ai ? Math.round(data.ai.edge * 100) : null;
  const hasEdge = data.ai && Math.abs(data.ai.edge) > 0.05;

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
    // Haptic feedback
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleAmountChange = (delta: number) => {
    const newAmount = Math.max(1, currentAmount + delta);
    setCustomAmount(String(newAmount));
    // Haptic feedback
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  };

  const handlePlaceBet = () => {
    if (currentAmount > 0 && isConnected && isCorrectNetwork) {
      // Strong haptic feedback
      const tg = getTelegramWebApp();
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      onPlaceBet(data.marketId, data.side, currentAmount);
      onClose();
    }
  };

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Sheet $bgColor={theme.bgPrimary} onClick={(e) => e.stopPropagation()}>
        <Handle $mutedColor={theme.textMuted} />
        
        <Header>
          <Title $textColor={theme.textPrimary}>{data.marketTitle}</Title>
          <CloseButton 
            onClick={onClose}
            $bgColor={theme.bgCard}
            $textColor={theme.textPrimary}
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

        {/* WALLET CONNECTION CHECK */}
        {!isConnected ? (
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
        ) : !isCorrectNetwork ? (
          <WrongNetworkSection $bgColor={theme.bgCard}>
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
        ) : (
          <>
            {/* AI Analysis Section */}
            {data.ai && (
              <AISection $bgColor={theme.bgCard} $borderColor={theme.border}>
                <AISectionTitle $accentColor={theme.accent}>
                  <Brain size={14} /> AI Analysis
                </AISectionTitle>
                
                <AIStats>
                  <AIStat $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
                    <div className="value">{aiPercent}%</div>
                    <div className="label">AI Probability</div>
                  </AIStat>
                  <AIStat $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
                    <div className="value">{data.marketPercent}%</div>
                    <div className="label">Market</div>
                  </AIStat>
                  <AIStat $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
                    <div className="value" style={{ color: edgePercent && edgePercent > 0 ? theme.success : theme.danger }}>
                      {edgePercent && edgePercent > 0 ? '+' : ''}{edgePercent}%
                    </div>
                    <div className="label">Edge</div>
                  </AIStat>
                </AIStats>
                
                {data.ai.reasoning && (
                  <AIReasoning $textColor={theme.textSecondary}>
                    💡 {data.ai.reasoning}
                  </AIReasoning>
                )}
              </AISection>
            )}

            <Section>
              <SectionLabel $mutedColor={theme.textMuted}>Amount (USDT)</SectionLabel>
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
                />
                <AmountButton onClick={() => handleAmountChange(5)} $accentColor={theme.accent}>
                  <Plus size={20} />
                </AmountButton>
              </CustomAmount>
            </Section>

            <PayoutPreview 
              $bgColor={theme.bgCard}
              $successColor={theme.success}
              $textColor={theme.textSecondary}
            >
              <span className="label">
                <TrendingUp size={16} /> Potential Win
              </span>
              <span className="value">${potentialPayout.toFixed(2)}</span>
            </PayoutPreview>

            <PlaceBetButton
              $side={data.side}
              $successColor={theme.success}
              $dangerColor={theme.danger}
              $hasEdge={hasEdge || false}
              onClick={handlePlaceBet}
              disabled={currentAmount <= 0}
              data-testid="place-bet-button"
            >
              <Zap size={20} />
              Place ${currentAmount} Bet
              {hasEdge && edgePercent && (
                <EdgeHint>({edgePercent > 0 ? '+' : ''}{edgePercent}% Edge)</EdgeHint>
              )}
            </PlaceBetButton>

            <BalanceInfo $mutedColor={theme.textMuted}>
              <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Connected: {shortAddress} • Min bet: $10
            </BalanceInfo>
          </>
        )}
      </Sheet>
    </Overlay>
  );
}

export default BetSheet;
