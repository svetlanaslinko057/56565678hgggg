'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useLiveActivity } from '@/hooks/useSocket';

const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const Container = styled.div`
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(15, 15, 25, 0) 0%, rgba(15, 15, 25, 0.95) 30%);
  padding: 8px 0 12px;
  z-index: 40;
  pointer-events: none;
  
  @media (min-width: 768px) {
    bottom: 0;
    padding: 12px 0;
  }
`;

const TickerWrapper = styled.div`
  overflow: hidden;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 40px;
    z-index: 2;
  }
  
  &::before {
    left: 0;
    background: linear-gradient(90deg, rgba(15, 15, 25, 1), transparent);
  }
  
  &::after {
    right: 0;
    background: linear-gradient(270deg, rgba(15, 15, 25, 1), transparent);
  }
`;

const TickerTrack = styled.div`
  display: flex;
  gap: 32px;
  animation: ${scroll} 30s linear infinite;
  white-space: nowrap;
  
  &:hover {
    animation-play-state: paused;
  }
`;

const TickerItem = styled.div<{ $type?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${({ $type }) => {
    switch ($type) {
      case 'whale': return 'rgba(255, 193, 7, 0.15)';
      case 'win': return 'rgba(0, 255, 136, 0.15)';
      case 'edge': return 'rgba(156, 39, 176, 0.15)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border-radius: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid ${({ $type }) => {
    switch ($type) {
      case 'whale': return 'rgba(255, 193, 7, 0.3)';
      case 'win': return 'rgba(0, 255, 136, 0.3)';
      case 'edge': return 'rgba(156, 39, 176, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const Icon = styled.span`
  font-size: 14px;
`;

const Amount = styled.span<{ $positive?: boolean }>`
  font-weight: 700;
  color: ${({ $positive }) => $positive ? '#00ff88' : '#ffc107'};
`;

const Side = styled.span<{ $side?: string }>`
  font-weight: 600;
  color: ${({ $side }) => 
    $side?.toLowerCase() === 'yes' ? '#00ff88' : '#ff6b6b'
  };
`;

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #00ff88;
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  background: #00ff88;
  border-radius: 50%;
  animation: ${pulse} 2s infinite;
`;

const StatsCount = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 4px;
`;

interface TickerActivity {
  id: string;
  type: 'bet' | 'whale' | 'win' | 'edge';
  message: string;
  icon: string;
  amount?: number;
  side?: string;
  marketId?: string;
}

/**
 * LiveActivityTicker
 * 
 * Scrolling ticker showing real-time activity:
 * - Whale bets
 * - Wins
 * - Edge jumps
 * - Recent bets
 */
export const LiveActivityTicker: React.FC = () => {
  const { activities, isLive } = useLiveActivity(20);
  const [tickerItems, setTickerItems] = useState<TickerActivity[]>([]);

  useEffect(() => {
    // Convert activities to ticker format
    const items: TickerActivity[] = activities.map((activity, index) => {
      const isWhale = (activity.stake || 0) >= 100;
      const isWin = activity.type === 'POSITION_WON';
      const isEdge = activity.type === 'EDGE_JUMP';
      
      const wallet = activity.wallet || activity.user || 'Someone';
      const shortWallet = wallet.length > 10 
        ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
        : wallet;

      let type: TickerActivity['type'] = 'bet';
      let icon = '🎯';
      let message = '';

      if (isWhale) {
        type = 'whale';
        icon = '🐋';
        message = `${shortWallet} bet $${activity.stake}`;
      } else if (isWin) {
        type = 'win';
        icon = '🎉';
        message = `${shortWallet} won $${activity.winnings?.toFixed(0) || '?'}`;
      } else if (isEdge) {
        type = 'edge';
        icon = '⚡';
        message = `Edge +${activity.edge?.toFixed(1)}%`;
      } else {
        message = `${shortWallet} bet $${activity.stake || '?'}`;
      }

      return {
        id: `${activity.timestamp || Date.now()}-${index}`,
        type,
        message,
        icon,
        amount: activity.stake || activity.winnings,
        side: activity.side || activity.outcomeLabel,
        marketId: activity.marketId,
      };
    });

    // Duplicate items for seamless scroll
    setTickerItems([...items, ...items]);
  }, [activities]);

  if (tickerItems.length === 0) {
    return null;
  }

  return (
    <Container data-testid="live-activity-ticker">
      <TickerWrapper>
        <TickerTrack>
          <LiveBadge>
            <LiveDot />
            LIVE
            <StatsCount>{activities.length} bets</StatsCount>
          </LiveBadge>
          
          {tickerItems.map((item, index) => (
            <TickerItem 
              key={`${item.id}-${index}`}
              $type={item.type}
              data-testid={`ticker-item-${item.type}`}
            >
              <Icon>{item.icon}</Icon>
              {item.message}
              {item.side && (
                <>
                  {' '}
                  <Side $side={item.side}>{item.side}</Side>
                </>
              )}
            </TickerItem>
          ))}
        </TickerTrack>
      </TickerWrapper>
    </Container>
  );
};

export default LiveActivityTicker;
