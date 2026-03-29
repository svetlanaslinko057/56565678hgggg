'use client';

import React, { useState } from 'react';
import styled from 'styled-components';

interface FeatureDuelButtonProps {
  duelId: string;
  wallet: string;
  disabled?: boolean;
  onFeatureSuccess?: (result: any) => void;
  onFeatureError?: (error: Error) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const Button = styled.button<{ $featured?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  background: ${({ $featured }) => $featured ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'rgba(255, 215, 0, 0.1)'};
  border: ${({ $featured }) => $featured ? 'none' : '1px solid rgba(255, 215, 0, 0.3)'};
  color: ${({ $featured }) => $featured ? '#000' : '#ffd700'};
  &:hover:not(:disabled) { transform: translateY(-2px); }
`;

const FeaturedBadgeStyled = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: #ffd700;
`;

export function FeatureDuelButton({ duelId, wallet, disabled, onFeatureSuccess, onFeatureError }: FeatureDuelButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const handleFeature = async () => {
    if (isLoading || isFeatured || disabled) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/monetization/boost/duel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': wallet },
        body: JSON.stringify({ duelId, boostAmount: 2 }),
      });
      const result = await response.json();
      if (result.success) {
        setIsFeatured(true);
        if (onFeatureSuccess) onFeatureSuccess(result.data);
      } else {
        throw new Error(result.error || 'Feature failed');
      }
    } catch (error) {
      if (onFeatureError) onFeatureError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleFeature} $featured={isFeatured} $disabled={disabled || isLoading} disabled={disabled || isLoading || isFeatured} data-testid="feature-duel-button">
      {isLoading ? 'Loading...' : isFeatured ? <>&#11088; Featured</> : <>&#128293; Make Featured <span style={{fontSize: 12, opacity: 0.8}}>($2)</span></>}
    </Button>
  );
}

export function FeaturedDuelBadge() {
  return <FeaturedBadgeStyled data-testid="featured-badge">&#11088; FEATURED</FeaturedBadgeStyled>;
}

export default FeatureDuelButton;
