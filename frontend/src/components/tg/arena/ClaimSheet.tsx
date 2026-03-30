'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, DollarSign, Loader2, Check, ExternalLink, Clock, AlertTriangle, Trophy, Wallet, Share2 } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket } from '@/lib/contracts';
import { CHAIN_CONFIG } from '@/lib/contracts/config';
import { triggerHaptic } from '@/lib/telegram';

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

const celebrationPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const confetti = keyframes`
  0% { transform: translateY(0) rotate(0); opacity: 1; }
  100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
`;

// ==================== STYLED COMPONENTS ====================
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: flex-end;
  animation: ${fadeIn} 0.2s ease;
  backdrop-filter: blur(10px);
`;

const Sheet = styled.div<{ $bgColor: string }>`
  width: 100%;
  background: ${props => props.$bgColor};
  border-radius: 28px 28px 0 0;
  padding: 20px 20px 40px;
  animation: ${slideUp} 0.3s ease;
  max-height: 85vh;
  overflow-y: auto;
`;

const Handle = styled.div<{ $mutedColor: string }>`
  width: 44px;
  height: 5px;
  background: ${props => props.$mutedColor};
  border-radius: 3px;
  margin: 0 auto 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const Title = styled.h3<{ $textColor: string }>`
  font-size: 20px;
  font-weight: 800;
  color: ${props => props.$textColor};
  margin: 0;
  flex: 1;
  padding-right: 16px;
`;

const CloseButton = styled.button<{ $bgColor: string; $textColor: string }>`
  width: 40px;
  height: 40px;
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

const WinBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 20px;
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.3);
`;

// Position Details
const PositionCard = styled.div<{ $bgColor: string; $borderColor: string }>`
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
`;

const PositionTitle = styled.h4<{ $textColor: string }>`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.$textColor};
  margin: 0 0 16px 0;
  line-height: 1.4;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StatBox = styled.div<{ $bgColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 12px;
  padding: 14px;
  text-align: center;
`;

const StatLabel = styled.div<{ $mutedColor: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$mutedColor};
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const StatValue = styled.div<{ $textColor: string; $highlight?: boolean }>`
  font-size: 18px;
  font-weight: 800;
  color: ${({ $textColor, $highlight }) => $highlight ? '#10B981' : $textColor};
`;

// Claim Amount Display
const ClaimAmountContainer = styled.div`
  text-align: center;
  padding: 28px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  margin-bottom: 24px;
`;

const ClaimLabel = styled.div<{ $mutedColor: string }>`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$mutedColor};
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const ClaimAmount = styled.div`
  font-size: 44px;
  font-weight: 900;
  color: #10B981;
  margin-bottom: 8px;
`;

const FeeInfo = styled.div<{ $mutedColor: string }>`
  font-size: 12px;
  color: ${props => props.$mutedColor};
`;

// Transaction States
const TxStatusContainer = styled.div`
  text-align: center;
  padding: 32px 20px;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  
  ${({ $status }) => {
    switch ($status) {
      case 'loading':
        return `background: rgba(16, 185, 129, 0.15);`;
      case 'success':
        return `background: rgba(16, 185, 129, 0.25); animation: ${celebrationPulse} 1.5s ease-in-out infinite;`;
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
  font-size: 22px;
  font-weight: 800;
  color: ${props => props.$textColor};
  margin: 0 0 10px 0;
`;

const StatusDescription = styled.p<{ $mutedColor: string }>`
  font-size: 14px;
  color: ${props => props.$mutedColor};
  margin: 0;
  line-height: 1.6;
`;

const TxLink = styled.a<{ $accentColor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.$accentColor};
  font-size: 14px;
  margin-top: 20px;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Success Celebration
const SuccessBanner = styled.div`
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.15) 100%);
  border: 2px solid rgba(16, 185, 129, 0.4);
  border-radius: 20px;
  padding: 28px 24px;
  margin-top: 20px;
  text-align: center;
`;

const SuccessTitle = styled.h4`
  color: #10B981;
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const SuccessAmount = styled.div`
  font-size: 36px;
  font-weight: 900;
  color: #10B981;
  margin-bottom: 20px;
`;

const SuccessActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

// Buttons
const ActionButton = styled.button<{ 
  $variant: 'claim' | 'share' | 'done' | 'retry';
  $disabled?: boolean;
}>`
  flex: 1;
  padding: 16px 20px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  ${({ $variant, $disabled }) => {
    if ($disabled) {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.4);
      `;
    }
    switch ($variant) {
      case 'claim':
        return `
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: #000;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          &:active { transform: scale(0.98); }
        `;
      case 'share':
        return `
          background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
          color: #fff;
          &:active { transform: scale(0.98); }
        `;
      case 'done':
        return `
          background: #10B981;
          color: #000;
          &:active { transform: scale(0.98); }
        `;
      case 'retry':
        return `
          background: #F59E0B;
          color: #000;
          &:active { transform: scale(0.98); }
        `;
    }
  }}
`;

const SpinIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  color: #EF4444;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// ==================== TYPES ====================
export type ClaimStep = 'idle' | 'signing' | 'pending' | 'confirmed' | 'indexing' | 'indexed' | 'error';

export interface ClaimPosition {
  tokenId: number;
  marketId: number;
  outcome: number;
  outcomeLabel?: string;
  amount: string;
  amountFormatted: string;
  marketQuestion?: string;
  marketStatus?: string;
  claimPreview?: {
    claimable: boolean;
    grossAmount: string;
    grossAmountFormatted: string;
    feeAmount: string;
    feeAmountFormatted: string;
    netAmount: string;
    netAmountFormatted: string;
  };
}

interface ClaimSheetProps {
  isOpen: boolean;
  position: ClaimPosition | null;
  onClose: () => void;
  onClaimed?: (txHash: string, amount: number) => void;
}

const STEP_MESSAGES: Record<ClaimStep, { title: string; desc: string }> = {
  idle: { title: 'Claim Your Winnings', desc: 'Click to withdraw your rewards' },
  signing: { title: 'Confirm Transaction', desc: 'Please confirm the transaction in your wallet' },
  pending: { title: 'Processing...', desc: 'Transaction is being confirmed on the blockchain' },
  confirmed: { title: 'Confirmed!', desc: 'Waiting for blockchain finality...' },
  indexing: { title: 'Syncing...', desc: 'Updating your balance and stats' },
  indexed: { title: 'Claimed Successfully!', desc: 'Your winnings have been transferred' },
  error: { title: 'Transaction Failed', desc: 'Something went wrong. Please try again.' },
};

// ==================== COMPONENT ====================
export function ClaimSheet({ isOpen, position, onClose, onClaimed }: ClaimSheetProps) {
  const { theme } = useTheme();
  const { isConnected, isCorrectNetwork, walletAddress, switchToCorrectNetwork } = useWallet();
  const { claim, refresh, stableBalance } = usePredictionMarket();
  
  const [step, setStep] = useState<ClaimStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setTxHash(null);
      setError(null);
    }
  }, [isOpen]);

  if (!position) return null;

  const claimAmount = position.claimPreview?.netAmountFormatted || position.amountFormatted;
  const feeAmount = position.claimPreview?.feeAmountFormatted || '0';
  const grossAmount = position.claimPreview?.grossAmountFormatted || position.amountFormatted;

  const explorerUrl = CHAIN_CONFIG.blockExplorer + '/tx/';

  const handleClaim = async () => {
    if (!isConnected || !isCorrectNetwork || !position.claimPreview?.claimable) return;
    
    setError(null);
    setStep('signing');
    triggerHaptic('medium');

    try {
      const result = await claim(position.tokenId);

      if (result.ok) {
        setTxHash(result.txHash);
        setStep('pending');
        triggerHaptic('light');

        // Wait brief for confirmation
        setStep('confirmed');
        
        // Simulate indexer sync (in production, poll backend)
        setTimeout(() => {
          setStep('indexing');
          triggerHaptic('light');
        }, 1500);

        // Success!
        setTimeout(async () => {
          setStep('indexed');
          triggerHaptic('success');
          
          // Refresh balance
          await refresh();
          
          // Callback
          const amount = parseFloat(claimAmount);
          onClaimed?.(result.txHash, amount);
        }, 3500);

      } else {
        let errorMsg = 'error' in result ? result.error : 'Transaction failed';
        if (errorMsg.includes('user rejected') || errorMsg.includes('User rejected')) {
          errorMsg = 'Transaction cancelled';
        } else if (errorMsg.includes('already claimed')) {
          errorMsg = 'Position already claimed';
        }
        setError(errorMsg);
        setStep('error');
        triggerHaptic('error');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setStep('error');
      triggerHaptic('error');
    }
  };

  const handleClose = () => {
    if (step === 'signing' || step === 'pending' || step === 'indexing') return;
    onClose();
  };

  const handleRetry = () => {
    setStep('idle');
    setError(null);
    setTxHash(null);
  };

  const isProcessing = ['signing', 'pending', 'confirmed', 'indexing'].includes(step);

  return (
    <Overlay $isOpen={isOpen} onClick={handleClose}>
      <Sheet $bgColor={theme.bgPrimary} onClick={(e) => e.stopPropagation()} data-testid="claim-sheet">
        <Handle $mutedColor={theme.textMuted} />
        
        <Header>
          <Title $textColor={theme.textPrimary}>
            {step === 'indexed' ? 'Claimed!' : 'Claim Winnings'}
          </Title>
          <CloseButton 
            onClick={handleClose}
            $bgColor={theme.bgCard}
            $textColor={theme.textPrimary}
            disabled={isProcessing}
          >
            <X size={22} />
          </CloseButton>
        </Header>

        <WinBadge>
          <Trophy size={18} />
          Position Won!
        </WinBadge>

        {/* Wrong Network */}
        {isConnected && !isCorrectNetwork && (
          <ErrorBanner>
            <AlertTriangle size={18} />
            Please switch to BSC Testnet
            <ActionButton $variant="retry" onClick={switchToCorrectNetwork} style={{ marginLeft: 'auto', flex: 0 }}>
              Switch
            </ActionButton>
          </ErrorBanner>
        )}

        {/* Error */}
        {error && step === 'error' && (
          <ErrorBanner>
            <AlertTriangle size={18} />
            {error}
          </ErrorBanner>
        )}

        {/* Processing States */}
        {isProcessing && (
          <TxStatusContainer>
            <StatusIcon $status="loading">
              <SpinIcon size={40} />
            </StatusIcon>
            <StatusTitle $textColor={theme.textPrimary}>
              {STEP_MESSAGES[step].title}
            </StatusTitle>
            <StatusDescription $mutedColor={theme.textMuted}>
              {STEP_MESSAGES[step].desc}
            </StatusDescription>
            {txHash && (
              <TxLink 
                href={`${explorerUrl}${txHash}`} 
                target="_blank"
                rel="noopener noreferrer"
                $accentColor={theme.accent}
              >
                View Transaction <ExternalLink size={14} />
              </TxLink>
            )}
          </TxStatusContainer>
        )}

        {/* Success State */}
        {step === 'indexed' && (
          <TxStatusContainer>
            <StatusIcon $status="success">
              <Check size={44} />
            </StatusIcon>
            <StatusTitle $textColor={theme.textPrimary}>
              Claimed Successfully!
            </StatusTitle>
            <StatusDescription $mutedColor={theme.textMuted}>
              ${claimAmount} has been transferred to your wallet
            </StatusDescription>
            
            <SuccessBanner>
              <SuccessTitle>
                <span>&#127881;</span> You Claimed <span>&#127881;</span>
              </SuccessTitle>
              <SuccessAmount data-testid="claim-success-amount">+${claimAmount}</SuccessAmount>
              <SuccessActions>
                <ActionButton $variant="share" data-testid="share-claim-btn">
                  <Share2 size={18} />
                  Share Win
                </ActionButton>
                <ActionButton $variant="done" onClick={handleClose} data-testid="claim-done-btn">
                  <Check size={18} />
                  Done
                </ActionButton>
              </SuccessActions>
            </SuccessBanner>

            {txHash && (
              <TxLink 
                href={`${explorerUrl}${txHash}`} 
                target="_blank"
                rel="noopener noreferrer"
                $accentColor={theme.accent}
              >
                View on BSCScan <ExternalLink size={14} />
              </TxLink>
            )}
          </TxStatusContainer>
        )}

        {/* Error State */}
        {step === 'error' && (
          <TxStatusContainer>
            <StatusIcon $status="error">
              <AlertTriangle size={40} />
            </StatusIcon>
            <StatusTitle $textColor={theme.textPrimary}>
              Transaction Failed
            </StatusTitle>
            <StatusDescription $mutedColor={theme.textMuted}>
              {error || 'Something went wrong. Please try again.'}
            </StatusDescription>
            
            <ActionButton
              $variant="retry"
              onClick={handleRetry}
              style={{ marginTop: 24 }}
              data-testid="retry-claim-btn"
            >
              Try Again
            </ActionButton>
          </TxStatusContainer>
        )}

        {/* Idle State - Claim Form */}
        {step === 'idle' && (
          <>
            {/* Position Details */}
            <PositionCard $bgColor={theme.bgCard} $borderColor={theme.border}>
              <PositionTitle $textColor={theme.textPrimary}>
                {position.marketQuestion || `Market #${position.marketId}`}
              </PositionTitle>
              
              <StatsGrid>
                <StatBox $bgColor={theme.bgPrimary}>
                  <StatLabel $mutedColor={theme.textMuted}>Your Bet</StatLabel>
                  <StatValue $textColor={theme.textPrimary}>
                    {position.outcomeLabel || (position.outcome === 0 ? 'YES' : 'NO')}
                  </StatValue>
                </StatBox>
                <StatBox $bgColor={theme.bgPrimary}>
                  <StatLabel $mutedColor={theme.textMuted}>Stake</StatLabel>
                  <StatValue $textColor={theme.textPrimary}>
                    ${position.amountFormatted}
                  </StatValue>
                </StatBox>
              </StatsGrid>
            </PositionCard>

            {/* Claim Amount */}
            <ClaimAmountContainer>
              <ClaimLabel $mutedColor={theme.textMuted}>
                You Will Receive
              </ClaimLabel>
              <ClaimAmount data-testid="claim-amount">
                ${claimAmount}
              </ClaimAmount>
              {parseFloat(feeAmount) > 0 && (
                <FeeInfo $mutedColor={theme.textMuted}>
                  Gross: ${grossAmount} | Fee: ${feeAmount} (2%)
                </FeeInfo>
              )}
            </ClaimAmountContainer>

            {/* Balance After */}
            {stableBalance && (
              <PositionCard $bgColor={theme.bgCard} $borderColor={theme.border}>
                <StatsGrid>
                  <StatBox $bgColor={theme.bgPrimary}>
                    <StatLabel $mutedColor={theme.textMuted}>Current Balance</StatLabel>
                    <StatValue $textColor={theme.textPrimary}>
                      ${parseFloat(stableBalance.balanceFormatted).toFixed(2)}
                    </StatValue>
                  </StatBox>
                  <StatBox $bgColor={theme.bgPrimary}>
                    <StatLabel $mutedColor={theme.textMuted}>After Claim</StatLabel>
                    <StatValue $textColor={theme.textPrimary} $highlight>
                      ${(parseFloat(stableBalance.balanceFormatted) + parseFloat(claimAmount)).toFixed(2)}
                    </StatValue>
                  </StatBox>
                </StatsGrid>
              </PositionCard>
            )}

            {/* Claim Button */}
            <ActionButton
              $variant="claim"
              onClick={handleClaim}
              $disabled={!isConnected || !isCorrectNetwork || !position.claimPreview?.claimable}
              disabled={!isConnected || !isCorrectNetwork || !position.claimPreview?.claimable}
              data-testid="claim-btn"
            >
              <DollarSign size={22} />
              Claim ${claimAmount}
            </ActionButton>
          </>
        )}
      </Sheet>
    </Overlay>
  );
}

export default ClaimSheet;
