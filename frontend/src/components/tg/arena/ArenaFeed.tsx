'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Flame, TrendingUp, Zap, Crown, Filter } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { MarketCard as MarketCardType, BetSheetData, mockMarkets, transformMarket, rankMarket } from './types';
import { MarketCard } from './MarketCard';
import { FilterChips, FilterType } from './FilterChips';
import { BetSheet } from './BetSheet';
import { getTelegramWebApp } from '@/lib/telegram';
import { LiveActivityTicker } from '@/components/arena/LiveActivityTicker';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.01); }
`;

const Container = styled.div`
  padding: 16px;
  padding-bottom: 100px;
`;

// Best Edge Banner
const BestEdgeBanner = styled.div<{ $accentColor: string }>`
  background: linear-gradient(135deg, ${props => props.$accentColor} 0%, ${props => props.$accentColor}cc 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  animation: ${pulse} 3s ease-in-out infinite;
  box-shadow: 0 8px 32px ${props => props.$accentColor}40;
`;

const BannerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const BannerLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const BannerTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #000;
  margin-bottom: 12px;
  line-height: 1.3;
`;

const BannerStats = styled.div`
  display: flex;
  gap: 16px;
`;

const BannerStat = styled.div`
  .value {
    font-size: 20px;
    font-weight: 800;
    color: #000;
  }
  
  .label {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.6);
    text-transform: uppercase;
  }
`;

const BannerCTA = styled.button`
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.9);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:active {
    transform: scale(0.98);
  }
`;

// Filter Section
const FilterSection = styled.div`
  margin-bottom: 16px;
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const FilterTitle = styled.h2<{ $textColor: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$textColor};
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
`;

const EdgeFilterChips = styled.div`
  display: flex;
  gap: 8px;
`;

const EdgeChip = styled.button<{ $active: boolean; $color: string; $bgColor: string }>`
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active, $color, $bgColor }) => $active ? `
    background: ${$color}25;
    color: ${$color};
    border: 1px solid ${$color}50;
  ` : `
    background: ${$bgColor};
    color: ${$color}80;
    border: 1px solid transparent;
  `}
`;

// Section Title
const SectionTitle = styled.h2<{ $textColor: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 20px 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MarketsList = styled.div``;

const LoadingState = styled.div<{ $mutedColor: string }>`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.$mutedColor};
  font-size: 15px;
`;

const EmptyState = styled.div<{ $textColor: string; $mutedColor: string }>`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  h4 {
    font-size: 18px;
    color: ${props => props.$textColor};
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.$mutedColor};
    margin: 0;
  }
`;

type EdgeFilter = 'all' | 'best' | 'high';

export function ArenaFeed() {
  const { theme } = useTheme();
  const [markets, setMarkets] = useState<MarketCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('trending');
  const [edgeFilter, setEdgeFilter] = useState<EdgeFilter>('all');
  const [betSheetData, setBetSheetData] = useState<BetSheetData | null>(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/onchain/markets`);
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        const transformed = result.data.map(transformMarket);
        setMarkets(transformed);
      } else {
        setMarkets(mockMarkets);
      }
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      setMarkets(mockMarkets);
    } finally {
      setLoading(false);
    }
  };

  // Smart sorted markets
  const sortedMarkets = useMemo(() => {
    let sorted = [...markets].sort((a, b) => rankMarket(b) - rankMarket(a));
    
    // Apply edge filter
    if (edgeFilter === 'best') {
      sorted = sorted.filter(m => Math.abs(m.ai.edge) > 0.08);
    } else if (edgeFilter === 'high') {
      sorted = sorted.filter(m => Math.abs(m.ai.edge) > 0.05);
    }
    
    // Apply category filter
    switch (activeFilter) {
      case 'trending':
        sorted = sorted.filter(m => m.fomo.trending || m.betsCount > 100);
        break;
      case 'live':
        sorted = sorted.filter(m => {
          const hoursLeft = (m.closesAt.getTime() - Date.now()) / (1000 * 60 * 60);
          return hoursLeft > 0;
        });
        break;
      case 'closing':
        sorted = sorted.filter(m => m.fomo.urgency === 'high' || m.fomo.urgency === 'medium');
        sorted.sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime());
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume - a.volume);
        break;
    }
    
    return sorted;
  }, [markets, activeFilter, edgeFilter]);

  // Best edge market for banner
  const bestEdgeMarket = useMemo(() => {
    const validMarkets = markets.filter(m => m.ai.edge > 0.07 && m.ai.signal !== 'wait');
    if (validMarkets.length === 0) return null;
    return validMarkets.reduce((best, m) => 
      rankMarket(m) > rankMarket(best) ? m : best
    );
  }, [markets]);

  const handleBet = (data: BetSheetData) => {
    // Haptic feedback
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
    setBetSheetData(data);
  };

  const handleBetPlaced = (txHash: string, tokenId: number) => {
    console.log('Bet placed successfully:', { txHash, tokenId });
    // Refresh markets after bet
    fetchMarkets();
  };

  const handleBestEdgeBet = () => {
    if (!bestEdgeMarket) return;
    const side = bestEdgeMarket.ai.edge > 0 ? 'YES' : 'NO';
    handleBet({
      marketId: bestEdgeMarket.id,
      onchainId: bestEdgeMarket.onchainId,
      marketTitle: bestEdgeMarket.title,
      side: side as 'YES' | 'NO',
      odds: side === 'YES' ? bestEdgeMarket.yesOdds : bestEdgeMarket.noOdds,
      ai: bestEdgeMarket.ai,
      marketPercent: side === 'YES' ? bestEdgeMarket.yesPercent : bestEdgeMarket.noPercent
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingState $mutedColor={theme.textMuted}>
          ⏳ Loading markets...
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container data-testid="arena-feed">
      {/* Best Edge Banner */}
      {bestEdgeMarket && (
        <BestEdgeBanner $accentColor={theme.accent}>
          <BannerHeader>
            <Crown size={16} color="#000" />
            <BannerLabel>🔥 Best Edge Right Now</BannerLabel>
          </BannerHeader>
          <BannerTitle>{bestEdgeMarket.title}</BannerTitle>
          <BannerStats>
            <BannerStat>
              <div className="value">{Math.round(bestEdgeMarket.ai.probability * 100)}%</div>
              <div className="label">AI Prob</div>
            </BannerStat>
            <BannerStat>
              <div className="value">{bestEdgeMarket.yesPercent}%</div>
              <div className="label">Market</div>
            </BannerStat>
            <BannerStat>
              <div className="value">+{Math.round(bestEdgeMarket.ai.edge * 100)}%</div>
              <div className="label">Edge</div>
            </BannerStat>
          </BannerStats>
          <BannerCTA onClick={handleBestEdgeBet} data-testid="best-edge-bet">
            <Zap size={18} /> 
            Bet {bestEdgeMarket.ai.edge > 0 ? 'YES' : 'NO'} (+{Math.round(bestEdgeMarket.ai.edge * 100)}%)
          </BannerCTA>
        </BestEdgeBanner>
      )}

      {/* Filter Section */}
      <FilterSection>
        <FilterHeader>
          <FilterTitle $textColor={theme.textMuted}>
            <Filter size={14} /> Filter by Edge
          </FilterTitle>
          <EdgeFilterChips>
            <EdgeChip 
              $active={edgeFilter === 'all'}
              $color={theme.accent}
              $bgColor={theme.bgCard}
              onClick={() => setEdgeFilter('all')}
            >
              All
            </EdgeChip>
            <EdgeChip 
              $active={edgeFilter === 'high'}
              $color={theme.warning}
              $bgColor={theme.bgCard}
              onClick={() => setEdgeFilter('high')}
            >
              +5%
            </EdgeChip>
            <EdgeChip 
              $active={edgeFilter === 'best'}
              $color={theme.success}
              $bgColor={theme.bgCard}
              onClick={() => setEdgeFilter('best')}
            >
              🔥 +8%
            </EdgeChip>
          </EdgeFilterChips>
        </FilterHeader>
        <FilterChips active={activeFilter} onChange={setActiveFilter} />
      </FilterSection>

      {/* Section Title */}
      <SectionTitle $textColor={theme.textPrimary}>
        {activeFilter === 'trending' && <><Flame size={18} color="#ff4d4f" /> Hot Markets</>}
        {activeFilter === 'live' && <><Zap size={18} color="#00c8ff" /> Live Markets</>}
        {activeFilter === 'closing' && <><TrendingUp size={18} color="#ffa500" /> Closing Soon</>}
        {activeFilter === 'volume' && <><TrendingUp size={18} color="#b464ff" /> Top Volume</>}
      </SectionTitle>

      {/* Markets List */}
      <MarketsList>
        {sortedMarkets.length === 0 ? (
          <EmptyState $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
            <div className="icon">🎯</div>
            <h4>No markets match filters</h4>
            <p>Try adjusting filters or check back later</p>
          </EmptyState>
        ) : (
          sortedMarkets.map((market, index) => (
            <MarketCard 
              key={market.id} 
              market={market} 
              onBet={handleBet}
              isBestEdge={index === 0 && edgeFilter !== 'all'}
            />
          ))
        )}
      </MarketsList>

      {/* Bet Sheet */}
      <BetSheet
        isOpen={!!betSheetData}
        data={betSheetData}
        onClose={() => setBetSheetData(null)}
        onBetPlaced={handleBetPlaced}
      />

      {/* Live Activity Ticker */}
      <LiveActivityTicker />
    </Container>
  );
}

export default ArenaFeed;
