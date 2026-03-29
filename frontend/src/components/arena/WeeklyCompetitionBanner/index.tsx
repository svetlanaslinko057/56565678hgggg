'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Trophy, Clock, TrendingUp, ChevronRight, Medal, Flame } from 'lucide-react';
import { LeaderboardAPI } from '@/lib/api/arena';

// ==================== ANIMATIONS ====================

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const countdownPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

// ==================== STYLES ====================

const BannerContainer = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(249, 115, 22, 0.1),
      transparent
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
  }
`;

const BannerContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TrophyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
`;

const TitleText = styled.div`
  h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
`;

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #10B981;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  animation: ${pulse} 2s ease-in-out infinite;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
  }
`;

const TopPlayersSection = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const PlayerCard = styled.div<{ $rank: number }>`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 140px;
  text-align: center;
  
  ${({ $rank }) => $rank === 1 && css`
    border-color: #fbbf24;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%);
  `}
  
  ${({ $rank }) => $rank === 2 && css`
    border-color: #94a3b8;
    background: linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(148, 163, 184, 0.05) 100%);
  `}
  
  ${({ $rank }) => $rank === 3 && css`
    border-color: #d97706;
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%);
  `}
`;

const RankBadge = styled.div<{ $rank: number }>`
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 6px;
  
  ${({ $rank }) => {
    switch ($rank) {
      case 1:
        return css`color: #fbbf24;`;
      case 2:
        return css`color: #94a3b8;`;
      case 3:
        return css`color: #d97706;`;
      default:
        return css`color: #64748b;`;
    }
  }}
`;

const PlayerWallet = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: white;
  font-family: monospace;
  margin-bottom: 4px;
`;

const PlayerPnL = styled.div<{ $positive?: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $positive }) => $positive ? '#10B981' : '#ef4444'};
`;

const CountdownSection = styled.div`
  text-align: center;
  animation: ${countdownPulse} 3s ease-in-out infinite;
`;

const CountdownLabel = styled.div`
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const CountdownValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #f97316;
`;

const ViewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.4);
  }
`;

// ==================== HELPERS ====================

const formatAddress = (addr: string) => {
  if (!addr) return '---';
  return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
};

const getTimeRemaining = (): { days: number; hours: number; minutes: number } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const diff = endOfWeek.getTime() - now.getTime();
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
};

// ==================== COMPONENT ====================

interface TopPlayer {
  rank: number;
  wallet: string;
  pnl: number;
}

interface WeeklyCompetitionBannerProps {
  onViewLeaderboard?: () => void;
}

export const WeeklyCompetitionBanner: React.FC<WeeklyCompetitionBannerProps> = ({ 
  onViewLeaderboard 
}) => {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  const [loading, setLoading] = useState(true);

  // Fetch weekly leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await LeaderboardAPI.getWeekly(3);
        const mapped = data.entries?.slice(0, 3).map((entry: any, index: number) => ({
          rank: index + 1,
          wallet: entry.wallet,
          pnl: entry.pnl || 0,
        })) || [];
        setTopPlayers(mapped);
      } catch (error) {
        console.error('Failed to fetch weekly leaderboard:', error);
        // Use placeholder data
        setTopPlayers([
          { rank: 1, wallet: '0x1234...5678', pnl: 1250 },
          { rank: 2, wallet: '0xabcd...efgh', pnl: 890 },
          { rank: 3, wallet: '0x9876...5432', pnl: 650 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = () => {
    const { days, hours, minutes } = timeRemaining;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <BannerContainer data-testid="weekly-competition-banner">
      <BannerContent>
        <TitleSection>
          <TrophyIcon>
            <Trophy size={28} color="white" />
          </TrophyIcon>
          <TitleText>
            <h3>
              Weekly Competition
              <LiveBadge>Live</LiveBadge>
            </h3>
            <p>Top 3 traders win rewards this week</p>
          </TitleText>
        </TitleSection>

        <TopPlayersSection>
          {loading ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</div>
          ) : topPlayers.length > 0 ? (
            topPlayers.map((player) => (
              <PlayerCard key={player.rank} $rank={player.rank}>
                <RankBadge $rank={player.rank}>
                  {player.rank === 1 && <Medal size={14} />}
                  #{player.rank}
                </RankBadge>
                <PlayerWallet>{formatAddress(player.wallet)}</PlayerWallet>
                <PlayerPnL $positive={player.pnl > 0}>
                  {player.pnl >= 0 ? '+' : ''}{player.pnl.toFixed(0)} USDT
                </PlayerPnL>
              </PlayerCard>
            ))
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>No data yet</div>
          )}
        </TopPlayersSection>

        <CountdownSection>
          <CountdownLabel>
            <Clock size={14} />
            Ends In
          </CountdownLabel>
          <CountdownValue>{formatCountdown()}</CountdownValue>
        </CountdownSection>

        <ViewButton onClick={onViewLeaderboard} data-testid="view-leaderboard-btn">
          View Leaderboard
          <ChevronRight size={18} />
        </ViewButton>
      </BannerContent>
    </BannerContainer>
  );
};

export default WeeklyCompetitionBanner;
