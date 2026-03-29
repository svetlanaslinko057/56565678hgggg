'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useArena } from '@/lib/api/ArenaContext';
import { MarketsAPI } from '@/lib/api/arena';

const PanelContainer = styled.div`
  background: rgba(30, 30, 40, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
`;

const OutcomeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const OutcomeButton = styled.button<{ $selected?: boolean; $type?: 'yes' | 'no' }>`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $selected, $type }) => {
    if ($selected) {
      return $type === 'yes' 
        ? `background: linear-gradient(135deg, #00ff88, #00cc66); color: #000; border: none;`
        : `background: linear-gradient(135deg, #ff6b6b, #ff4757); color: #fff; border: none;`;
    }
    return `
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: ${$type === 'yes' ? '#00ff88' : '#ff6b6b'};
      }
    `;
  }}
`;

const StakeInput = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 60px 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
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
`;

const QuickAmounts = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
`;

const QuickButton = styled.button`
  flex: 1;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const PreviewSection = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
`;

const PreviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const PlaceButton = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  ${({ $disabled }) => $disabled ? `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
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
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 10px;
  color: #ff6b6b;
  font-size: 13px;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 10px;
  color: #00ff88;
  font-size: 13px;
  margin-bottom: 16px;
`;

interface BetPanelProps {
  marketId: string;
  outcomes: Array<{
    id: string;
    label: string;
    yesMultiplier?: number;
    noMultiplier?: number;
  }>;
  onBetPlaced?: () => void;
}

export const BetPanel: React.FC<BetPanelProps> = ({ marketId, outcomes, onBetPlaced }) => {
  const { balance, refreshBalance, refreshPositions } = useArena();
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [stake, setStake] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-select first outcome
  useEffect(() => {
    if (outcomes.length > 0 && !selectedOutcome) {
      setSelectedOutcome(outcomes[0].id);
    }
  }, [outcomes, selectedOutcome]);

  // Fetch preview when stake or outcome changes
  useEffect(() => {
    const fetchPreview = async () => {
      const stakeNum = parseFloat(stake);
      if (!selectedOutcome || isNaN(stakeNum) || stakeNum <= 0) {
        setPreview(null);
        return;
      }

      try {
        const result = await MarketsAPI.betPreview(marketId, stakeNum, selectedOutcome);
        setPreview(result);
      } catch {
        setPreview(null);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [marketId, selectedOutcome, stake]);

  const handlePlaceBet = async () => {
    if (!selectedOutcome || !stake) return;
    
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    if (stakeNum > balance) {
      setError(`Insufficient balance. Available: $${balance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await MarketsAPI.placeBet(marketId, stakeNum, selectedOutcome);
      
      if (result.success) {
        setSuccess(`Bet placed! Potential return: $${preview?.potentialReturn?.toFixed(2) || 'N/A'}`);
        setStake('');
        await refreshBalance();
        await refreshPositions();
        onBetPlaced?.();
      } else {
        setError(result.error || 'Failed to place bet');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stakeNum = parseFloat(stake) || 0;
  const canBet = selectedOutcome && stakeNum > 0 && stakeNum <= balance;

  return (
    <PanelContainer>
      <Title>Place Prediction</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <OutcomeSelector>
        {outcomes.map((outcome) => (
          <OutcomeButton
            key={outcome.id}
            $selected={selectedOutcome === outcome.id}
            $type={outcome.id === 'yes' || outcome.label.toLowerCase() === 'yes' ? 'yes' : 'no'}
            onClick={() => setSelectedOutcome(outcome.id)}
          >
            {outcome.label}
          </OutcomeButton>
        ))}
      </OutcomeSelector>
      
      <StakeInput>
        <Label>Stake Amount</Label>
        <InputWrapper>
          <Input
            type="number"
            placeholder="0.00"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            min="0"
            step="10"
          />
          <Currency>USDT</Currency>
        </InputWrapper>
        <QuickAmounts>
          <QuickButton onClick={() => setStake('25')}>$25</QuickButton>
          <QuickButton onClick={() => setStake('50')}>$50</QuickButton>
          <QuickButton onClick={() => setStake('100')}>$100</QuickButton>
          <QuickButton onClick={() => setStake(String(Math.floor(balance)))}>MAX</QuickButton>
        </QuickAmounts>
      </StakeInput>
      
      {preview && (
        <PreviewSection>
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
        </PreviewSection>
      )}
      
      <PlaceButton
        onClick={handlePlaceBet}
        $disabled={!canBet || loading}
        disabled={!canBet || loading}
      >
        {loading ? 'Placing Bet...' : 'Place Bet'}
      </PlaceButton>
    </PanelContainer>
  );
};

export default BetPanel;
