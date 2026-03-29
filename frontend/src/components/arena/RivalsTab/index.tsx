'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Swords, TrendingUp, TrendingDown, Trophy, Flame, Target, RefreshCw } from 'lucide-react';
import { RivalsAPI, type RivalStats as RivalStatsType, type RivalrySummary } from '@/lib/api/arena';
import UserAvatar from '@/global/common/UserAvatar';

// ==================== TYPES ====================
type RivalStats = RivalStatsType;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

const fireGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 25px rgba(249, 115, 22, 0.7); }
`;

// ==================== STYLES ====================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SummaryCard = styled.div<{ $highlight?: boolean }>`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #eef1f5;
  padding: 18px;
  text-align: center;
  
  ${({ $highlight }) => $highlight && css`
    border-color: #f97316;
    background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
  `}
`;

const SummaryValue = styled.div<{ $variant?: 'success' | 'danger' | 'warning' }>`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return css`color: #10B981;`;
      case 'danger':
        return css`color: #EF4444;`;
      case 'warning':
        return css`color: #f97316;`;
      default:
        return css`color: #0f172a;`;
    }
  }}
`;

const SummaryLabel = styled.div`
  font-size: 13px;
  color: #738094;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RivalsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RivalCard = styled.div<{ $hasStreak?: boolean }>`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  ${({ $hasStreak }) => $hasStreak && css`
    border-color: #f97316;
    animation: ${pulse} 3s ease-in-out infinite;
    
    &:hover {
      animation: ${fireGlow} 2s ease-in-out infinite;
    }
  `}
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const RivalInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
`;

const RivalDetails = styled.div`
  flex: 1;
`;

const RivalName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  font-family: monospace;
  margin-bottom: 4px;
`;

const RivalDominance = styled.div<{ $type: 'you' | 'them' | 'even' }>`
  font-size: 13px;
  font-weight: 500;
  
  ${({ $type }) => {
    switch ($type) {
      case 'you':
        return css`color: #10B981;`;
      case 'them':
        return css`color: #EF4444;`;
      default:
        return css`color: #738094;`;
    }
  }}
`;

const RivalStats = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 640px) {
    justify-content: space-between;
  }
`;

const StatBlock = styled.div`
  text-align: center;
`;

const StatValue = styled.div<{ $variant?: 'success' | 'danger' }>`
  font-size: 20px;
  font-weight: 700;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return css`color: #10B981;`;
      case 'danger':
        return css`color: #EF4444;`;
      default:
        return css`color: #0f172a;`;
    }
  }}
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #738094;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  
  .wins { color: #10B981; }
  .dash { color: #cbd5e1; }
  .losses { color: #EF4444; }
`;

const StreakBadge = styled.div<{ $isAgainst?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  ${({ $isAgainst }) => $isAgainst ? css`
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #dc2626;
    border: 1px solid #fecaca;
  ` : css`
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    animation: ${fireGlow} 2s ease-in-out infinite;
  `}
`;

const RematchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
`;

const EmptyTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: #738094;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #738094;
`;

// ==================== HELPERS ====================

const formatAddress = (addr: string) => {
  if (!addr) return 'Unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getDominanceText = (rival: RivalStats, myWallet: string): string => {
  if (rival.currentStreakByYou >= 3) {
    return `You're on a ${rival.currentStreakByYou}-win streak!`;
  }
  if (rival.currentStreakAgainstYou >= 3) {
    return `They're on a ${rival.currentStreakAgainstYou}-win streak`;
  }
  if (rival.wins > rival.losses * 2) {
    return 'You dominate this rivalry';
  }
  if (rival.losses > rival.wins * 2) {
    return 'They dominate this rivalry';
  }
  if (rival.wins > rival.losses) {
    return 'You have the edge';
  }
  if (rival.losses > rival.wins) {
    return 'They have the edge';
  }
  return 'Evenly matched';
};

// ==================== COMPONENT ====================

interface RivalsTabProps {
  wallet: string;
  onRematch?: (opponent: string, lastStake: number) => void;
}

export const RivalsTab: React.FC<RivalsTabProps> = ({ wallet, onRematch }) => {
  const [rivals, setRivals] = useState<RivalStats[]>([]);
  const [summary, setSummary] = useState<RivalrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [rivalsData, summaryData] = await Promise.all([
        RivalsAPI.getRivals(wallet),
        RivalsAPI.getSummary(wallet),
      ]);

      setRivals(rivalsData);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to load rivals data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRematch = (opponent: string, lastStake: number) => {
    if (onRematch) {
      onRematch(opponent, lastStake);
    }
  };

  if (loading) {
    return <LoadingState>Loading rivals...</LoadingState>;
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyTitle>Error</EmptyTitle>
        <EmptyText>{error}</EmptyText>
      </EmptyState>
    );
  }

  if (!rivals.length) {
    return (
      <EmptyState>
        <Swords size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
        <EmptyTitle>No Rivals Yet</EmptyTitle>
        <EmptyText>Challenge someone to a duel to create your first rivalry!</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container data-testid="rivals-tab">
      {/* Summary Stats */}
      {summary && (
        <SummaryRow>
          <SummaryCard>
            <SummaryValue>{summary.totalRivals}</SummaryValue>
            <SummaryLabel>Total Rivals</SummaryLabel>
          </SummaryCard>
          <SummaryCard>
            <SummaryValue>{summary.totalRivalryDuels}</SummaryValue>
            <SummaryLabel>Rivalry Duels</SummaryLabel>
          </SummaryCard>
          <SummaryCard $highlight={summary.dominatedCount > summary.dominatedByCount}>
            <SummaryValue $variant="success">{summary.dominatedCount}</SummaryValue>
            <SummaryLabel>Dominated</SummaryLabel>
          </SummaryCard>
          <SummaryCard $highlight={summary.dominatedByCount > summary.dominatedCount}>
            <SummaryValue $variant="danger">{summary.dominatedByCount}</SummaryValue>
            <SummaryLabel>Dominated By</SummaryLabel>
          </SummaryCard>
        </SummaryRow>
      )}

      {/* Top Rivals List */}
      <SectionTitle>
        <Swords size={20} />
        Top Rivals
      </SectionTitle>
      
      <RivalsList>
        {rivals.map((rival, index) => {
          const hasActiveStreak = rival.currentStreakAgainstYou >= 2 || rival.currentStreakByYou >= 2;
          
          return (
            <RivalCard 
              key={rival.opponent} 
              $hasStreak={rival.currentStreakAgainstYou >= 3}
              data-testid={`rival-card-${index}`}
            >
              <RivalInfo>
                <UserAvatar 
                  avatar={`https://api.dicebear.com/7.x/identicon/svg?seed=${rival.opponent}`}
                  size="medium"
                  variant="default"
                />
                <RivalDetails>
                  <RivalName>{formatAddress(rival.opponent)}</RivalName>
                  <RivalDominance $type={rival.dominance}>
                    {getDominanceText(rival, wallet)}
                  </RivalDominance>
                </RivalDetails>
              </RivalInfo>

              <RivalStats>
                <ScoreDisplay>
                  <span className="wins">{rival.wins}</span>
                  <span className="dash">—</span>
                  <span className="losses">{rival.losses}</span>
                </ScoreDisplay>
                
                <StatBlock>
                  <StatValue>{rival.totalDuels}</StatValue>
                  <StatLabel>Duels</StatLabel>
                </StatBlock>

                {rival.currentStreakByYou >= 2 && (
                  <StreakBadge data-testid="your-streak-badge">
                    <Flame size={14} />
                    {rival.currentStreakByYou} streak
                  </StreakBadge>
                )}
                
                {rival.currentStreakAgainstYou >= 2 && (
                  <StreakBadge $isAgainst data-testid="their-streak-badge">
                    <TrendingDown size={14} />
                    Lost {rival.currentStreakAgainstYou}x
                  </StreakBadge>
                )}
              </RivalStats>

              <RematchButton 
                onClick={() => handleRematch(rival.opponent, rival.lastStake)}
                data-testid={`rematch-btn-${index}`}
              >
                <Swords size={16} />
                Rematch
              </RematchButton>
            </RivalCard>
          );
        })}
      </RivalsList>
    </Container>
  );
};

export default RivalsTab;
