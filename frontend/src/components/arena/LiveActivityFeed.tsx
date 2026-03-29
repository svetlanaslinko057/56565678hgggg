'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { ActivityAPI } from '@/lib/api/arena';
import { MonetizationAPI } from '@/lib/api/monetizationApi';
import { useLiveActivity } from '@/hooks/useSocket';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const boostedGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 165, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.6); }
`;

const Container = styled.div`
  background: rgba(30, 30, 40, 0.95);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LiveDot = styled.span<{ $isLive?: boolean }>`
  width: 8px;
  height: 8px;
  background: ${({ $isLive }) => $isLive ? '#00ff88' : '#ffc107'};
  border-radius: 50%;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const LiveBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border-radius: 10px;
  font-weight: 500;
`;

const ActivityList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

const ActivityItem = styled.div<{ $isNew?: boolean; $isBoosted?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 10px;
  animation: ${({ $isNew }) => $isNew ? slideIn : 'none'} 0.3s ease;
  
  ${({ $isBoosted }) => $isBoosted ? `
    background: linear-gradient(135deg, rgba(255, 165, 0, 0.15) 0%, rgba(255, 200, 0, 0.1) 100%);
    border: 1px solid rgba(255, 165, 0, 0.4);
    animation: ${boostedGlow} 2s ease-in-out infinite;
    position: relative;
    
    &::before {
      content: '🔥 BOOSTED';
      position: absolute;
      top: -8px;
      right: 8px;
      font-size: 10px;
      font-weight: 700;
      color: #ffa500;
      background: #1a1a2e;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255, 165, 0, 0.5);
    }
  ` : `
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  `}
  
  &:last-child {
    border-bottom: none;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityText = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
`;

const UserName = styled.span`
  color: #fff;
  font-weight: 600;
`;

const Amount = styled.span<{ $type?: 'bet' | 'win' }>`
  color: ${({ $type }) => $type === 'win' ? '#00ff88' : '#ffc107'};
  font-weight: 600;
`;

const Market = styled.span`
  color: #00c8ff;
`;

const Side = styled.span<{ $side?: string }>`
  color: ${({ $side }) => 
    $side?.toLowerCase() === 'yes' ? '#00ff88' : '#ff6b6b'
  };
  font-weight: 600;
`;

const Time = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
`;

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [boostedBets, setBoostedBets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  
  // WebSocket real-time updates
  const { activities: liveActivities, isLive } = useLiveActivity(10);

  // Fetch initial activities and boosted bets via API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const [data, boosted] = await Promise.all([
          ActivityAPI.getLiveActivity(20),
          MonetizationAPI.getBoostedBets(10).catch(() => [])
        ]);
        
        // Create set of boosted bet IDs
        const boostedIds = new Set(boosted.map((b: any) => b.bet?.id).filter(Boolean));
        setBoostedBets(boostedIds);
        
        // Add boosted bets to top of activities
        const boostedActivities = boosted.map((b: any) => ({
          ...b.bet,
          boosted: true,
          createdAt: new Date().toISOString(),
        }));
        
        // Merge: boosted first, then regular
        const merged = [...boostedActivities, ...data];
        setActivities(merged);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Fallback polling if WebSocket not connected
    const interval = setInterval(() => {
      if (!isLive) {
        fetchActivities();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isLive]);

  // Merge live activities into state
  useEffect(() => {
    if (liveActivities.length > 0) {
      setActivities(prev => {
        const merged = [...liveActivities, ...prev];
        // Dedupe by timestamp + user
        const seen = new Set<string>();
        return merged.filter(a => {
          const key = `${a.createdAt || a.timestamp}-${a.user || a.wallet}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 20);
      });
      
      // Mark as new for animation
      setNewIds(new Set([0]));
      setTimeout(() => setNewIds(new Set()), 500);
    }
  }, [liveActivities]);

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Container data-testid="live-activity-feed">
        <Header>
          <Title><LiveDot $isLive={false} /> Live Activity</Title>
        </Header>
        <EmptyState>Loading...</EmptyState>
      </Container>
    );
  }

  return (
    <Container data-testid="live-activity-feed">
      <Header>
        <Title>
          <LiveDot $isLive={isLive} /> Live Activity
          {isLive && <LiveBadge>LIVE</LiveBadge>}
        </Title>
      </Header>
      
      <ActivityList>
        {activities.length === 0 && (
          <EmptyState>No recent activity</EmptyState>
        )}
        
        {activities.map((activity, index) => (
          <ActivityItem 
            key={`${activity.createdAt || activity.timestamp}-${index}`} 
            $isNew={newIds.has(index)}
            $isBoosted={activity.boosted || boostedBets.has(activity.id)}
            data-testid={activity.boosted ? 'boosted-activity' : 'activity-item'}
          >
            <Avatar>{getInitials(activity.user || activity.wallet || 'AN')}</Avatar>
            <ActivityContent>
              <ActivityText>
                <UserName>{activity.user || formatWallet(activity.wallet) || 'Anonymous'}</UserName>
                {' placed '}
                <Amount $type="bet">${activity.stake?.toFixed(0) || '?'}</Amount>
                {' on '}
                <Side $side={activity.side || activity.outcomeLabel}>{activity.side || activity.outcomeLabel || 'Yes'}</Side>
              </ActivityText>
              <Time>{formatTimeAgo(activity.createdAt || activity.timestamp)}</Time>
            </ActivityContent>
          </ActivityItem>
        ))}
      </ActivityList>
    </Container>
  );
};

function formatWallet(wallet?: string): string {
  if (!wallet) return '';
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default LiveActivityFeed;
