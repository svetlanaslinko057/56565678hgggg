'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Share2, ExternalLink, Check } from 'lucide-react';
import { useArena } from '@/lib/api/ArenaContext';
import { PositionsAPI } from '@/lib/api/arena';
import { ShareAPI } from '@/lib/api/shareApi';

const Container = styled.div`
  background: rgba(30, 30, 40, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
`;

const FilterTab = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $active }) => $active ? `
    background: rgba(0, 255, 136, 0.2);
    color: #00ff88;
    border: 1px solid rgba(0, 255, 136, 0.3);
  ` : `
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid transparent;
    
    &:hover {
      color: #fff;
    }
  `}
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const SummaryCard = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 12px;
`;

const SummaryLabel = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
`;

const SummaryValue = styled.div<{ $positive?: boolean; $negative?: boolean; $highlight?: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${({ $positive, $negative, $highlight }) => 
    $highlight ? '#00ff88' :
    $positive ? '#00ff88' : 
    $negative ? '#ff6b6b' : 
    '#fff'
  };
`;

const PositionList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const PositionCard = styled.div<{ $status?: string }>`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  border-left: 3px solid ${({ $status }) => {
    switch ($status) {
      case 'won': return '#00ff88';
      case 'lost': return '#ff6b6b';
      case 'listed': return '#ffc107';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
`;

const PositionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const MarketTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex: 1;
  margin-right: 8px;
`;

const StatusBadge = styled.span<{ $status?: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  
  ${({ $status }) => {
    switch ($status) {
      case 'won':
        return `background: rgba(0, 255, 136, 0.2); color: #00ff88;`;
      case 'lost':
        return `background: rgba(255, 107, 107, 0.2); color: #ff6b6b;`;
      case 'listed':
        return `background: rgba(255, 193, 7, 0.2); color: #ffc107;`;
      case 'claimed':
        return `background: rgba(100, 100, 100, 0.2); color: #888;`;
      default:
        return `background: rgba(0, 200, 255, 0.2); color: #00c8ff;`;
    }
  }}
`;

const PositionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const Detail = styled.div`
  text-align: center;
`;

const DetailLabel = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 2px;
`;

const DetailValue = styled.div<{ $highlight?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $highlight }) => $highlight ? '#00ff88' : '#fff'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, #00ff88, #00cc66);
    color: #000;
    border: none;
  ` : `
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
`;

const ShareButton = styled.button<{ $copied?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $copied }) => $copied ? 'rgba(0, 255, 136, 0.2)' : 'rgba(5, 165, 132, 0.15)'};
  color: ${({ $copied }) => $copied ? '#00ff88' : '#05A584'};
  border: 1px solid ${({ $copied }) => $copied ? 'rgba(0, 255, 136, 0.3)' : 'rgba(5, 165, 132, 0.3)'};
  
  &:hover {
    background: rgba(5, 165, 132, 0.25);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const MyPositionsPanel: React.FC = () => {
  const { positions, positionsLoading, refreshPositions, refreshBalance, currentWallet } = useArena();
  const [filter, setFilter] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter positions
  const filteredPositions = positions.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'open') return ['open', 'listed'].includes(p.status);
    if (filter === 'closed') return ['won', 'lost', 'claimed'].includes(p.status);
    return p.status === filter;
  });

  // Calculate summary
  const totalInvested = positions
    .filter(p => ['open', 'listed', 'won'].includes(p.status))
    .reduce((sum, p) => sum + p.stake, 0);
  
  const totalPotentialReturn = positions
    .filter(p => ['open', 'listed'].includes(p.status))
    .reduce((sum, p) => sum + p.potentialReturn, 0);
  
  const totalProfit = positions
    .filter(p => ['won', 'lost'].includes(p.status))
    .reduce((sum, p) => sum + (p.profit || 0), 0);

  const handleClaim = async (positionId: string) => {
    setClaimingId(positionId);
    try {
      const result = await PositionsAPI.claimPayout(positionId);
      if (result.success) {
        await refreshPositions();
        await refreshBalance();
      }
    } finally {
      setClaimingId(null);
    }
  };

  const handleShare = async (positionId: string) => {
    if (!currentWallet) return;
    
    setSharingId(positionId);
    try {
      const result = await ShareAPI.createShareLink(positionId, currentWallet);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(result.url);
      setCopiedId(positionId);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to create share link:', e);
    } finally {
      setSharingId(null);
    }
  };

  return (
    <Container>
      <Header>
        <Title>My Positions</Title>
        <FilterTabs>
          <FilterTab $active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterTab>
          <FilterTab $active={filter === 'open'} onClick={() => setFilter('open')}>Open</FilterTab>
          <FilterTab $active={filter === 'closed'} onClick={() => setFilter('closed')}>Closed</FilterTab>
        </FilterTabs>
      </Header>

      <Summary>
        <SummaryCard>
          <SummaryLabel>Total Invested</SummaryLabel>
          <SummaryValue>${totalInvested.toFixed(2)}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Potential Return</SummaryLabel>
          <SummaryValue $highlight>${totalPotentialReturn.toFixed(2)}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Realized P&L</SummaryLabel>
          <SummaryValue 
            $positive={totalProfit > 0} 
            $negative={totalProfit < 0}
          >
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Active Positions</SummaryLabel>
          <SummaryValue>{positions.filter(p => p.status === 'open').length}</SummaryValue>
        </SummaryCard>
      </Summary>

      <PositionList>
        {positionsLoading && (
          <EmptyState>Loading positions...</EmptyState>
        )}
        
        {!positionsLoading && filteredPositions.length === 0 && (
          <EmptyState>
            No positions yet. Place a bet to get started!
          </EmptyState>
        )}

        {filteredPositions.map((position) => (
          <PositionCard key={position._id} $status={position.status}>
            <PositionHeader>
              <MarketTitle>{position.outcomeLabel}</MarketTitle>
              <StatusBadge $status={position.status}>{position.status}</StatusBadge>
            </PositionHeader>
            
            <PositionDetails>
              <Detail>
                <DetailLabel>Stake</DetailLabel>
                <DetailValue>${position.stake?.toFixed(2)}</DetailValue>
              </Detail>
              <Detail>
                <DetailLabel>Odds</DetailLabel>
                <DetailValue>{position.odds?.toFixed(2)}x</DetailValue>
              </Detail>
              <Detail>
                <DetailLabel>{position.status === 'won' ? 'Payout' : 'Potential'}</DetailLabel>
                <DetailValue $highlight>
                  ${(position.payout || position.potentialReturn)?.toFixed(2)}
                </DetailValue>
              </Detail>
            </PositionDetails>

            {position.status === 'won' && (
              <ActionButtons>
                <ActionButton 
                  $variant="primary"
                  onClick={() => handleClaim(position._id)}
                  disabled={claimingId === position._id}
                >
                  {claimingId === position._id ? 'Claiming...' : 'Claim Payout'}
                </ActionButton>
                <ShareButton
                  onClick={() => handleShare(position._id)}
                  disabled={sharingId === position._id}
                  $copied={copiedId === position._id}
                  data-testid={`share-win-${position._id}`}
                >
                  {copiedId === position._id ? (
                    <>
                      <Check size={12} />
                      Copied!
                    </>
                  ) : sharingId === position._id ? (
                    'Sharing...'
                  ) : (
                    <>
                      <Share2 size={12} />
                      Share Win
                    </>
                  )}
                </ShareButton>
              </ActionButtons>
            )}

            {position.status === 'open' && (
              <ActionButtons>
                <ActionButton $variant="secondary">Sell Position</ActionButton>
                <ShareButton
                  onClick={() => handleShare(position._id)}
                  disabled={sharingId === position._id}
                  $copied={copiedId === position._id}
                  data-testid={`share-bet-${position._id}`}
                >
                  {copiedId === position._id ? (
                    <>
                      <Check size={12} />
                      Copied!
                    </>
                  ) : sharingId === position._id ? (
                    'Sharing...'
                  ) : (
                    <>
                      <Share2 size={12} />
                      Share
                    </>
                  )}
                </ShareButton>
              </ActionButtons>
            )}
          </PositionCard>
        ))}
      </PositionList>
    </Container>
  );
};

export default MyPositionsPanel;
