'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LeaderboardAPI } from '@/lib/api/arena';

const Container = styled.div`
  background: rgba(30, 30, 40, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
`;

const WeeklyReset = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`;

const LeaderList = styled.div`
  max-height: 350px;
  overflow-y: auto;
`;

const LeaderItem = styled.div<{ $rank: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: ${({ $rank }) => 
    $rank === 1 ? 'rgba(255, 215, 0, 0.1)' :
    $rank === 2 ? 'rgba(192, 192, 192, 0.1)' :
    $rank === 3 ? 'rgba(205, 127, 50, 0.1)' :
    'rgba(255, 255, 255, 0.03)'
  };
  border-left: 3px solid ${({ $rank }) => 
    $rank === 1 ? '#ffd700' :
    $rank === 2 ? '#c0c0c0' :
    $rank === 3 ? '#cd7f32' :
    'transparent'
  };
`;

const Rank = styled.div<{ $rank: number }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  
  ${({ $rank }) => {
    if ($rank === 1) return `background: linear-gradient(135deg, #ffd700, #ffa500); color: #000;`;
    if ($rank === 2) return `background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #000;`;
    if ($rank === 3) return `background: linear-gradient(135deg, #cd7f32, #8b4513); color: #fff;`;
    return `background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5);`;
  }}
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Username = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Wallet = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
`;

const Stats = styled.div`
  text-align: right;
`;

const Profit = styled.div<{ $positive?: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $positive }) => $positive ? '#00ff88' : '#ff6b6b'};
`;

const ProfitPercent = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
`;

export const DemoLeaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const result = await LeaderboardAPI.getWeekly(10);
        setLeaders(result.entries || []);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every minute
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const getNextSunday = () => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    const days = Math.ceil((nextSunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>🏆 Demo Leaderboard <Badge>WEEKLY</Badge></Title>
        </Header>
        <EmptyState>Loading...</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🏆 Demo Leaderboard <Badge>WEEKLY</Badge></Title>
        <WeeklyReset>Resets in {getNextSunday()}</WeeklyReset>
      </Header>
      
      <LeaderList>
        {leaders.length === 0 && (
          <EmptyState>Be the first to trade!</EmptyState>
        )}
        
        {leaders.map((leader) => (
          <LeaderItem key={leader.wallet} $rank={leader.rank}>
            <Rank $rank={leader.rank}>{leader.rank}</Rank>
            <Avatar>{leader.username?.slice(0, 2).toUpperCase() || '??'}</Avatar>
            <Info>
              <Username>{leader.username}</Username>
              <Wallet>{leader.wallet?.slice(0, 10)}...</Wallet>
            </Info>
            <Stats>
              <Profit $positive={leader.profit >= 0}>
                {leader.profit >= 0 ? '+' : ''}${leader.profit?.toFixed(0)}
              </Profit>
              <ProfitPercent>
                {leader.profit >= 0 ? '+' : ''}{leader.profitPercent}%
              </ProfitPercent>
            </Stats>
          </LeaderItem>
        ))}
      </LeaderList>
    </Container>
  );
};

export default DemoLeaderboard;
