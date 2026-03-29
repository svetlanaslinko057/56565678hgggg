'use client';

import React, { useState } from 'react';
import styled from 'styled-components';

interface BoostBetButtonProps {
  betId: string;
  wallet: string;
  disabled?: boolean;
  onBoostSuccess?: (result: any) => void;
  onBoostError?: (error: Error) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const Button = styled.button<{ $boosted?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  background: ${({ $boosted }) => $boosted ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)' : 'rgba(255, 165, 0, 0.1)'};
  border: ${({ $boosted }) => $boosted ? 'none' : '1px solid rgba(255, 165, 0, 0.3)'};
  color: ${({ $boosted }) => $boosted ? '#fff' : '#ffa500'};
  &:hover:not(:disabled) { background: ${({ $boosted }) => $boosted ? '' : 'rgba(255, 165, 0, 0.2)'}; }
`;

export function BoostBetButton({ betId, wallet, disabled, onBoostSuccess, onBoostError }: BoostBetButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);

  const handleBoost = async () => {
    if (isLoading || isBoosted || disabled) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/monetization/boost/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': wallet },
        body: JSON.stringify({ betId, boostAmount: 1 }),
      });
      const result = await response.json();
      if (result.success) {
        setIsBoosted(true);
        if (onBoostSuccess) onBoostSuccess(result.data);
      } else {
        throw new Error(result.error || 'Boost failed');
      }
    } catch (error) {
      if (onBoostError) onBoostError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleBoost} $boosted={isBoosted} $disabled={disabled || isLoading} disabled={disabled || isLoading || isBoosted} data-testid="boost-bet-button">
      {isLoading ? 'Loading...' : isBoosted ? <>&#128293; Boosted</> : <>&#128293; Boost <span style={{fontSize: 11, opacity: 0.8}}>($1)</span></>}
    </Button>
  );
}

export default BoostBetButton;
