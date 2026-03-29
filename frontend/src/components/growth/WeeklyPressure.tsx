'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Trophy, Clock, TrendingUp, ChevronUp } from 'lucide-react';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const Container = styled.div`
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TrophyIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 193, 7, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFC107;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #fff;
`;

const Countdown = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  animation: ${pulse} 2s infinite;
`;

const YourPosition = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-bottom: 12px;
`;

const RankBadge = styled.div<{ $isTop10: boolean }>`
  font-size: 24px;
  font-weight: 800;
  color: ${({ $isTop10 }) => $isTop10 ? '#FFC107' : 'rgba(255, 255, 255, 0.6)'};
  
  span {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ProfitInfo = styled.div`
  text-align: right;
  
  .profit {
    font-size: 18px;
    font-weight: 700;
    color: #00FF88;
  }
  
  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }
`;

const RewardPreview = styled.div<{ $hasReward: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: ${({ $hasReward }) => 
    $hasReward ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)'
  };
  border-radius: 10px;
  font-size: 13px;
  color: ${({ $hasReward }) => $hasReward ? '#00FF88' : 'rgba(255, 255, 255, 0.6)'};
  margin-bottom: 12px;
`;

const NextRankHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px dashed rgba(255, 193, 7, 0.3);
  border-radius: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const TopList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;

const TopUser = styled.div<{ $rank: number }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: ${({ $rank }) => 
    $rank === 1 ? 'rgba(255, 215, 0, 0.15)' :
    $rank === 2 ? 'rgba(192, 192, 192, 0.1)' :
    $rank === 3 ? 'rgba(205, 127, 50, 0.1)' :
    'rgba(255, 255, 255, 0.03)'
  };
  border-radius: 10px;
  
  .rank {
    font-size: 14px;
    font-weight: 700;
    color: ${({ $rank }) => 
      $rank === 1 ? '#FFD700' :
      $rank === 2 ? '#C0C0C0' :
      $rank === 3 ? '#CD7F32' :
      'rgba(255, 255, 255, 0.5)'
    };
    width: 24px;
  }
  
  .name {
    flex: 1;
    font-size: 13px;
    color: #fff;
  }
  
  .profit {
    font-size: 13px;
    font-weight: 600;
    color: #00FF88;
  }
`;

interface WeeklyPressureProps {
  wallet: string;
  apiUrl?: string;
  compact?: boolean;
}

function formatTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${hours}h`;
}

export function WeeklyPressure({ wallet, apiUrl, compact = false }: WeeklyPressureProps) {
  const [data, setData] = useState<{
    endsIn: number;
    yourRank: number;
    yourProfit: number;
    yourPotentialReward: number;
    topUsers: any[];
    nextRankProfit: number | null;
    isInTop10: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${baseUrl}/api/growth/weekly/${wallet}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (e) {
        console.error('Failed to fetch weekly data:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [wallet, apiUrl]);

  if (!data) return null;

  const profitToNextRank = data.nextRankProfit 
    ? data.nextRankProfit - data.yourProfit 
    : null;

  return (
    <Container data-testid="weekly-pressure">
      <Header>
        <TitleRow>
          <TrophyIcon>
            <Trophy size={18} />
          </TrophyIcon>
          <Title>Weekly Competition</Title>
        </TitleRow>
        <Countdown>
          <Clock size={14} />
          {formatTime(data.endsIn)}
        </Countdown>
      </Header>

      <YourPosition>
        <RankBadge $isTop10={data.isInTop10}>
          #{data.yourRank}<span>/100</span>
        </RankBadge>
        <ProfitInfo>
          <div className="profit">+${data.yourProfit.toFixed(0)}</div>
          <div className="label">Your profit</div>
        </ProfitInfo>
      </YourPosition>

      <RewardPreview $hasReward={data.yourPotentialReward > 0}>
        {data.yourPotentialReward > 0 ? (
          <>🏆 Potential reward: ${data.yourPotentialReward}</>
        ) : (
          <>Reach Top 3 for cash rewards!</>
        )}
      </RewardPreview>

      {profitToNextRank && profitToNextRank > 0 && (
        <NextRankHint>
          <ChevronUp size={14} />
          +${profitToNextRank.toFixed(0)} to rank #{data.yourRank - 1}
        </NextRankHint>
      )}

      {!compact && (
        <TopList>
          {data.topUsers.slice(0, 5).map((user) => (
            <TopUser key={user.wallet} $rank={user.rank}>
              <span className="rank">#{user.rank}</span>
              <span className="name">{user.username}</span>
              <span className="profit">+${user.profit.toFixed(0)}</span>
            </TopUser>
          ))}
        </TopList>
      )}
    </Container>
  );
}

export default WeeklyPressure;
