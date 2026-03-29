'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Trophy, Flame, Swords, Target, Star, Share2, Copy } from 'lucide-react';

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 136, 0.5); }
`;

const Container = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(0, 255, 136, 0.4);
  border-radius: 24px;
  padding: 24px;
  animation: ${glow} 3s infinite;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const WinLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
`;

const ProfitAmount = styled.div`
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(135deg, #00FF88 0%, #00FFAA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ROI = styled.div`
  font-size: 18px;
  color: #00FF88;
  font-weight: 600;
`;

const Achievements = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin: 20px 0;
`;

const Badge = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${({ $color }) => `${$color}20`};
  border: 1px solid ${({ $color }) => `${$color}50`};
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
`;

const Stat = styled.div`
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  
  .value {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
  }
  
  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    margin-top: 4px;
  }
`;

const ShareSection = styled.div`
  margin-top: 20px;
`;

const ShareMessage = styled.div`
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-line;
  margin-bottom: 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
`;

const ShareButton = styled.button`
  flex: 1;
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
  background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%);
  color: #000;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
  }
`;

const CopyButton = styled.button`
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

interface WinCardEnhancedProps {
  profit: number;
  roi: number;
  badges: string[];
  achievements: string[];
  streak: number;
  rivalBeaten: string | null;
  leaderboardPosition: number | null;
  shareMessage: string;
  deepLink: string;
  onShare?: () => void;
  onCopy?: () => void;
}

const getBadgeIcon = (badge: string) => {
  switch (badge) {
    case 'hot_streak':
      return <Flame size={14} />;
    case '2x_winner':
    case '3x_winner':
      return <Trophy size={14} />;
    case 'centurion':
    case 'whale_win':
      return <Star size={14} />;
    default:
      return <Target size={14} />;
  }
};

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'hot_streak':
      return '#FF6B6B';
    case '2x_winner':
      return '#FFC107';
    case '3x_winner':
      return '#FF9800';
    case 'centurion':
      return '#00FF88';
    case 'whale_win':
      return '#00BFFF';
    default:
      return '#9C27B0';
  }
};

const getBadgeLabel = (badge: string) => {
  switch (badge) {
    case 'hot_streak':
      return 'Hot Streak';
    case '2x_winner':
      return '2x Return';
    case '3x_winner':
      return '3x Return';
    case 'centurion':
      return 'Centurion';
    case 'whale_win':
      return 'Whale Win';
    default:
      return badge;
  }
};

export function WinCardEnhanced({
  profit,
  roi,
  badges,
  achievements,
  streak,
  rivalBeaten,
  leaderboardPosition,
  shareMessage,
  deepLink,
  onShare,
  onCopy,
}: WinCardEnhancedProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareMessage}\n${deepLink}`);
    onCopy?.();
  };

  return (
    <Container data-testid="win-card-enhanced">
      <Header>
        <WinLabel>Victory!</WinLabel>
        <ProfitAmount>+${profit.toFixed(0)}</ProfitAmount>
        <ROI>+{roi.toFixed(1)}% ROI</ROI>
      </Header>

      {badges.length > 0 && (
        <Achievements>
          {badges.map((badge) => (
            <Badge key={badge} $color={getBadgeColor(badge)}>
              {getBadgeIcon(badge)}
              {getBadgeLabel(badge)}
            </Badge>
          ))}
        </Achievements>
      )}

      <Stats>
        <Stat>
          <div className="value">{streak}</div>
          <div className="label">Win Streak</div>
        </Stat>
        <Stat>
          <div className="value">{rivalBeaten || '-'}</div>
          <div className="label">Rival Beat</div>
        </Stat>
        <Stat>
          <div className="value">#{leaderboardPosition || '-'}</div>
          <div className="label">Rank</div>
        </Stat>
      </Stats>

      {achievements.length > 0 && (
        <Achievements>
          {achievements.map((ach, i) => (
            <Badge key={i} $color="#00FF88">
              🔥 {ach}
            </Badge>
          ))}
        </Achievements>
      )}

      <ShareSection>
        <ShareMessage>{shareMessage}</ShareMessage>
        <ButtonRow>
          <ShareButton onClick={onShare} data-testid="share-win-btn">
            <Share2 size={18} />
            Share & Invite
          </ShareButton>
          <CopyButton onClick={handleCopy} data-testid="copy-link-btn">
            <Copy size={18} />
          </CopyButton>
        </ButtonRow>
      </ShareSection>
    </Container>
  );
}

export default WinCardEnhanced;
