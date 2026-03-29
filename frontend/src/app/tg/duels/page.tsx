'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { TgPageContainer } from '@/components/tg';
import { useTheme } from '@/lib/ThemeContext';
import { Swords, Clock, Trophy, Zap, Plus } from 'lucide-react';

const Header = styled.div`
  margin-bottom: 16px;
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

const CreateButton = styled.button<{ $accentColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, ${props => props.$accentColor} 0%, ${props => props.$accentColor}cc 100%);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const FilterTab = styled.button<{ $active?: boolean; $dangerColor: string; $bgColor: string; $textColor: string }>`
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${({ $active, $dangerColor, $bgColor, $textColor }) => $active ? `
    background: ${$dangerColor}20;
    color: ${$dangerColor};
    border: 1px solid ${$dangerColor}50;
  ` : `
    background: ${$bgColor};
    color: ${$textColor};
    border: 1px solid transparent;
  `}
  
  &:active {
    transform: scale(0.96);
  }
`;

const DuelsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DuelCard = styled.div<{ $featured?: boolean; $bgColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $featured }) => $featured && `
    border: 1px solid rgba(255, 215, 0, 0.4);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  `}
  
  &:active {
    transform: scale(0.98);
  }
`;

const FeaturedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #ffd700;
  margin-bottom: 8px;
`;

const DuelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const DuelTitle = styled.h4<{ $textColor: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$textColor};
  margin: 0;
  flex: 1;
`;

const StatusBadge = styled.span<{ $status: string; $successColor: string; $dangerColor: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  
  ${({ $status, $successColor, $dangerColor }) => {
    switch ($status) {
      case 'open':
        return `background: ${$successColor}20; color: ${$successColor};`;
      case 'live':
        return `background: ${$dangerColor}20; color: ${$dangerColor};`;
      default:
        return `background: rgba(128, 128, 128, 0.1); color: #888;`;
    }
  }}
`;

const Versus = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Player = styled.div<{ $side: 'left' | 'right'; $successColor: string; $dangerColor: string; $textColor: string; $mutedColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $side }) => $side === 'left' ? 'flex-start' : 'flex-end'};
  flex: 1;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
  }
  
  .name {
    font-size: 13px;
    font-weight: 600;
    color: ${props => props.$textColor};
  }
  
  .side {
    font-size: 11px;
    font-weight: 600;
    color: ${({ $side, $successColor, $dangerColor }) => $side === 'left' ? $successColor : $dangerColor};
  }
`;

const VsIcon = styled.div<{ $dangerColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$dangerColor}30;
  color: ${props => props.$dangerColor};
`;

const DuelStats = styled.div<{ $borderColor: string; $mutedColor: string }>`
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${props => props.$borderColor};
  
  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${props => props.$mutedColor};
    
    svg {
      opacity: 0.6;
    }
  }
`;

const JoinButton = styled.button<{ $dangerColor: string }>`
  width: 100%;
  padding: 12px;
  background: ${props => props.$dangerColor}20;
  border: 1px solid ${props => props.$dangerColor}50;
  border-radius: 10px;
  color: ${props => props.$dangerColor};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.2s;
  
  &:active {
    background: ${props => props.$dangerColor}30;
    transform: scale(0.98);
  }
`;

const EmptyState = styled.div<{ $textColor: string; $mutedColor: string }>`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.$mutedColor};
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  h4 {
    font-size: 16px;
    color: ${props => props.$textColor};
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    margin: 0;
  }
`;

const mockDuels = [
  {
    id: '1',
    title: 'BTC $100K by March',
    player1: { name: 'CryptoKing', side: 'YES' },
    player2: { name: 'BearWhale', side: 'NO' },
    stake: 500,
    status: 'live',
    timeLeft: '1d 5h',
    featured: true,
  },
  {
    id: '2',
    title: 'ETH > SOL market cap',
    player1: { name: 'EthMaxi', side: 'YES' },
    player2: null,
    stake: 100,
    status: 'open',
    timeLeft: '3d',
    featured: false,
  },
];

export default function TgDuelsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const { theme } = useTheme();

  return (
    <TgPageContainer>
      <Header>
        <Title $textColor={theme.textPrimary}>Duels</Title>
        <Subtitle $textColor={theme.textMuted}>Challenge rivals, win big</Subtitle>
      </Header>

      <CreateButton data-testid="create-duel" $accentColor={theme.accent}>
        <Plus size={18} /> Create Duel
      </CreateButton>

      <FilterTabs>
        <FilterTab 
          $active={activeFilter === 'all'} 
          $dangerColor={theme.danger}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('all')}
        >
          All
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'open'} 
          $dangerColor={theme.danger}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('open')}
        >
          Open
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'live'} 
          $dangerColor={theme.danger}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('live')}
        >
          Live
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'my'} 
          $dangerColor={theme.danger}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => setActiveFilter('my')}
        >
          My Duels
        </FilterTab>
      </FilterTabs>

      <DuelsList>
        {mockDuels.length === 0 ? (
          <EmptyState $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
            <div className="icon"><Swords size={48} /></div>
            <h4>No duels yet</h4>
            <p>Create the first duel and challenge others!</p>
          </EmptyState>
        ) : (
          mockDuels.map((duel) => (
            <DuelCard key={duel.id} $featured={duel.featured} $bgColor={theme.bgCard} data-testid="duel-card">
              {duel.featured && (
                <FeaturedBadge>
                  <Zap size={10} /> FEATURED
                </FeaturedBadge>
              )}
              
              <DuelHeader>
                <DuelTitle $textColor={theme.textPrimary}>{duel.title}</DuelTitle>
                <StatusBadge $status={duel.status} $successColor={theme.success} $dangerColor={theme.danger}>
                  {duel.status.toUpperCase()}
                </StatusBadge>
              </DuelHeader>

              <Versus>
                <Player $side="left" $successColor={theme.success} $dangerColor={theme.danger} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
                  <div className="avatar">{duel.player1.name.slice(0, 2)}</div>
                  <div className="name">{duel.player1.name}</div>
                  <div className="side">{duel.player1.side}</div>
                </Player>
                
                <VsIcon $dangerColor={theme.danger}>
                  <Swords size={18} />
                </VsIcon>
                
                <Player $side="right" $successColor={theme.success} $dangerColor={theme.danger} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
                  {duel.player2 ? (
                    <>
                      <div className="avatar">{duel.player2.name.slice(0, 2)}</div>
                      <div className="name">{duel.player2.name}</div>
                      <div className="side">{duel.player2.side}</div>
                    </>
                  ) : (
                    <>
                      <div className="avatar" style={{ background: theme.bgSecondary }}>?</div>
                      <div className="name" style={{ color: theme.textMuted }}>Waiting...</div>
                      <div className="side" style={{ color: theme.textMuted }}>NO</div>
                    </>
                  )}
                </Player>
              </Versus>

              <DuelStats $borderColor={theme.border} $mutedColor={theme.textMuted}>
                <div className="stat">
                  <Trophy size={14} /> ${duel.stake * 2} pot
                </div>
                <div className="stat">
                  <Clock size={14} /> {duel.timeLeft}
                </div>
              </DuelStats>

              {duel.status === 'open' && !duel.player2 && (
                <JoinButton data-testid="join-duel" $dangerColor={theme.danger}>
                  Accept Challenge (${duel.stake})
                </JoinButton>
              )}
            </DuelCard>
          ))
        )}
      </DuelsList>
    </TgPageContainer>
  );
}
