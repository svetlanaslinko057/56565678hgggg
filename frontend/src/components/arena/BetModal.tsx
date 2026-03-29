'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Loader2, Check, AlertCircle, ExternalLink, Wallet } from 'lucide-react';
import { useWallet } from '@/lib/wagmi';
import { useBet, BetStatus } from '@/hooks/useBet';
import { MarketsAPI } from '@/lib/api/arena';
import { env } from '@/lib/web3/env';

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
  max-width: 420px;
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

const OutcomeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const OutcomeButton = styled.button<{ $selected?: boolean; $type?: 'yes' | 'no' }>`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $selected, $type }) => $selected ? `
    background: ${$type === 'yes' ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'linear-gradient(135deg, #ff6b6b, #ff4757)'};
    color: ${$type === 'yes' ? '#000' : '#fff'};
    border: none;
    transform: scale(1.02);
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: ${$type === 'yes' ? '#00ff88' : '#ff6b6b'};
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

// Main Button
const BetButton = styled.button<{ $disabled?: boolean; $loading?: boolean }>`
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
  
  ${({ $disabled, $loading }) => $disabled || $loading ? `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.4);
    border: none;
  ` : `
    background: linear-gradient(135deg, #00ff88, #00cc66);
    color: #000;
    border: none;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
    }
  `}
  
  ${({ $loading }) => $loading && `
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
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

const OffchainNotice = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #FCD34D;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
`;

// ============== COMPONENT ==============
interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: {
    id: string;
    question: string;
    outcomes: Array<{
      id: string;
      label: string;
      probability?: number;
    }>;
  };
  onBetPlaced?: () => void;
}

export const BetModal: React.FC<BetModalProps> = ({
  isOpen,
  onClose,
  market,
  onBetPlaced,
}) => {
  const { isConnected, isAuthenticated, connectWallet, signIn, isAuthenticating } = useWallet();
  const bet = useBet();
  
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Auto-select first outcome
  useEffect(() => {
    if (market.outcomes.length > 0 && !selectedOutcome) {
      setSelectedOutcome(market.outcomes[0].id);
    }
  }, [market.outcomes, selectedOutcome]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      bet.reset();
      setAmount('');
      setPreview(null);
    }
  }, [isOpen]);

  // Fetch preview
  useEffect(() => {
    const fetchPreview = async () => {
      const amountNum = parseFloat(amount);
      if (!selectedOutcome || isNaN(amountNum) || amountNum <= 0) {
        setPreview(null);
        return;
      }

      setLoadingPreview(true);
      try {
        const result = await MarketsAPI.betPreview(market.id, amountNum, selectedOutcome);
        setPreview(result);
      } catch {
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [market.id, selectedOutcome, amount]);

  const handlePlaceBet = async () => {
    if (!selectedOutcome || !amount) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const result = await bet.placeBet({
      marketId: market.id,
      outcomeId: selectedOutcome,
      amount: amountNum,
    });

    if (result.success) {
      onBetPlaced?.();
      // Keep modal open to show success state
    }
  };

  const handleClose = () => {
    if (!bet.isLoading) {
      onClose();
      bet.reset();
    }
  };

  if (!isOpen) return null;

  const amountNum = parseFloat(amount) || 0;
  const canBet = isAuthenticated && selectedOutcome && amountNum > 0 && !bet.isLoading;
  const explorerUrl = env.CHAIN_ID === 56 
    ? 'https://bscscan.com/tx/' 
    : 'https://testnet.bscscan.com/tx/';

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()} data-testid="bet-modal">
        <Header>
          <Title>Place Bet</Title>
          <CloseButton onClick={handleClose} disabled={bet.isLoading}>
            <X size={18} />
          </CloseButton>
        </Header>

        <Content>
          {/* Market Info */}
          <MarketInfo>
            <MarketTitle>{market.question}</MarketTitle>
          </MarketInfo>

          {/* Not Connected */}
          {!isConnected && (
            <ConnectPrompt>
              <p>Connect your wallet to place bets</p>
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
              {/* Off-chain notice */}
              {!env.ONCHAIN_ENABLED && (
                <OffchainNotice>
                  On-chain betting is disabled. Bets are simulated.
                </OffchainNotice>
              )}

              {/* Error */}
              {bet.isError && (
                <ErrorBanner>
                  <AlertCircle size={16} />
                  {bet.error}
                </ErrorBanner>
              )}

              {/* Transaction in progress or complete */}
              {(bet.isLoading || bet.isSuccess) && (
                <TxStatusContainer>
                  <StatusIcon $status={bet.isSuccess ? 'success' : 'loading'}>
                    {bet.isSuccess ? <Check size={32} /> : <SpinIcon size={32} />}
                  </StatusIcon>
                  <StatusTitle>
                    {bet.isSuccess ? 'Bet Placed!' : bet.statusMessage}
                  </StatusTitle>
                  <StatusDescription>
                    {bet.isSuccess 
                      ? `Your bet of $${amount} has been confirmed on the blockchain.`
                      : 'Please wait while your transaction is being processed...'
                    }
                  </StatusDescription>
                  {bet.txHash && (
                    <TxLink 
                      href={`${explorerUrl}${bet.txHash}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Explorer <ExternalLink size={14} />
                    </TxLink>
                  )}
                </TxStatusContainer>
              )}

              {/* Bet Form - only show when idle or error */}
              {!bet.isLoading && !bet.isSuccess && (
                <>
                  {/* Outcome Selector */}
                  <OutcomeSelector>
                    {market.outcomes.map((outcome) => (
                      <OutcomeButton
                        key={outcome.id}
                        $selected={selectedOutcome === outcome.id}
                        $type={outcome.id === 'yes' || outcome.label.toLowerCase() === 'yes' ? 'yes' : 'no'}
                        onClick={() => setSelectedOutcome(outcome.id)}
                        data-testid={`outcome-${outcome.id}`}
                      >
                        {outcome.label}
                        {outcome.probability && (
                          <span style={{ marginLeft: 8, opacity: 0.7 }}>
                            {outcome.probability}%
                          </span>
                        )}
                      </OutcomeButton>
                    ))}
                  </OutcomeSelector>

                  {/* Amount Input */}
                  <InputGroup>
                    <Label>Bet Amount</Label>
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
                      <QuickButton onClick={() => setAmount('250')}>$250</QuickButton>
                    </QuickAmounts>
                  </InputGroup>

                  {/* Preview */}
                  {preview && amountNum > 0 && (
                    <PreviewCard>
                      <PreviewRow>
                        <PreviewLabel>Odds</PreviewLabel>
                        <PreviewValue>{preview.odds?.toFixed(2)}x</PreviewValue>
                      </PreviewRow>
                      <PreviewRow>
                        <PreviewLabel>Platform Fee</PreviewLabel>
                        <PreviewValue>${preview.fee?.toFixed(2)}</PreviewValue>
                      </PreviewRow>
                      <PreviewRow>
                        <PreviewLabel>Potential Return</PreviewLabel>
                        <PreviewValue $highlight>${preview.potentialReturn?.toFixed(2)}</PreviewValue>
                      </PreviewRow>
                    </PreviewCard>
                  )}

                  {/* Bet Button */}
                  <BetButton
                    onClick={handlePlaceBet}
                    $disabled={!canBet}
                    disabled={!canBet}
                    data-testid="place-bet-btn"
                  >
                    {loadingPreview ? (
                      <>
                        <SpinIcon size={18} />
                        Calculating...
                      </>
                    ) : (
                      'Place Bet'
                    )}
                  </BetButton>
                </>
              )}

              {/* Success - Close Button */}
              {bet.isSuccess && (
                <BetButton onClick={handleClose} data-testid="close-success-btn">
                  Done
                </BetButton>
              )}
            </>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

export default BetModal;
