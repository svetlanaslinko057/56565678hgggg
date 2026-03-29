'use client';

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Clock, Users, DollarSign } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { MarketCard as MarketCardType, BetSheetData } from './types';
import { FomoLayer } from './FomoLayer';
import { EdgeBar, EdgeBadge, AISignal, RiskBadge, ForYouBadge } from './AIComponents';

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.15); }
  50% { box-shadow: 0 0 35px rgba(0, 255, 136, 0.25); }
`;

const Card = styled.div<{ $bgColor: string; $borderColor: string; $isHot: boolean; $isBestEdge: boolean }>`
  background: ${props => props.$bgColor};
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.$borderColor};
  transition: all 0.3s;
  
  ${props => props.$isHot && css`
    animation: ${glow} 3s ease-in-out infinite;
  `}
  
  ${props => props.$isBestEdge && css`
    transform: scale(1.02);
    border-color: var(--accent);
    box-shadow: 0 8px 32px rgba(0, 255, 136, 0.2);
  `}
  
  &:active {
    transform: scale(0.99);
  }
`;

const TopBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const CardHeader = styled.div`
  margin-bottom: 12px;
`;

const Category = styled.span<{ $mutedColor: string }>`
  font-size: 11px;
  color: ${props => props.$mutedColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Title = styled.h3<{ $textColor: string }>`
  font-size: 17px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 4px 0 0 0;
  line-height: 1.4;
`;

const OddsSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
`;

const OddsBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const OddsLabel = styled.div<{ $side: 'yes' | 'no'; $successColor: string; $dangerColor: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .side {
    font-size: 12px;
    font-weight: 700;
    color: ${({ $side, $successColor, $dangerColor }) => $side === 'yes' ? $successColor : $dangerColor};
  }
  
  .percent {
    font-size: 22px;
    font-weight: 800;
    color: ${({ $side, $successColor, $dangerColor }) => $side === 'yes' ? $successColor : $dangerColor};
  }
`;

const AIInsights = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  flex-wrap: wrap;
  gap: 8px;
`;

const StatsRow = styled.div<{ $mutedColor: string }>`
  display: flex;
  gap: 16px;
  margin: 12px 0;
  
  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: ${props => props.$mutedColor};
    
    svg {
      opacity: 0.7;
    }
    
    strong {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
`;

const WhaleAgreement = styled.div<{ $agrees: boolean; $color: string }>`
  font-size: 11px;
  color: ${props => props.$color};
  margin-top: 4px;
  
  .icon {
    margin-right: 4px;
  }
`;

const BetButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const BetButton = styled.button<{ 
  $side: 'yes' | 'no'; 
  $successColor: string; 
  $dangerColor: string;
  $hasEdge: boolean;
}>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  position: relative;
  
  ${({ $side, $successColor, $dangerColor, $hasEdge }) => $side === 'yes' ? css`
    background: linear-gradient(135deg, ${$successColor}${$hasEdge ? '35' : '20'} 0%, ${$successColor}15 100%);
    border: 2px solid ${$successColor}${$hasEdge ? '80' : '50'};
    
    &:active {
      background: ${$successColor}50;
      transform: scale(0.97);
    }
    
    .label {
      color: ${$successColor};
    }
  ` : css`
    background: linear-gradient(135deg, ${$dangerColor}${$hasEdge ? '35' : '20'} 0%, ${$dangerColor}15 100%);
    border: 2px solid ${$dangerColor}${$hasEdge ? '80' : '50'};
    
    &:active {
      background: ${$dangerColor}50;
      transform: scale(0.97);
    }
    
    .label {
      color: ${$dangerColor};
    }
  `}
  
  .label {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 2px;
  }
  
  .odds {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
  }
  
  .edge-hint {
    font-size: 10px;
    margin-top: 4px;
    opacity: 0.9;
  }
`;

const NoEdgeHint = styled.div<{ $mutedColor: string }>`
  text-align: center;
  font-size: 11px;
  color: ${props => props.$mutedColor};
  margin-top: 12px;
  padding: 8px;
  background: ${props => props.$mutedColor}10;
  border-radius: 8px;
`;

function formatTimeLeft(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  
  if (diff <= 0) return 'Ended';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

interface MarketCardProps {
  market: MarketCardType;
  onBet: (data: BetSheetData) => void;
  isBestEdge?: boolean;
}

export function MarketCard({ market, onBet, isBestEdge = false }: MarketCardProps) {
  const { theme } = useTheme();
  const aiPercent = Math.round(market.ai.probability * 100);
  const edgePercent = Math.round(market.ai.edge * 100);
  const isHot = market.fomo.trending || market.fomo.urgency === 'high';
  const hasPositiveEdge = market.ai.edge > 0.05;
  const hasNegativeEdge = market.ai.edge < -0.05;
  
  // Determine which side AI favors
  const aiFavorsSide = market.ai.edge > 0 ? 'YES' : 'NO';
  const recommendedSide = market.ai.signal === 'buy' ? 'YES' : market.ai.signal === 'sell' ? 'NO' : null;

  // Check if whale agrees with AI
  const whaleAgrees = market.fomo.whale && market.fomo.whale.side === aiFavorsSide;

  const handleBet = (side: 'YES' | 'NO') => {
    onBet({
      marketId: market.id,
      marketTitle: market.title,
      side,
      odds: side === 'YES' ? market.yesOdds : market.noOdds,
      ai: market.ai,
      marketPercent: side === 'YES' ? market.yesPercent : market.noPercent
    });
  };

  return (
    <Card 
      $bgColor={theme.bgCard} 
      $borderColor={theme.border}
      $isHot={isHot}
      $isBestEdge={isBestEdge}
      data-testid="market-card"
      id={isBestEdge ? 'best-edge' : undefined}
    >
      <TopBadges>
        {market.forYou && <ForYouBadge />}
        <RiskBadge risk={market.risk} />
      </TopBadges>

      <CardHeader>
        {market.category && (
          <Category $mutedColor={theme.textMuted}>{market.category}</Category>
        )}
        <Title $textColor={theme.textPrimary}>{market.title}</Title>
      </CardHeader>

      <OddsSection>
        <OddsBar>
          <OddsLabel $side="yes" $successColor={theme.success} $dangerColor={theme.danger}>
            <span className="side">YES</span>
            <span className="percent">{market.yesPercent}%</span>
          </OddsLabel>
        </OddsBar>
        <OddsBar>
          <OddsLabel $side="no" $successColor={theme.success} $dangerColor={theme.danger}>
            <span className="side">NO</span>
            <span className="percent">{market.noPercent}%</span>
          </OddsLabel>
        </OddsBar>
      </OddsSection>

      {/* Edge Bar - Visual comparison */}
      <EdgeBar marketPercent={market.yesPercent} aiPercent={aiPercent} />

      {/* AI Insights Row */}
      <AIInsights>
        <AISignal signal={market.ai.signal} confidence={market.ai.confidence} />
        <EdgeBadge edge={market.ai.edge} />
      </AIInsights>

      <StatsRow $mutedColor={theme.textMuted}>
        <div className="stat">
          <Users size={12} />
          <strong>{market.betsCount}</strong> bets
        </div>
        <div className="stat">
          <DollarSign size={12} />
          <strong>${(market.volume / 1000).toFixed(1)}K</strong>
        </div>
        <div className="stat">
          <Clock size={12} />
          <strong>{formatTimeLeft(market.closesAt)}</strong>
        </div>
      </StatsRow>

      <FomoLayer fomo={market.fomo} />
      
      {/* Whale + AI Agreement */}
      {market.fomo.whale && (
        <WhaleAgreement 
          $agrees={whaleAgrees || false} 
          $color={whaleAgrees ? theme.success : theme.warning}
        >
          {whaleAgrees 
            ? `🐋 Whale agrees with AI (${aiFavorsSide})`
            : `🐋 Whale bet ${market.fomo.whale.side} - AI disagrees`
          }
        </WhaleAgreement>
      )}

      {/* Bet Buttons with Edge hints */}
      {market.ai.signal === 'wait' ? (
        <NoEdgeHint $mutedColor={theme.textMuted}>
          ⏳ No strong edge — wait for better setup
        </NoEdgeHint>
      ) : (
        <BetButtons>
          <BetButton 
            $side="yes" 
            $successColor={theme.success} 
            $dangerColor={theme.danger}
            $hasEdge={hasPositiveEdge}
            onClick={() => handleBet('YES')}
            data-testid="bet-yes"
          >
            <span className="label">YES</span>
            <span className="odds">{market.yesOdds.toFixed(2)}x</span>
            {hasPositiveEdge && (
              <span className="edge-hint" style={{ color: theme.success }}>
                +{edgePercent}% Edge
              </span>
            )}
          </BetButton>
          <BetButton 
            $side="no" 
            $successColor={theme.success} 
            $dangerColor={theme.danger}
            $hasEdge={hasNegativeEdge}
            onClick={() => handleBet('NO')}
            data-testid="bet-no"
          >
            <span className="label">NO</span>
            <span className="odds">{market.noOdds.toFixed(2)}x</span>
            {hasNegativeEdge && (
              <span className="edge-hint" style={{ color: theme.danger }}>
                +{Math.abs(edgePercent)}% Edge
              </span>
            )}
          </BetButton>
        </BetButtons>
      )}
    </Card>
  );
}

export default MarketCard;
