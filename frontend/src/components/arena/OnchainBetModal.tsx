'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Loader2, Check, AlertCircle, ExternalLink, Wallet, ArrowRight } from 'lucide-react';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket } from '@/lib/contracts';
import { CHAIN_CONFIG } from '@/lib/contracts/config';
import * as PredictionMarket from '@/lib/contracts/predictionMarket';

// ============== ANIMATIONS ==============
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

// ============== STYLED COMPONENTS ==============
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Modal = styled.div`
  background: #1a1a2e;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Content = styled.div`
  padding: 24px;
`;

const MarketInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const MarketTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 8px 0;
`;

const MarketMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const OutcomeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const OutcomeButton = styled.button<{ $selected?: boolean; $color?: string }>`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $selected, $color }) => $selected ? `
    background: ${$color || 'linear-gradient(135deg, #00ff88, #00cc66)'};
    color: #000;
    border: none;
    transform: scale(1.02);
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }
  `}
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 70px 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  
  &:focus {
    outline: none;
    border-color: #00ff88;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Currency = styled.span`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
`;

const QuickAmounts = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const QuickButton = styled.button`
  flex: 1;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
`;

const BalanceLabel = styled.span`
  color: rgba(255, 255, 255, 0.5);
`;

const BalanceValue = styled.span`
  color: #fff;
  font-weight: 600;
`;

const AllowanceWarning = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #FCD34D;
`;

const PreviewCard = styled.div`
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const PreviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const PreviewLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const PreviewValue = styled.span<{ $highlight?: boolean }>`
  font-weight: 600;
  font-size: 14px;
  color: ${({ $highlight }) => $highlight ? '#00ff88' : '#fff'};
`;

// Transaction Status UI
const TxStatusContainer = styled.div`
  text-align: center;
  padding: 20px 0;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  
  ${({ $status }) => {
    switch ($status) {
      case 'loading':
        return `background: rgba(0, 255, 136, 0.1);`;
      case 'success':
        return `background: rgba(0, 255, 136, 0.2);`;
      case 'error':
        return `background: rgba(255, 107, 107, 0.2);`;
    }
  }}
  
  svg {
    ${({ $status }) => $status === 'loading' && `animation: ${spin} 1s linear infinite;`}
    color: ${({ $status }) => {
      switch ($status) {
        case 'loading': return '#00ff88';
        case 'success': return '#00ff88';
        case 'error': return '#ff6b6b';
      }
    }};
  }
`;

const StatusTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
`;

const StatusDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
`;

const TxLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #00ff88;
  font-size: 13px;
  margin-top: 12px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const Step = styled.div<{ $active?: boolean; $completed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  
  ${({ $active, $completed }) => {
    if ($completed) return `background: rgba(0, 255, 136, 0.2); color: #00ff88;`;
    if ($active) return `background: rgba(251, 191, 36, 0.2); color: #FCD34D;`;
    return `background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4);`;
  }}
`;

// Main Button
const BetButton = styled.button<{ $disabled?: boolean; $loading?: boolean; $variant?: string }>`
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  
  ${({ $disabled, $loading, $variant }) => {
    if ($disabled || $loading) {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.4);
        border: none;
      `;
    }
    if ($variant === 'approve') {
      return `
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #000;
        border: none;
        &:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
        }
      `;
    }
    return `
      background: linear-gradient(135deg, #00ff88, #00cc66);
      color: #000;
      border: none;
      &:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
      }
    `;
  }}
  
  ${({ $loading }) => $loading && `animation: ${pulse} 1.5s ease-in-out infinite;`}
`;

const SpinIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 24px;
  
  p {
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 16px;
  }
`;

const ConnectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: #0f172a;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: #1e293b;
  }
`;

const ErrorBanner = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #ff6b6b;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// ============== TYPES ==============
interface OnchainBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: {
    id: string;
    onchainId?: number; // On-chain market ID
    question: string;
    outcomes: Array<{
      id: string;
      label: string;
      index: number; // On-chain outcome index
      probability?: number;
      poolSize?: string;
    }>;
    totalStaked?: string;
    endTime?: number;
  };
  onBetPlaced?: (tokenId: number) => void;
}

type TxStep = 'idle' | 'approving' | 'approved' | 'betting' | 'success' | 'error';

// ============== COMPONENT ==============
export const OnchainBetModal: React.FC<OnchainBetModalProps> = ({
  isOpen,
  onClose,
  market,
  onBetPlaced,
}) => {
  const { isConnected, isAuthenticated, walletAddress, connectWallet, signIn, isAuthenticating } = useWallet();
  const { 
    config, 
    stableBalance, 
    loading: contractLoading, 
    error: contractError,
    marketAddress,
    approve: approveToken,
    placeBet: placeBetOnchain,
    refresh
  } = usePredictionMarket();
  
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [txStep, setTxStep] = useState<TxStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first outcome
  useEffect(() => {
    if (market.outcomes.length > 0 && selectedOutcome === null) {
      setSelectedOutcome(market.outcomes[0].index);
    }
  }, [market.outcomes, selectedOutcome]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTxStep('idle');
      setTxHash(null);
      setTokenId(null);
      setError(null);
      setAmount('');
      refresh();
    }
  }, [isOpen, refresh]);

  const amountNum = parseFloat(amount) || 0;
  const amountBigInt = amountNum > 0 && stableBalance 
    ? BigInt(Math.floor(amountNum * (10 ** stableBalance.decimals)))
    : BigInt(0);
  
  const needsApproval = stableBalance && amountBigInt > stableBalance.allowance;
  const hasInsufficientBalance = stableBalance && amountBigInt > stableBalance.balance;
  const minBet = config ? parseFloat(config.minBetFormatted) : 0;
  const belowMinBet = amountNum > 0 && amountNum < minBet;

  const canBet = isAuthenticated && 
    selectedOutcome !== null && 
    amountNum > 0 && 
    !hasInsufficientBalance && 
    !belowMinBet &&
    market.onchainId !== undefined &&
    txStep === 'idle';

  const handleApprove = async () => {
    if (!amount) return;
    
    setTxStep('approving');
    setError(null);
    
    // Approve a large amount (max uint256 style)
    const approveAmount = String(Number(amount) * 100); // Approve 100x to avoid frequent approvals
    const result = await approveToken(approveAmount);
    
    if (result.ok) {
      setTxStep('approved');
      setTxHash(result.txHash);
      // Auto-proceed to bet after short delay
      setTimeout(() => handlePlaceBet(), 1000);
    } else {
      setTxStep('error');
      setError('error' in result ? result.error : 'Unknown error');
    }
  };

  const handlePlaceBet = async () => {
    if (selectedOutcome === null || !amount || market.onchainId === undefined) return;
    
    setTxStep('betting');
    setError(null);
    
    const result = await placeBetOnchain(market.onchainId, selectedOutcome, amount);
    
    if (result.ok) {
      setTxHash(result.txHash);
      
      // Extract token ID from receipt
      const tokenIdResult = await PredictionMarket.extractPlacedTokenId(marketAddress, result.receipt);
      if (tokenIdResult.ok) {
        setTokenId(tokenIdResult.data);
      }
      
      setTxStep('success');
      onBetPlaced?.(tokenIdResult.ok ? tokenIdResult.data : 0);
    } else {
      setTxStep('error');
      setError('error' in result ? result.error : 'Unknown error');
    }
  };

  const handleClose = () => {
    if (txStep !== 'approving' && txStep !== 'betting') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const explorerUrl = CHAIN_CONFIG.blockExplorer + '/tx/';

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()} data-testid="onchain-bet-modal">
        <Header>
          <Title>Place On-Chain Bet</Title>
          <CloseButton onClick={handleClose} disabled={txStep === 'approving' || txStep === 'betting'}>
            <X size={18} />
          </CloseButton>
        </Header>

        <Content>
          {/* Market Info */}
          <MarketInfo>
            <MarketTitle>{market.question}</MarketTitle>
            <MarketMeta>
              {market.totalStaked && <span>Pool: ${market.totalStaked}</span>}
              {market.endTime && <span>Ends: {new Date(market.endTime * 1000).toLocaleDateString()}</span>}
            </MarketMeta>
          </MarketInfo>

          {/* Not Connected */}
          {!isConnected && (
            <ConnectPrompt>
              <p>Connect your wallet to place on-chain bets</p>
              <ConnectButton onClick={connectWallet} data-testid="modal-connect-btn">
                <Wallet size={18} />
                Connect Wallet
              </ConnectButton>
            </ConnectPrompt>
          )}

          {/* Connected but not authenticated */}
          {isConnected && !isAuthenticated && (
            <ConnectPrompt>
              <p>Sign in to place bets</p>
              <ConnectButton onClick={signIn} disabled={isAuthenticating} data-testid="modal-signin-btn">
                <Wallet size={18} />
                {isAuthenticating ? 'Signing...' : 'Sign In'}
              </ConnectButton>
            </ConnectPrompt>
          )}

          {/* Authenticated - Show Bet Form */}
          {isAuthenticated && (
            <>
              {/* Error */}
              {(error || contractError) && (
                <ErrorBanner>
                  <AlertCircle size={16} />
                  {error || contractError}
                </ErrorBanner>
              )}

              {/* Transaction in progress */}
              {(txStep === 'approving' || txStep === 'betting' || txStep === 'approved') && (
                <>
                  <StepIndicator>
                    <Step $completed={txStep === 'approved' || txStep === 'betting'} $active={txStep === 'approving'}>
                      {txStep === 'approving' ? <SpinIcon size={14} /> : <Check size={14} />}
                      Approve
                    </Step>
                    <ArrowRight size={14} color="rgba(255,255,255,0.3)" />
                    <Step $completed={false} $active={txStep === 'betting'}>
                      {txStep === 'betting' ? <SpinIcon size={14} /> : null}
                      Place Bet
                    </Step>
                  </StepIndicator>
                  
                  <TxStatusContainer>
                    <StatusIcon $status="loading">
                      <SpinIcon size={32} />
                    </StatusIcon>
                    <StatusTitle>
                      {txStep === 'approving' && 'Approving Token...'}
                      {txStep === 'approved' && 'Token Approved!'}
                      {txStep === 'betting' && 'Placing Bet...'}
                    </StatusTitle>
                    <StatusDescription>
                      {txStep === 'approving' && 'Please confirm the transaction in your wallet'}
                      {txStep === 'approved' && 'Now placing your bet...'}
                      {txStep === 'betting' && 'Please confirm the bet transaction'}
                    </StatusDescription>
                  </TxStatusContainer>
                </>
              )}

              {/* Success */}
              {txStep === 'success' && (
                <TxStatusContainer>
                  <StatusIcon $status="success">
                    <Check size={32} />
                  </StatusIcon>
                  <StatusTitle>Bet Placed Successfully!</StatusTitle>
                  <StatusDescription>
                    Your bet of ${amount} has been confirmed on-chain.
                    {tokenId && <><br />Position NFT Token ID: #{tokenId}</>}
                  </StatusDescription>
                  {txHash && (
                    <TxLink 
                      href={`${explorerUrl}${txHash}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Explorer <ExternalLink size={14} />
                    </TxLink>
                  )}
                </TxStatusContainer>
              )}

              {/* Error State */}
              {txStep === 'error' && (
                <TxStatusContainer>
                  <StatusIcon $status="error">
                    <AlertCircle size={32} />
                  </StatusIcon>
                  <StatusTitle>Transaction Failed</StatusTitle>
                  <StatusDescription>{error || 'Something went wrong'}</StatusDescription>
                </TxStatusContainer>
              )}

              {/* Bet Form - only show when idle or error */}
              {(txStep === 'idle' || txStep === 'error') && (
                <>
                  {/* Balance */}
                  {stableBalance && (
                    <BalanceRow>
                      <BalanceLabel>Your Balance</BalanceLabel>
                      <BalanceValue>{parseFloat(stableBalance.balanceFormatted).toFixed(2)} USDT</BalanceValue>
                    </BalanceRow>
                  )}

                  {/* Outcome Selector */}
                  <OutcomeSelector>
                    {market.outcomes.map((outcome) => (
                      <OutcomeButton
                        key={outcome.id}
                        $selected={selectedOutcome === outcome.index}
                        $color={outcome.index === 0 ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'linear-gradient(135deg, #ff6b6b, #ff4757)'}
                        onClick={() => setSelectedOutcome(outcome.index)}
                        data-testid={`outcome-${outcome.index}`}
                      >
                        {outcome.label}
                        {outcome.probability !== undefined && (
                          <span style={{ marginLeft: 8, opacity: 0.7 }}>
                            {outcome.probability}%
                          </span>
                        )}
                      </OutcomeButton>
                    ))}
                  </OutcomeSelector>

                  {/* Amount Input */}
                  <InputGroup>
                    <Label>Bet Amount {config && `(Min: ${config.minBetFormatted} USDT)`}</Label>
                    <InputWrapper>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="10"
                        data-testid="bet-amount-input"
                      />
                      <Currency>USDT</Currency>
                    </InputWrapper>
                    <QuickAmounts>
                      <QuickButton onClick={() => setAmount('25')}>$25</QuickButton>
                      <QuickButton onClick={() => setAmount('50')}>$50</QuickButton>
                      <QuickButton onClick={() => setAmount('100')}>$100</QuickButton>
                      {stableBalance && (
                        <QuickButton onClick={() => setAmount(stableBalance.balanceFormatted)}>MAX</QuickButton>
                      )}
                    </QuickAmounts>
                  </InputGroup>

                  {/* Warnings */}
                  {hasInsufficientBalance && (
                    <ErrorBanner>
                      <AlertCircle size={16} />
                      Insufficient balance
                    </ErrorBanner>
                  )}

                  {belowMinBet && (
                    <ErrorBanner>
                      <AlertCircle size={16} />
                      Minimum bet is {config?.minBetFormatted} USDT
                    </ErrorBanner>
                  )}

                  {needsApproval && !hasInsufficientBalance && !belowMinBet && amountNum > 0 && (
                    <AllowanceWarning>
                      You need to approve USDT spending first
                    </AllowanceWarning>
                  )}

                  {/* Preview */}
                  {amountNum > 0 && !hasInsufficientBalance && !belowMinBet && (
                    <PreviewCard>
                      <PreviewRow>
                        <PreviewLabel>Your Stake</PreviewLabel>
                        <PreviewValue>${amountNum.toFixed(2)} USDT</PreviewValue>
                      </PreviewRow>
                      {config && (
                        <PreviewRow>
                          <PreviewLabel>Platform Fee</PreviewLabel>
                          <PreviewValue>{(config.claimFeeBps / 100).toFixed(1)}%</PreviewValue>
                        </PreviewRow>
                      )}
                      <PreviewRow>
                        <PreviewLabel>Position</PreviewLabel>
                        <PreviewValue $highlight>NFT Token</PreviewValue>
                      </PreviewRow>
                    </PreviewCard>
                  )}

                  {/* Approve or Bet Button */}
                  {needsApproval && !hasInsufficientBalance && !belowMinBet && amountNum > 0 ? (
                    <BetButton
                      onClick={handleApprove}
                      $variant="approve"
                      $disabled={!canBet}
                      disabled={!canBet}
                      data-testid="approve-btn"
                    >
                      Approve USDT
                    </BetButton>
                  ) : (
                    <BetButton
                      onClick={handlePlaceBet}
                      $disabled={!canBet}
                      disabled={!canBet}
                      data-testid="place-bet-btn"
                    >
                      Place Bet
                    </BetButton>
                  )}
                </>
              )}

              {/* Success/Error - Close Button */}
              {(txStep === 'success' || txStep === 'error') && (
                <BetButton onClick={handleClose} data-testid="close-btn">
                  {txStep === 'success' ? 'Done' : 'Try Again'}
                </BetButton>
              )}
            </>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

export default OnchainBetModal;
