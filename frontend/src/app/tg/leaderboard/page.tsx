'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { TgPageContainer } from '@/components/tg';
import { useTheme } from '@/lib/ThemeContext';
import { Trophy, TrendingUp, Target, Medal, Crown } from 'lucide-react';

const Header = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h2<{ $textColor: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p<{ $textColor: string }>`
  font-size: 14px;
  color: ${props => props.$textColor};
  margin: 0;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const FilterTab = styled.button<{ $active?: boolean; $warningColor: string; $bgColor: string; $textColor: string }>`
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${({ $active, $warningColor, $bgColor, $textColor }) => $active ? `
    background: ${$warningColor}25;
    color: ${$warningColor};
    border: 1px solid ${$warningColor}50;
  ` : `
    background: ${$bgColor};
    color: ${$textColor};
    border: 1px solid transparent;
  `}
  
  &:active {
    transform: scale(0.96);
  }
`;

const Podium = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 24px;
  padding: 0 16px;
`;

const PodiumPlace = styled.div<{ $place: number; $bgColor: string; $accentColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 100px;
  
  .avatar {
    width: ${({ $place }) => $place === 1 ? '64px' : '52px'};
    height: ${({ $place }) => $place === 1 ? '64px' : '52px'};
    border-radius: 50%;
    background: linear-gradient(135deg, 
      ${({ $place }) => {
        if ($place === 1) return '#ffd700, #ffb347';
        if ($place === 2) return '#c0c0c0, #a8a8a8';
        return '#cd7f32, #b87333';
      }}
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${({ $place }) => $place === 1 ? '20px' : '16px'};
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    position: relative;
    border: 3px solid ${({ $place }) => {
      if ($place === 1) return '#ffd700';
      if ($place === 2) return '#c0c0c0';
      return '#cd7f32';
    }};
    box-shadow: 0 4px 20px ${({ $place }) => {
      if ($place === 1) return 'rgba(255, 215, 0, 0.4)';
      if ($place === 2) return 'rgba(192, 192, 192, 0.3)';
      return 'rgba(205, 127, 50, 0.3)';
    }};
  }
  
  .crown {
    position: absolute;
    top: -18px;
    color: #ffd700;
    filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5));
  }
  
  .stand {
    width: 100%;
    height: ${({ $place }) => {
      if ($place === 1) return '80px';
      if ($place === 2) return '60px';
      return '45px';
    }};
    background: ${props => props.$bgColor};
    border-radius: 8px 8px 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    
    .place {
      font-size: 20px;
      font-weight: 800;
      color: ${({ $place }) => {
        if ($place === 1) return '#ffd700';
        if ($place === 2) return '#c0c0c0';
        return '#cd7f32';
      }};
      margin-bottom: 4px;
    }
    
    .name {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-primary);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    
    .xp {
      font-size: 10px;
      color: ${props => props.$accentColor};
    }
  }
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LeaderboardItem = styled.div<{ $bgColor: string; $textColor: string; $mutedColor: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$bgColor};
  border-radius: 12px;
  
  .rank {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: ${props => props.$mutedColor}20;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: ${props => props.$mutedColor};
  }
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
  }
  
  .info {
    flex: 1;
    
    .name {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.$textColor};
    }
    
    .stats {
      font-size: 12px;
      color: ${props => props.$mutedColor};
    }
  }
  
  .score {
    text-align: right;
    
    .xp {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
    }
    
    .label {
      font-size: 10px;
      color: ${props => props.$mutedColor};
      text-transform: uppercase;
    }
  }
`;

const YourRank = styled.div<{ $bgColor: string; $accentColor: string; $textColor: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: ${props => props.$accentColor}15;
  border: 1px solid ${props => props.$accentColor}40;
  border-radius: 12px;
  margin-bottom: 16px;
  
  .rank {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${props => props.$accentColor}30;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.$accentColor};
  }
  
  .info {
    flex: 1;
    
    .label {
      font-size: 11px;
      color: ${props => props.$accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .text {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.$textColor};
    }
  }
  
  .arrow {
    color: ${props => props.$accentColor};
  }
`;

const mockLeaders = [
  { rank: 1, name: 'CryptoLord', xp: 45200, wins: 156, avatar: 'CL' },
  { rank: 2, name: 'MoonBoy99', xp: 38500, wins: 142, avatar: 'MB' },
  { rank: 3, name: 'WhaleAlert', xp: 32100, wins: 128, avatar: 'WA' },
  { rank: 4, name: 'DiamondHands', xp: 28400, wins: 115, avatar: 'DH' },
  { rank: 5, name: 'BullRunner', xp: 25200, wins: 98, avatar: 'BR' },
  { rank: 6, name: 'SatoshiFan', xp: 22800, wins: 87, avatar: 'SF' },
];

export default function TgLeaderboardPage() {
  const [activeFilter, setActiveFilter] = useState('xp');
  const { theme } = useTheme();

  const top3 = mockLeaders.slice(0, 3);
  const rest = mockLeaders.slice(3);
  
  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <TgPageContainer>
      <Header>
        <Title $textColor={theme.textPrimary}>Leaderboard</Title>
        <Subtitle $textColor={theme.textMuted}>Top predictors this week</Subtitle>
      </Header>

      <FilterTabs>
        <FilterTab 
          $active={activeFilter === 'xp'} 
          $warningColor={theme.warning}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('xp')}
        >
          <Trophy size={14} /> XP
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'wins'} 
          $warningColor={theme.warning}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('wins')}
        >
          <Target size={14} /> Wins
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'profit'} 
          $warningColor={theme.warning}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('profit')}
        >
          <TrendingUp size={14} /> Profit
        </FilterTab>
      </FilterTabs>

      <Podium>
        {podiumOrder.map((leader, i) => {
          const place = i === 0 ? 2 : i === 1 ? 1 : 3;
          return (
            <PodiumPlace key={leader.rank} $place={place} $bgColor={theme.bgCard} $accentColor={theme.accent}>
              <div className="avatar">
                {place === 1 && <Crown size={20} className="crown" />}
                {leader.avatar}
              </div>
              <div className="stand">
                <div className="place">{place}</div>
                <div className="name">{leader.name}</div>
                <div className="xp">{(leader.xp / 1000).toFixed(1)}K XP</div>
              </div>
            </PodiumPlace>
          );
        })}
      </Podium>

      <YourRank $bgColor={theme.bgCard} $accentColor={theme.accent} $textColor={theme.textPrimary}>
        <div className="rank">#42</div>
        <div className="info">
          <div className="label">Your Rank</div>
          <div className="text">6,500 XP • 32 wins</div>
        </div>
        <Medal size={20} className="arrow" />
      </YourRank>

      <LeaderboardList>
        {rest.map((leader) => (
          <LeaderboardItem key={leader.rank} $bgColor={theme.bgCard} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
            <div className="rank">{leader.rank}</div>
            <div className="avatar">{leader.avatar}</div>
            <div className="info">
              <div className="name">{leader.name}</div>
              <div className="stats">{leader.wins} wins</div>
            </div>
            <div className="score">
              <div className="xp">{(leader.xp / 1000).toFixed(1)}K</div>
              <div className="label">XP</div>
            </div>
          </LeaderboardItem>
        ))}
      </LeaderboardList>
    </TgPageContainer>
  );
}
