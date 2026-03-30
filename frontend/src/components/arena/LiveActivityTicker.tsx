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
  bottom: 70px;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(15, 15, 25, 0) 0%, rgba(15, 15, 25, 0.98) 40%);
  padding: 12px 16px 16px;
  z-index: 50;
  pointer-events: none;
  
  @media (min-width: 768px) {
    bottom: 10px;
    padding: 12px 20px;
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

  // Default placeholder items when no real activity
  const defaultItems: TickerActivity[] = [
    { id: 'default-1', type: 'bet', icon: '🎯', message: '0x7f3e...8d2a bet $25', side: 'YES' },
    { id: 'default-2', type: 'whale', icon: '🐋', message: '0x4b2c...9f1d bet $250', side: 'YES' },
    { id: 'default-3', type: 'win', icon: '🎉', message: '0x9a1f...3c5b won $180' },
    { id: 'default-4', type: 'edge', icon: '⚡', message: 'BTC edge +12.5%', side: 'YES' },
    { id: 'default-5', type: 'bet', icon: '🎯', message: '0x2d8e...7a4c bet $50', side: 'NO' },
    { id: 'default-6', type: 'whale', icon: '🐋', message: '0x6f1a...2b9e bet $500', side: 'NO' },
  ];

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

    // Use default items if no real activity, or duplicate real items for seamless scroll
    if (items.length === 0) {
      setTickerItems([...defaultItems, ...defaultItems]);
    } else {
      setTickerItems([...items, ...items]);
    }
  }, [activities.length]);

  // Always render - show default activity or real activity
  const displayItems = tickerItems.length > 0 ? tickerItems : [...defaultItems, ...defaultItems];

  return (
    <Container data-testid="live-activity-ticker">
      <TickerWrapper>
        <TickerTrack>
          <LiveBadge>
            <LiveDot />
            LIVE
            <StatsCount>{activities.length > 0 ? `${activities.length} bets` : 'Arena'}</StatsCount>
          </LiveBadge>
          
          {displayItems.map((item, index) => (
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
