'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Trophy, Target, TrendingUp, Award, 
  Clock, Swords, ChevronLeft, Share2,
  CheckCircle, XCircle, Circle
} from 'lucide-react';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
  color: #fff;
  padding: 24px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #a5b4fc;
  text-decoration: none;
  margin-bottom: 24px;
  font-size: 14px;
  
  &:hover {
    color: #c7d2fe;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Avatar = styled.div<{ $tier: string }>`
  width: 140px;
  height: 140px;
  border-radius: 20px;
  background: ${props => 
    props.$tier === 'LEGENDARY' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
    props.$tier === 'DIAMOND' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' :
    props.$tier === 'GOLD' ? 'linear-gradient(135deg, #eab308, #ca8a04)' :
    'linear-gradient(135deg, #6366f1, #4f46e5)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  box-shadow: 0 0 30px ${props => 
    props.$tier === 'LEGENDARY' ? 'rgba(245, 158, 11, 0.4)' :
    props.$tier === 'DIAMOND' ? 'rgba(6, 182, 212, 0.4)' :
    props.$tier === 'GOLD' ? 'rgba(234, 179, 8, 0.4)' :
    'rgba(99, 102, 241, 0.4)'
  };
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Username = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TierBadge = styled.span<{ $tier: string }>`
  background: ${props => 
    props.$tier === 'LEGENDARY' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
    props.$tier === 'DIAMOND' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' :
    props.$tier === 'GOLD' ? 'linear-gradient(135deg, #eab308, #ca8a04)' :
    'linear-gradient(135deg, #6366f1, #4f46e5)'
  };
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const WalletAddress = styled.div`
  color: #94a3b8;
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 16px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-top: 20px;
`;

const StatItem = styled.div`
  text-align: center;
  
  .value {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
  }
  
  .label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
  }
`;

const ShareButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  background: ${props => props.$active ? 'rgba(99, 102, 241, 0.3)' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#94a3b8'};
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    color: #fff;
  }
`;

const SectionCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: #6366f1;
  }
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const PerfCard = styled.div<{ $positive?: boolean }>`
  background: rgba(255, 255, 255, 0.02);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  
  .value {
    font-size: 32px;
    font-weight: 700;
    color: ${props => props.$positive ? '#10b981' : '#f59e0b'};
  }
  
  .label {
    font-size: 13px;
    color: #94a3b8;
    margin-top: 4px;
  }
`;

const PositionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PositionItem = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  
  .market {
    font-weight: 500;
    
    .outcome {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
  }
  
  .stake {
    font-weight: 600;
    color: #a5b4fc;
  }
  
  .profit {
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const StatusIcon = styled.span<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${props => 
    props.$status === 'won' ? '#10b981' :
    props.$status === 'lost' ? '#ef4444' :
    props.$status === 'open' ? '#f59e0b' :
    '#94a3b8'
  };
`;

const BadgeGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Badge = styled.div<{ $unlocked: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: ${props => props.$unlocked 
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: ${props => props.$unlocked ? 1 : 0.4};
  
  svg {
    width: 28px;
    height: 28px;
  }
  
  span {
    font-size: 10px;
    font-weight: 600;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #64748b;
`;

const StreakDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f59e0b20, #d9770620);
  border: 1px solid #f59e0b40;
  border-radius: 12px;
  
  .icon {
    font-size: 24px;
  }
  
  .info {
    .current {
      font-size: 20px;
      font-weight: 700;
      color: #f59e0b;
    }
    .best {
      font-size: 12px;
      color: #94a3b8;
    }
  }
`;

export default function AnalystProfilePage() {
  const params = useParams();
  const walletParam = params?.wallet as string;
  const [analyst, setAnalyst] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [duels, setDuels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletParam) {
      fetchAnalystData();
    }
  }, [walletParam]);

  const fetchAnalystData = async () => {
    setLoading(true);
    try {
      const [analystRes, positionsRes, duelsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analysts/${walletParam}`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/positions/by-wallet/${walletParam}`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/duels/by-wallet/${walletParam}`),
      ]);

      if (analystRes.ok) {
        const data = await analystRes.json();
        setAnalyst(data.data || data);
      }

      if (positionsRes.ok) {
        const data = await positionsRes.json();
        setPositions(data.data || []);
      }

      if (duelsRes.ok) {
        const data = await duelsRes.json();
        setDuels(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch analyst data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWallet = (wallet: string) => {
    if (!wallet) return '';
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getTier = (xp: number) => {
    if (xp >= 10000) return 'LEGENDARY';
    if (xp >= 5000) return 'DIAMOND';
    if (xp >= 1000) return 'GOLD';
    return 'SILVER';
  };

  const getWinRate = () => {
    if (!analyst) return 0;
    const total = (analyst.wins || 0) + (analyst.losses || 0);
    if (total === 0) return 0;
    return ((analyst.wins || 0) / total * 100).toFixed(1);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Profile URL copied to clipboard!');
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>Loading...</div>
      </PageWrapper>
    );
  }

  if (!analyst) {
    return (
      <PageWrapper>
        <BackLink href="/"><ChevronLeft size={16} /> Back to Arena</BackLink>
        <EmptyState>
          <h2>Analyst Not Found</h2>
          <p>No analyst profile found for this wallet address.</p>
        </EmptyState>
      </PageWrapper>
    );
  }

  const tier = getTier(analyst.xp || 0);

  return (
    <PageWrapper>
      <BackLink href="/"><ChevronLeft size={16} /> Back to Arena</BackLink>

      <ProfileHeader>
        <Avatar $tier={tier} data-testid="analyst-avatar">
          {(analyst.username || 'A').charAt(0).toUpperCase()}
        </Avatar>
        
        <ProfileInfo>
          <Username>
            {analyst.username || formatWallet(analyst.wallet)}
            <TierBadge $tier={tier}>{tier}</TierBadge>
          </Username>
          <WalletAddress>{analyst.wallet}</WalletAddress>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <StreakDisplay>
              <span className="icon">🔥</span>
              <div className="info">
                <div className="current">{analyst.streakCurrent || 0} streak</div>
                <div className="best">Best: {analyst.streakBest || 0}</div>
              </div>
            </StreakDisplay>
            <ShareButton onClick={handleShare}>
              <Share2 size={16} /> Share Profile
            </ShareButton>
          </div>
          
          <StatsRow>
            <StatItem>
              <div className="value">{analyst.xp || 0}</div>
              <div className="label">XP</div>
            </StatItem>
            <StatItem>
              <div className="value">{getWinRate()}%</div>
              <div className="label">Win Rate</div>
            </StatItem>
            <StatItem>
              <div className="value">{(analyst.totalBets || 0)}</div>
              <div className="label">Total Bets</div>
            </StatItem>
            <StatItem>
              <div className="value">{analyst.duelsWon || 0}/{analyst.duelsPlayed || 0}</div>
              <div className="label">Duels Won</div>
            </StatItem>
          </StatsRow>
        </ProfileInfo>
      </ProfileHeader>

      <TabsContainer>
        <Tab $active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>
          Performance
        </Tab>
        <Tab $active={activeTab === 'positions'} onClick={() => setActiveTab('positions')}>
          Positions ({positions.length})
        </Tab>
        <Tab $active={activeTab === 'duels'} onClick={() => setActiveTab('duels')}>
          Duels ({duels.length})
        </Tab>
        <Tab $active={activeTab === 'badges'} onClick={() => setActiveTab('badges')}>
          Badges
        </Tab>
      </TabsContainer>

      {activeTab === 'performance' && (
        <>
          <SectionCard>
            <SectionTitle><TrendingUp /> Overall Performance</SectionTitle>
            <PerformanceGrid>
              <PerfCard $positive>
                <div className="value">{getWinRate()}%</div>
                <div className="label">Win Rate</div>
              </PerfCard>
              <PerfCard $positive={(analyst.roiPercent || 0) > 0}>
                <div className="value" style={{ color: (analyst.roiPercent || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                  {(analyst.roiPercent || 0) > 0 ? '+' : ''}{(analyst.roiPercent || 0).toFixed(1)}%
                </div>
                <div className="label">ROI</div>
              </PerfCard>
              <PerfCard>
                <div className="value">${(analyst.totalVolume || 0).toFixed(0)}</div>
                <div className="label">Total Volume</div>
              </PerfCard>
              <PerfCard>
                <div className="value">${(analyst.totalProfit || 0).toFixed(2)}</div>
                <div className="label">Total Profit</div>
              </PerfCard>
            </PerformanceGrid>
          </SectionCard>

          <SectionCard>
            <SectionTitle><Target /> Betting Stats</SectionTitle>
            <PerformanceGrid>
              <PerfCard>
                <div className="value">{analyst.wins || 0}</div>
                <div className="label">Wins</div>
              </PerfCard>
              <PerfCard>
                <div className="value">{analyst.losses || 0}</div>
                <div className="label">Losses</div>
              </PerfCard>
              <PerfCard>
                <div className="value">{positions.filter(p => p.status === 'open').length}</div>
                <div className="label">Open Positions</div>
              </PerfCard>
              <PerfCard>
                <div className="value">${(analyst.avgBetSize || 0).toFixed(0)}</div>
                <div className="label">Avg Bet Size</div>
              </PerfCard>
            </PerformanceGrid>
          </SectionCard>
        </>
      )}

      {activeTab === 'positions' && (
        <SectionCard>
          <SectionTitle><Target /> Position History</SectionTitle>
          {positions.length === 0 ? (
            <EmptyState>No positions yet</EmptyState>
          ) : (
            <PositionsList>
              {positions.slice(0, 20).map((pos, i) => (
                <PositionItem key={pos._id || i}>
                  <div className="market">
                    <div>{pos.marketTitle || pos.marketId}</div>
                    <div className="outcome">Picked: {pos.outcomeLabel || pos.outcomeId}</div>
                  </div>
                  <div className="stake">${pos.stake}</div>
                  <div className="profit" style={{ color: (pos.profit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    {pos.profit >= 0 ? '+' : ''}${(pos.profit || 0).toFixed(2)}
                  </div>
                  <div className="odds">{pos.odds?.toFixed(2)}x</div>
                  <StatusIcon $status={pos.status}>
                    {pos.status === 'won' && <CheckCircle size={16} />}
                    {pos.status === 'lost' && <XCircle size={16} />}
                    {pos.status === 'open' && <Circle size={16} />}
                    {pos.status}
                  </StatusIcon>
                </PositionItem>
              ))}
            </PositionsList>
          )}
        </SectionCard>
      )}

      {activeTab === 'duels' && (
        <SectionCard>
          <SectionTitle><Swords /> Duel History</SectionTitle>
          {duels.length === 0 ? (
            <EmptyState>No duels yet</EmptyState>
          ) : (
            <PositionsList>
              {duels.slice(0, 20).map((duel, i) => (
                <PositionItem key={duel._id || i}>
                  <div className="market">
                    <div>vs {formatWallet(duel.opponentWallet || duel.creatorWallet)}</div>
                    <div className="outcome">{duel.marketTitle || duel.marketId}</div>
                  </div>
                  <div className="stake">${duel.stake}</div>
                  <div className="profit" style={{ color: duel.winnerWallet === analyst.wallet ? '#10b981' : '#ef4444' }}>
                    {duel.winnerWallet === analyst.wallet ? `+$${duel.totalPot}` : `-$${duel.stake}`}
                  </div>
                  <div className="odds">Pot: ${duel.totalPot}</div>
                  <StatusIcon $status={duel.winnerWallet === analyst.wallet ? 'won' : duel.status === 'finished' ? 'lost' : 'open'}>
                    {duel.status === 'finished' && duel.winnerWallet === analyst.wallet && <CheckCircle size={16} />}
                    {duel.status === 'finished' && duel.winnerWallet !== analyst.wallet && <XCircle size={16} />}
                    {duel.status !== 'finished' && <Clock size={16} />}
                    {duel.status}
                  </StatusIcon>
                </PositionItem>
              ))}
            </PositionsList>
          )}
        </SectionCard>
      )}

      {activeTab === 'badges' && (
        <SectionCard>
          <SectionTitle><Award /> Achievements</SectionTitle>
          <BadgeGrid>
            <Badge $unlocked={(analyst.totalBets || 0) >= 1}>
              <Target />
              <span>First Bet</span>
            </Badge>
            <Badge $unlocked={(analyst.wins || 0) >= 10}>
              <Trophy />
              <span>10 Wins</span>
            </Badge>
            <Badge $unlocked={(analyst.streakBest || 0) >= 5}>
              <TrendingUp />
              <span>5 Streak</span>
            </Badge>
            <Badge $unlocked={(analyst.duelsWon || 0) >= 1}>
              <Swords />
              <span>Duelist</span>
            </Badge>
            <Badge $unlocked={(analyst.xp || 0) >= 1000}>
              <Award />
              <span>Gold Tier</span>
            </Badge>
            <Badge $unlocked={(analyst.totalVolume || 0) >= 1000}>
              <Circle />
              <span>$1K Volume</span>
            </Badge>
          </BadgeGrid>
        </SectionCard>
      )}
    </PageWrapper>
  );
}
