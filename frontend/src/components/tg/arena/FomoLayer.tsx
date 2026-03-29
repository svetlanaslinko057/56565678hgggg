'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Flame, Clock, TrendingUp } from 'lucide-react';
import { MarketFomo } from './types';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const FomoContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const FomoBadge = styled.div<{ $type: 'whale' | 'trending' | 'urgency' | 'streak' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  
  ${({ $type }) => {
    switch ($type) {
      case 'whale':
        return `
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.15) 0%, rgba(0, 150, 255, 0.08) 100%);
          color: #00c8ff;
          border: 1px solid rgba(0, 200, 255, 0.3);
        `;
      case 'trending':
        return `
          background: linear-gradient(135deg, rgba(255, 77, 79, 0.15) 0%, rgba(255, 100, 100, 0.08) 100%);
          color: #ff4d4f;
          border: 1px solid rgba(255, 77, 79, 0.3);
        `;
      case 'urgency':
        return `
          background: linear-gradient(135deg, rgba(255, 165, 0, 0.15) 0%, rgba(255, 200, 0, 0.08) 100%);
          color: #ffa500;
          border: 1px solid rgba(255, 165, 0, 0.3);
        `;
      case 'streak':
        return `
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(180, 100, 255, 0.08) 100%);
          color: #b464ff;
          border: 1px solid rgba(138, 43, 226, 0.3);
        `;
    }
  }}
`;

interface FomoLayerProps {
  fomo: MarketFomo;
  compact?: boolean;
}

export function FomoLayer({ fomo, compact = false }: FomoLayerProps) {
  if (!fomo.trending && !fomo.whale && !fomo.urgency && !fomo.hotStreak) {
    return null;
  }

  return (
    <FomoContainer>
      {fomo.whale && (
        <FomoBadge $type="whale">
          🐋 ${fomo.whale.amount.toLocaleString()} {fomo.whale.side} {!compact && fomo.whale.timeAgo}
        </FomoBadge>
      )}
      
      {fomo.trending && (
        <FomoBadge $type="trending">
          <Flame size={12} /> Trending
        </FomoBadge>
      )}
      
      {fomo.urgency === 'high' && (
        <FomoBadge $type="urgency">
          <Clock size={12} /> Closing soon
        </FomoBadge>
      )}
      
      {fomo.hotStreak && fomo.hotStreak > 5 && (
        <FomoBadge $type="streak">
          <TrendingUp size={12} /> {fomo.hotStreak} bets/hr
        </FomoBadge>
      )}
    </FomoContainer>
  );
}

export default FomoLayer;
