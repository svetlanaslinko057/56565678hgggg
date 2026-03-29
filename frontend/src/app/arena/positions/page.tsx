'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { PositionsAPI, MarketplaceAPI } from '@/lib/api/arena';
import { useArena } from '@/lib/api/ArenaContext';
import { ArrowRight, TrendingUp, TrendingDown, Clock, ShoppingBag, DollarSign, Award, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClaim, CLAIM_STATUS_MESSAGES } from '@/hooks/useClaim';
import { env } from '@/lib/web3/env';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #738094;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #eef1f5;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => `${$color}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  
  svg {
    color: ${({ $color }) => $color};
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #738094;
  margin-bottom: 4px;
`;

const StatValue = styled.div<{ $positive?: boolean; $negative?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${({ $positive, $negative }) => 
    $positive ? '#05A584' : 
    $negative ? '#FF5858' : 
    '#0f172a'
  };
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  background: #f5f7fa;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
  width: fit-content;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${({ $active }) => $active ? `
    background: #fff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  ` : `
    background: transparent;
    color: #738094;
    
    &:hover {
      color: #0f172a;
    }
  `}
`;

const TabCount = styled.span`
  background: ${({ color }) => color || '#eef1f5'};
  color: ${({ color }) => color ? '#fff' : '#738094'};
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
`;

const PositionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PositionCard = styled.div<{ $status?: string }>`
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #eef1f5;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 16px;
  
  border-left: 4px solid ${({ $status }) => {
    switch ($status) {
      case 'won': return '#05A584';
      case 'lost': return '#FF5858';
      case 'listed': return '#FFB800';
      case 'sold': return '#738094';
      case 'claimed': return '#9CA3AF';
      default: return '#3B82F6';
    }
  }};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
`;

const PositionInfo = styled.div`
  flex: 1;
`;

const MarketTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
  
  &:hover {
    color: #05A584;
  }
`;

const PositionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const MetaTag = styled.span<{ $variant?: string }>`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'yes':
        return 'background: #E6F7F3; color: #05A584;';
      case 'no':
        return 'background: #FEE2E2; color: #FF5858;';
      case 'won':
        return 'background: #D1FAE5; color: #059669;';
      case 'lost':
        return 'background: #FEE2E2; color: #DC2626;';
      case 'listed':
        return 'background: #FEF3C7; color: #D97706;';
      default:
        return 'background: #EEF1F5; color: #738094;';
    }
  }}
`;

const PositionStats = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const Stat = styled.div`
  text-align: right;
`;

const StatSmallLabel = styled.div`
  font-size: 11px;
  color: #738094;
  margin-bottom: 2px;
`;

const StatSmallValue = styled.div<{ $highlight?: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${({ $highlight }) => $highlight ? '#05A584' : '#0f172a'};
`;

const ActionBtn = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${({ $variant }) => $variant === 'primary' ? `
    background: #05A584;
    color: #fff;
    border: none;
    
    &:hover {
      background: #048a6e;
    }
  ` : $variant === 'danger' ? `
    background: #FEE2E2;
    color: #DC2626;
    border: none;
    
    &:hover {
      background: #FECACA;
    }
  ` : `
    background: #fff;
    color: #738094;
    border: 1px solid #eef1f5;
    
    &:hover {
      border-color: #05A584;
      color: #05A584;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px dashed #e5e7eb;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #738094;
  margin-bottom: 16px;
`;

const StartButton = styled.button`
  background: #05A584;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: #048a6e;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #738094;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const ClaimSuccessBanner = styled.div`
  background: #D1FAE5;
  border: 1px solid #34D399;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #059669;
  font-weight: 500;
`;

const ClaimErrorBanner = styled.div`
  background: #FEE2E2;
  border: 1px solid #F87171;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #DC2626;
  font-weight: 500;
`;

type TabType = 'all' | 'open' | 'won' | 'lost' | 'listed';

export default function PositionsPage() {
  const router = useRouter();
  const { currentWallet, refreshBalance, refreshPositions } = useArena();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<{ amount: number; txHash?: string } | null>(null);
  
  // On-chain claim hook
  const claimHook = useClaim();

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const statusMap: Record<TabType, string | undefined> = {
        all: undefined,
        open: 'open',
        won: 'won',
        lost: 'lost',
        listed: 'listed',
      };
      const result = await PositionsAPI.getMyPositions({
        status: statusMap[activeTab],
        limit: 50,
      });
      setPositions(result.data || []);
    } catch (e) {
      console.error('Failed to fetch positions:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentWallet) {
      fetchPositions();
    }
  }, [fetchPositions, currentWallet]);

  // Calculate stats
  const stats = {
    totalInvested: positions.filter(p => ['open', 'listed'].includes(p.status)).reduce((sum, p) => sum + (p.stake || 0), 0),
    potentialReturn: positions.filter(p => ['open', 'listed'].includes(p.status)).reduce((sum, p) => sum + (p.potentialReturn || 0), 0),
    realizedPnL: positions.filter(p => ['won', 'lost'].includes(p.status)).reduce((sum, p) => sum + (p.profit || 0), 0),
    activeCount: positions.filter(p => p.status === 'open').length,
  };

  const counts = {
    all: positions.length,
    open: positions.filter(p => p.status === 'open').length,
    won: positions.filter(p => p.status === 'won').length,
    lost: positions.filter(p => p.status === 'lost').length,
    listed: positions.filter(p => p.status === 'listed').length,
  };

  const handleClaim = async (position: any) => {
    setActionLoading(position._id);
    setClaimSuccess(null);
    
    try {
      // On-chain claim if enabled
      if (env.ONCHAIN_ENABLED && position.nft?.tokenId) {
        const result = await claimHook.claim({
          tokenId: position.nft.tokenId,
          marketId: position.marketId,
          chainMarketId: position.chainMarketId,
          outcomeId: position.outcomeId,
          outcomeLabel: position.outcomeLabel,
          stake: position.stake,
          shares: position.shares || 0,
          potentialReturn: position.potentialReturn || position.payout || position.stake * 2,
          status: 'WON',
        });
        
        if (result.success) {
          setClaimSuccess({ amount: result.amount || position.payout || position.stake * 2, txHash: result.txHash });
          await fetchPositions();
          await refreshBalance();
        }
        claimHook.reset();
        return;
      }
      
      // Off-chain claim fallback
      const result = await PositionsAPI.claimPayout(position._id);
      if (result.success) {
        setClaimSuccess({ amount: position.payout || position.stake * 2 });
        await fetchPositions();
        await refreshBalance();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleList = async (positionId: string, price: number) => {
    setActionLoading(positionId);
    try {
      const result = await PositionsAPI.listPosition(positionId, price);
      if (result.success) {
        await fetchPositions();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await MarketplaceAPI.cancelListing(listingId);
      await fetchPositions();
    } finally {
      setActionLoading(null);
    }
  };

  // Claim All - for all winning positions
  const claimablePositions = positions.filter(p => p.status === 'won');
  const totalClaimable = claimablePositions.reduce((sum, p) => sum + (p.payout || p.potentialReturn || p.stake * 2), 0);

  const handleClaimAll = async () => {
    if (claimablePositions.length === 0) return;
    
    setClaimSuccess(null);
    let totalClaimed = 0;
    
    for (const position of claimablePositions) {
      setActionLoading(position._id);
      try {
        if (env.ONCHAIN_ENABLED && position.nft?.tokenId) {
          const result = await claimHook.claim({
            tokenId: position.nft.tokenId,
            marketId: position.marketId,
            chainMarketId: position.chainMarketId,
            outcomeId: position.outcomeId,
            outcomeLabel: position.outcomeLabel,
            stake: position.stake,
            shares: position.shares || 0,
            potentialReturn: position.potentialReturn || position.payout || position.stake * 2,
            status: 'WON',
          });
          if (result.success) {
            totalClaimed += result.amount || 0;
          }
          claimHook.reset();
        } else {
          const result = await PositionsAPI.claimPayout(position._id);
          if (result.success) {
            totalClaimed += position.payout || position.stake * 2;
          }
        }
      } catch (e) {
        console.error('Claim failed for', position._id, e);
      }
    }
    
    if (totalClaimed > 0) {
      setClaimSuccess({ amount: totalClaimed });
      await fetchPositions();
      await refreshBalance();
    }
    setActionLoading(null);
  };

  const crumbs = [
    { title: 'Arena', link: '/' },
    { title: 'My Positions', link: '' },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!currentWallet) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState>
            <EmptyTitle>Connect to View Positions</EmptyTitle>
            <EmptyText>Start a demo session to track your positions</EmptyText>
            <StartButton onClick={() => router.push('/')}>
              Go to Arena
            </StartButton>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <Container>
        <Header>
          <Title data-testid="positions-title">My Positions</Title>
          <Subtitle>Track and manage all your prediction bets</Subtitle>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon $color="#3B82F6">
              <DollarSign size={20} />
            </StatIcon>
            <StatLabel>Total Invested</StatLabel>
            <StatValue data-testid="stat-invested">${stats.totalInvested.toFixed(2)}</StatValue>
          </StatCard>
          <StatCard>
            <StatIcon $color="#05A584">
              <TrendingUp size={20} />
            </StatIcon>
            <StatLabel>Potential Return</StatLabel>
            <StatValue $positive data-testid="stat-potential">${stats.potentialReturn.toFixed(2)}</StatValue>
          </StatCard>
          <StatCard>
            <StatIcon $color={stats.realizedPnL >= 0 ? '#05A584' : '#FF5858'}>
              {stats.realizedPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </StatIcon>
            <StatLabel>Realized P&L</StatLabel>
            <StatValue $positive={stats.realizedPnL > 0} $negative={stats.realizedPnL < 0} data-testid="stat-pnl">
              {stats.realizedPnL >= 0 ? '+' : ''}${stats.realizedPnL.toFixed(2)}
            </StatValue>
          </StatCard>
          <StatCard>
            <StatIcon $color="#8B5CF6">
              <Award size={20} />
            </StatIcon>
            <StatLabel>Active Positions</StatLabel>
            <StatValue data-testid="stat-active">{stats.activeCount}</StatValue>
          </StatCard>
        </StatsGrid>

        {/* Claim Success Banner */}
        {claimSuccess && (
          <ClaimSuccessBanner data-testid="claim-success-banner">
            <CheckCircle size={20} />
            <span>
              Successfully claimed <strong>${claimSuccess.amount.toFixed(2)} USDT</strong>
              {claimSuccess.txHash && (
                <a 
                  href={`https://testnet.bscscan.com/tx/${claimSuccess.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: 8, color: '#059669', textDecoration: 'underline' }}
                >
                  View TX
                </a>
              )}
            </span>
          </ClaimSuccessBanner>
        )}

        {/* Claim Error Banner */}
        {claimHook.isError && claimHook.error && (
          <ClaimErrorBanner data-testid="claim-error-banner">
            <AlertCircle size={20} />
            <span>{claimHook.error}</span>
          </ClaimErrorBanner>
        )}

        {/* Claim All Banner */}
        {claimablePositions.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(5, 165, 132, 0.1), rgba(59, 130, 246, 0.1))',
            border: '1px solid rgba(5, 165, 132, 0.3)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#05A584', fontWeight: 600, marginBottom: 4 }}>
                You have {claimablePositions.length} winning position{claimablePositions.length > 1 ? 's' : ''}!
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                Total claimable: <strong style={{ color: '#00ff88' }}>${totalClaimable.toFixed(2)} USDT</strong>
              </div>
            </div>
            <button
              onClick={handleClaimAll}
              disabled={actionLoading !== null || claimHook.isLoading}
              data-testid="claim-all-btn"
              style={{
                padding: '12px 24px',
                background: '#05A584',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {(actionLoading || claimHook.isLoading) ? (
                <>
                  <SpinIcon size={16} />
                  Claiming...
                </>
              ) : (
                <>Claim All (${totalClaimable.toFixed(0)})</>
              )}
            </button>
          </div>
        )}

        <TabsContainer>
          {(['all', 'open', 'won', 'lost', 'listed'] as const).map((tab) => (
            <Tab
              key={tab}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <TabCount color={
                tab === 'won' ? '#05A584' :
                tab === 'lost' ? '#FF5858' :
                tab === 'listed' ? '#FFB800' :
                undefined
              }>
                {counts[tab]}
              </TabCount>
            </Tab>
          ))}
        </TabsContainer>

        {loading ? (
          <LoadingState>Loading positions...</LoadingState>
        ) : positions.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No {activeTab === 'all' ? '' : activeTab} positions yet</EmptyTitle>
            <EmptyText>Start placing bets on prediction markets to see them here</EmptyText>
            <StartButton onClick={() => router.push('/')}>
              Explore Markets
            </StartButton>
          </EmptyState>
        ) : (
          <PositionsGrid data-testid="positions-list">
            {positions.map((position) => (
              <PositionCard
                key={position._id}
                $status={position.status}
                data-testid={`position-${position._id}`}
              >
                <PositionInfo>
                  <MarketTitle onClick={() => router.push(`/arena/${position.marketId || position.predictionId}`)}>
                    {position.outcomeLabel}
                  </MarketTitle>
                  <PositionMeta>
                    <MetaTag $variant={position.side?.toLowerCase() || 'yes'}>
                      {position.side || 'Yes'}
                    </MetaTag>
                    <MetaTag $variant={position.status}>
                      {position.status?.toUpperCase()}
                    </MetaTag>
                    <span style={{ fontSize: 12, color: '#738094' }}>
                      <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {formatDate(position.createdAt)}
                    </span>
                  </PositionMeta>
                </PositionInfo>

                <PositionStats>
                  <Stat>
                    <StatSmallLabel>Stake</StatSmallLabel>
                    <StatSmallValue>${position.stake?.toFixed(2)}</StatSmallValue>
                  </Stat>
                  <Stat>
                    <StatSmallLabel>Odds</StatSmallLabel>
                    <StatSmallValue>{position.odds?.toFixed(2)}x</StatSmallValue>
                  </Stat>
                  <Stat>
                    <StatSmallLabel>{position.status === 'won' ? 'Payout' : 'Potential'}</StatSmallLabel>
                    <StatSmallValue $highlight>
                      ${(position.payout || position.potentialReturn)?.toFixed(2)}
                    </StatSmallValue>
                  </Stat>
                </PositionStats>

                {position.status === 'won' && (
                  <ActionBtn
                    $variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim(position);
                    }}
                    disabled={actionLoading === position._id || claimHook.isLoading}
                    data-testid={`claim-${position._id}`}
                  >
                    {(actionLoading === position._id || (claimHook.isLoading && actionLoading === position._id)) ? (
                      <>
                        <SpinIcon size={14} />
                        {claimHook.isLoading ? claimHook.statusMessage : 'Claiming...'}
                      </>
                    ) : (
                      'Claim Payout'
                    )}
                  </ActionBtn>
                )}

                {position.status === 'open' && (
                  <ActionBtn
                    $variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      const price = position.potentialReturn * 0.8;
                      handleList(position._id, price);
                    }}
                    disabled={actionLoading === position._id}
                    data-testid={`sell-${position._id}`}
                  >
                    <ShoppingBag size={14} />
                    {actionLoading === position._id ? 'Listing...' : 'Sell'}
                  </ActionBtn>
                )}

                {position.status === 'listed' && (
                  <ActionBtn
                    $variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelListing(position._id);
                    }}
                    disabled={actionLoading === position._id}
                    data-testid={`unlist-${position._id}`}
                  >
                    {actionLoading === position._id ? 'Canceling...' : 'Cancel Listing'}
                  </ActionBtn>
                )}

                <ArrowRight size={18} color="#738094" />
              </PositionCard>
            ))}
          </PositionsGrid>
        )}
      </Container>
    </PageWrapper>
  );
}
