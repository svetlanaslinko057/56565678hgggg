'use client';

import React from 'react';
import { Flame, TrendingUp, TrendingDown, Activity, Users, BarChart3, Clock, Anchor } from 'lucide-react';
import styled from 'styled-components';

export interface FomoData {
  activity: {
    betsLast5Min: number;
    volumeLast5Min: number;
    totalBets: number;
    totalVolume: number;
  };
  sentiment: {
    yesPercent: number;
    noPercent: number;
    yesVolume: number;
    noVolume: number;
  };
  pressure: {
    level: 'low' | 'medium' | 'high';
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  flags: {
    isTrending: boolean;
    isHighActivity: boolean;
    isBullish: boolean;
    isBearish: boolean;
  };
  whales?: Array<{
    wallet: string;
    amount: number;
    side: 'yes' | 'no';
  }>;
  closing?: {
    time: string | null;
    inMinutes: number | null;
    isUrgent: boolean;
  };
}

interface FomoBadgeProps {
  fomoData: FomoData | null;
  compact?: boolean;
}

const FomoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
`;

const FomoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ActivityBadge = styled.div<{ $level: 'low' | 'medium' | 'high' }>`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $level }) =>
    $level === 'high' ? 'linear-gradient(135deg, #FF5858 0%, #FF8C42 100%)' :
    $level === 'medium' ? 'linear-gradient(135deg, #FFB800 0%, #FFD700 100%)' :
    '#f1f5f9'};
  color: ${({ $level }) => $level === 'low' ? '#64748b' : '#fff'};
  animation: ${({ $level }) => $level === 'high' ? 'fomoPulse 2s infinite' : 'none'};

  @keyframes fomoPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 88, 88, 0.4); }
    50% { transform: scale(1.02); box-shadow: 0 0 8px 2px rgba(255, 88, 88, 0.2); }
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const TrendBadge = styled.div<{ $trend: 'bullish' | 'bearish' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $trend }) =>
    $trend === 'bullish' ? 'rgba(5, 165, 132, 0.12)' :
    $trend === 'bearish' ? 'rgba(255, 88, 88, 0.12)' :
    '#f1f5f9'};
  color: ${({ $trend }) =>
    $trend === 'bullish' ? '#05A584' :
    $trend === 'bearish' ? '#FF5858' :
    '#64748b'};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const SentimentBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const BarLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;

  .yes {
    color: #05A584;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .no {
    color: #FF5858;
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

const BarTrack = styled.div`
  width: 100%;
  height: 5px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
`;

const BarFillYes = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #05A584 0%, #10b981 100%);
  border-radius: 3px 0 0 3px;
  transition: width 0.3s ease;
`;

const BarFillNo = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #f87171 0%, #FF5858 100%);
  border-radius: 0 3px 3px 0;
  transition: width 0.3s ease;
`;

const TrendingLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #FF5858 0%, #FF8C42 100%);
  color: #fff;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const FomoStats = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #64748b;

  span {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  strong {
    color: #0f172a;
    font-weight: 600;
  }

  svg {
    width: 11px;
    height: 11px;
    opacity: 0.7;
  }
`;

const WhaleAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: 8px;
  font-size: 11px;
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  
  .whale-icon {
    font-size: 14px;
  }
  
  .amount {
    font-weight: 700;
    color: #1e40af;
  }
  
  .side {
    font-weight: 600;
    &.yes { color: #05A584; }
    &.no { color: #FF5858; }
  }
`;

const ClosingTimer = styled.div<{ $urgent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $urgent }) => $urgent 
    ? 'linear-gradient(135deg, #FF5858 0%, #FF8C42 100%)' 
    : 'rgba(100, 116, 139, 0.1)'};
  color: ${({ $urgent }) => $urgent ? '#fff' : '#64748b'};
  animation: ${({ $urgent }) => $urgent ? 'urgentPulse 1.5s infinite' : 'none'};
  
  @keyframes urgentPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

export const FomoBadge: React.FC<FomoBadgeProps> = ({ fomoData, compact = false }) => {
  if (!fomoData) return null;

  const { activity, sentiment, pressure, flags, whales, closing } = fomoData;

  const getActivityLabel = () => {
    if (pressure.level === 'high') return `${activity.betsLast5Min} bets last 5 min`;
    if (pressure.level === 'medium') return `${activity.betsLast5Min} recent bets`;
    return 'Low activity';
  };

  const getTrendLabel = () => {
    if (pressure.trend === 'bullish') return 'Bullish';
    if (pressure.trend === 'bearish') return 'Bearish';
    return 'Neutral';
  };

  const formatClosingTime = () => {
    if (!closing?.inMinutes) return null;
    const mins = closing.inMinutes;
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${Math.floor(mins / 1440)}d`;
  };

  if (compact) {
    return (
      <FomoRow>
        <ActivityBadge $level={pressure.level} data-testid="fomo-activity-badge">
          <Flame size={12} />
          {activity.betsLast5Min > 0 ? `${activity.betsLast5Min} bets` : 'Low'}
        </ActivityBadge>
        {closing?.isUrgent && (
          <ClosingTimer $urgent data-testid="fomo-closing-urgent">
            <Clock size={12} />
            {formatClosingTime()}
          </ClosingTimer>
        )}
        <TrendBadge $trend={pressure.trend} data-testid="fomo-trend-badge">
          {pressure.trend === 'bullish' ? <TrendingUp size={12} /> : 
           pressure.trend === 'bearish' ? <TrendingDown size={12} /> : 
           <Activity size={12} />}
          {sentiment.yesPercent}% YES
        </TrendBadge>
      </FomoRow>
    );
  }

  return (
    <FomoContainer data-testid="fomo-container">
      {/* Activity + Trend + Closing badges row */}
      <FomoRow>
        <ActivityBadge $level={pressure.level} data-testid="fomo-activity-badge">
          <Flame size={12} />
          {getActivityLabel()}
        </ActivityBadge>
        {closing?.inMinutes && (
          <ClosingTimer $urgent={closing.isUrgent} data-testid="fomo-closing-timer">
            <Clock size={12} />
            Closing in {formatClosingTime()}
          </ClosingTimer>
        )}
        <TrendBadge $trend={pressure.trend} data-testid="fomo-trend-badge">
          {pressure.trend === 'bullish' ? <TrendingUp size={12} /> : 
           pressure.trend === 'bearish' ? <TrendingDown size={12} /> : 
           <Activity size={12} />}
          {getTrendLabel()}
        </TrendBadge>
      </FomoRow>

      {/* Whale alerts */}
      {whales && whales.length > 0 && (
        <WhaleAlert data-testid="fomo-whale-alert">
          <span className="whale-icon">🐋</span>
          <span>Whale bet</span>
          <span className="amount">${whales[0].amount}</span>
          <span className={`side ${whales[0].side}`}>
            {whales[0].side.toUpperCase()}
          </span>
        </WhaleAlert>
      )}

      {/* Sentiment bar */}
      <SentimentBar data-testid="fomo-sentiment-bar">
        <BarLabels>
          <span className="yes">YES {sentiment.yesPercent}%</span>
          <span className="no">NO {sentiment.noPercent}%</span>
        </BarLabels>
        <BarTrack>
          <BarFillYes $percent={sentiment.yesPercent} />
          <BarFillNo $percent={sentiment.noPercent} />
        </BarTrack>
      </SentimentBar>

      {/* Stats row */}
      <FomoStats data-testid="fomo-stats">
        <span>
          <Users size={11} />
          <strong>{activity.totalBets}</strong> bets
        </span>
        <span>
          <BarChart3 size={11} />
          <strong>{activity.totalVolume}</strong> USDT
        </span>
      </FomoStats>
    </FomoContainer>
  );
};

export const TrendingMarketTag: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  
  return (
    <TrendingLabel data-testid="trending-tag">
      <Flame size={10} />
      Trending
    </TrendingLabel>
  );
};

export default FomoBadge;
