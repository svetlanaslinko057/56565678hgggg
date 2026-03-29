'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Swords, TrendingDown, Flame, RotateCcw } from 'lucide-react';

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

const Container = styled.div<{ $isLosing: boolean }>`
  background: ${({ $isLosing }) => 
    $isLosing 
      ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 82, 82, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 106, 0.05) 100%)'
  };
  border: 1px solid ${({ $isLosing }) => 
    $isLosing ? 'rgba(255, 107, 107, 0.3)' : 'rgba(0, 255, 136, 0.3)'
  };
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const RivalInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RivalIcon = styled.div<{ $isLosing: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $isLosing }) => 
    $isLosing ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 255, 136, 0.2)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $isLosing }) => $isLosing ? '#FF6B6B' : '#00FF88'};
  animation: ${({ $isLosing }) => $isLosing ? shake : 'none'} 0.5s ease-in-out infinite;
`;

const RivalName = styled.div`
  .name {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
  }
  
  .status {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
`;

const StreakBadge = styled.div<{ $type: 'win' | 'loss' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  background: ${({ $type }) => 
    $type === 'loss' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 255, 136, 0.2)'
  };
  color: ${({ $type }) => $type === 'loss' ? '#FF6B6B' : '#00FF88'};
`;

const ScoreBoard = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-bottom: 12px;
`;

const Score = styled.div<{ $isYou?: boolean }>`
  text-align: center;
  
  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 28px;
    font-weight: 800;
    color: ${({ $isYou }) => $isYou ? '#00FF88' : '#FF6B6B'};
  }
`;

const VS = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
`;

const Message = styled.div<{ $isLosing: boolean }>`
  text-align: center;
  font-size: 14px;
  color: ${({ $isLosing }) => $isLosing ? '#FF6B6B' : '#00FF88'};
  margin-bottom: 12px;
`;

const RematchButton = styled.button<{ $isLosing: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${({ $isLosing }) => 
    $isLosing 
      ? 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)'
      : 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)'
  };
  color: ${({ $isLosing }) => $isLosing ? '#fff' : '#000'};
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${({ $isLosing }) => 
      $isLosing ? 'rgba(255, 107, 107, 0.4)' : 'rgba(0, 255, 136, 0.4)'
    };
  }
`;

interface RivalPressureProps {
  rivalName: string;
  yourWins: number;
  rivalWins: number;
  streak: number;
  streakHolder: 'you' | 'rival';
  onRematch?: () => void;
}

export function RivalPressure({
  rivalName,
  yourWins,
  rivalWins,
  streak,
  streakHolder,
  onRematch,
}: RivalPressureProps) {
  const isLosing = streakHolder === 'rival';
  
  const getMessage = () => {
    if (isLosing && streak >= 3) {
      return `😤 ${streak} losses in a row to ${rivalName}. Time for revenge!`;
    } else if (isLosing) {
      return `⚔️ ${rivalName} is leading. Don't let them win!`;
    } else if (streak >= 3) {
      return `🔥 ${streak} win streak! Keep dominating!`;
    } else {
      return `💪 You're ahead! Maintain your lead!`;
    }
  };

  return (
    <Container $isLosing={isLosing} data-testid="rival-pressure">
      <Header>
        <RivalInfo>
          <RivalIcon $isLosing={isLosing}>
            <Swords size={20} />
          </RivalIcon>
          <RivalName>
            <div className="name">vs {rivalName}</div>
            <div className="status">Rival Match</div>
          </RivalName>
        </RivalInfo>
        <StreakBadge $type={isLosing ? 'loss' : 'win'}>
          {isLosing ? <TrendingDown size={14} /> : <Flame size={14} />}
          {streak} {isLosing ? 'losses' : 'wins'}
        </StreakBadge>
      </Header>

      <ScoreBoard>
        <Score $isYou>
          <div className="label">You</div>
          <div className="value">{yourWins}</div>
        </Score>
        <VS>VS</VS>
        <Score>
          <div className="label">{rivalName}</div>
          <div className="value">{rivalWins}</div>
        </Score>
      </ScoreBoard>

      <Message $isLosing={isLosing}>{getMessage()}</Message>

      <RematchButton 
        $isLosing={isLosing} 
        onClick={onRematch}
        data-testid="rematch-button"
      >
        <RotateCcw size={18} />
        {isLosing ? 'Get Revenge' : 'Challenge Again'}
      </RematchButton>
    </Container>
  );
}

export default RivalPressure;
