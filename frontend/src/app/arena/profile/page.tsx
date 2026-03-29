'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { useWallet } from '@/lib/wagmi';
import { Flame, Trophy, TrendingUp, TrendingDown, Target, DollarSign, Activity, Award, Swords, BarChart3 } from 'lucide-react';
import { RivalsTab } from '@/components/arena/RivalsTab';
import { WeeklyPressure, RivalPressure } from '@/components/growth';
import { useRouter } from 'next/navigation';

// ==================== ANIMATIONS ====================

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.5); }
  50% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.8); }
`;

// ==================== STYLES ====================

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 48px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 32px;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  color: white;
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  flex-shrink: 0;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const WalletAddress = styled.div`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: monospace;
`;

const LevelBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #93c5fd;
`;

const StreakBadge = styled.div<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  
  ${({ $active }) => $active ? css`
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    animation: ${pulse} 2s ease-in-out infinite, ${glow} 2s ease-in-out infinite;
  ` : css`
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
  `}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div<{ $variant?: 'success' | 'danger' | 'neutral' }>`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 20px;
  
  ${({ $variant }) => $variant === 'success' && css`
    border-color: #10B981;
    background: linear-gradient(135deg, #ECFDF5 0%, #fff 100%);
  `}
  
  ${({ $variant }) => $variant === 'danger' && css`
    border-color: #EF4444;
    background: linear-gradient(135deg, #FEF2F2 0%, #fff 100%);
  `}
`;

const StatIcon = styled.div<{ $variant?: 'success' | 'danger' | 'neutral' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return css`background: #10B981; color: white;`;
      case 'danger':
        return css`background: #EF4444; color: white;`;
      default:
        return css`background: #3b82f6; color: white;`;
    }
  }}
`;

const StatValue = styled.div<{ $variant?: 'success' | 'danger' | 'neutral' }>`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return css`color: #10B981;`;
      case 'danger':
        return css`color: #EF4444;`;
      default:
        return css`color: #0f172a;`;
    }
  }}
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #738094;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PositionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const PositionCard = styled.div<{ $variant?: 'active' | 'won' | 'lost' | 'claimed' }>`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef1f5;
  padding: 16px;
  text-align: center;
  
  ${({ $variant }) => $variant === 'active' && css`
    border-color: #3b82f6;
    background: linear-gradient(135deg, #EFF6FF 0%, #fff 100%);
  `}
  ${({ $variant }) => $variant === 'won' && css`
    border-color: #10B981;
  `}
  ${({ $variant }) => $variant === 'lost' && css`
    border-color: #EF4444;
  `}
  ${({ $variant }) => $variant === 'claimed' && css`
    border-color: #8b5cf6;
  `}
`;

const PositionValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
`;

const PositionLabel = styled.div`
  font-size: 12px;
  color: #738094;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
`;

const EmptyTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: #738094;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #738094;
`;

// ==================== TYPES ====================

interface ProfileData {
  wallet: string;
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    winrate: number;
    totalStaked: number;
    totalClaimed: number;
    pnl: number;
    avgBet: number;
  };
  streak: {
    current: number;
    best: number;
  };
  positions: {
    active: number;
    won: number;
    lost: number;
    claimed: number;
  };
}

interface XpData {
  wallet: string;
  xp: number;
  level: number;
  xpProgress: {
    current: number;
    needed: number;
    percentage: number;
  };
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  totalPnl: number;
  badges: string[];
  badgeDetails: Array<{
    id: string;
    name: string;
    emoji: string;
    description: string;
  }>;
}

// XP Progress Bar
const XpProgressSection = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 24px;
  margin-bottom: 24px;
`;

const XpHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const LevelDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LevelCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: white;
`;

const LevelInfo = styled.div`
  .level-text {
    font-size: 14px;
    color: #738094;
  }
  .xp-text {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }
`;

const ProgressBarContainer = styled.div`
  height: 12px;
  background: #eef1f5;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressBarFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #738094;
`;

// Badges Section
const BadgesSection = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 24px;
  margin-bottom: 24px;
`;

const BadgesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const BadgeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  border: 1px solid #fbbf24;
  
  .emoji {
    font-size: 20px;
  }
  
  .name {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
  }
`;

const NoBadges = styled.div`
  color: #94a3b8;
  font-size: 14px;
  padding: 20px;
  text-align: center;
`;

// Tab Navigation
const TabNav = styled.div`
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $active }) => $active ? css`
    background: white;
    color: #0f172a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  ` : css`
    background: transparent;
    color: #64748b;
    
    &:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.5);
    }
  `}
`;

// ==================== COMPONENT ====================

export default function ProfilePage() {
  const router = useRouter();
  const { isConnected, walletAddress } = useWallet();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [xpData, setXpData] = useState<XpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'rivals'>('stats');

  useEffect(() => {
    async function fetchProfile() {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        
        // Fetch both profile and XP data
        const [profileRes, xpRes] = await Promise.all([
          fetch(`${API_URL}/api/onchain/profile/${walletAddress}`),
          fetch(`${API_URL}/api/xp/stats/${walletAddress}`),
        ]);
        
        const profileData = await profileRes.json();
        const xpDataRes = await xpRes.json();
        
        if (profileData.success) {
          setProfile(profileData.data);
        }
        
        if (xpDataRes.success) {
          setXpData(xpDataRes.data);
        }
        
        if (!profileData.success && !xpDataRes.success) {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [walletAddress]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getPnlVariant = (pnl: number): 'success' | 'danger' | 'neutral' => {
    if (pnl > 0) return 'success';
    if (pnl < 0) return 'danger';
    return 'neutral';
  };

  const getWinrateVariant = (winrate: number): 'success' | 'danger' | 'neutral' => {
    if (winrate >= 50) return 'success';
    if (winrate < 50 && winrate > 0) return 'danger';
    return 'neutral';
  };

  if (!isConnected || !walletAddress) {
    return (
      <PageWrapper>
        <Container>
          <BreadCrumbs items={[
            { title: 'Arena', link: '/arena' },
            { title: 'Profile', link: '' }
          ]} />
          <PageTitle>Your Profile</PageTitle>
          <EmptyState>
            <EmptyTitle>Connect Wallet</EmptyTitle>
            <EmptyText>Connect your wallet to view your profile stats</EmptyText>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <BreadCrumbs items={[
            { title: 'Arena', link: '/arena' },
            { title: 'Profile', link: '' }
          ]} />
          <PageTitle>Your Profile</PageTitle>
          <LoadingState>Loading profile...</LoadingState>
        </Container>
      </PageWrapper>
    );
  }

  if (error || (!profile && !xpData)) {
    return (
      <PageWrapper>
        <Container>
          <BreadCrumbs items={[
            { title: 'Arena', link: '/arena' },
            { title: 'Profile', link: '' }
          ]} />
          <PageTitle>Your Profile</PageTitle>
          <EmptyState>
            <EmptyTitle>Error</EmptyTitle>
            <EmptyText>{error || 'Failed to load profile'}</EmptyText>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  const hasActivity = (profile?.stats?.totalBets || 0) > 0 || (xpData?.totalBets || 0) > 0;

  return (
    <PageWrapper>
      <Container>
        <BreadCrumbs items={[
          { title: 'Arena', link: '/arena' },
          { title: 'Profile', link: '' }
        ]} />
        
        {/* Header */}
        <ProfileHeader>
          <Avatar>
            {walletAddress.slice(2, 4).toUpperCase()}
          </Avatar>
          
          <ProfileInfo>
            <WalletAddress>{formatAddress(walletAddress)}</WalletAddress>
            <LevelBadge>
              <Award size={14} />
              Level {xpData?.level || 1}
            </LevelBadge>
          </ProfileInfo>
          
          <StreakBadge $active={(xpData?.currentStreak || profile?.streak?.current || 0) >= 3}>
            <Flame size={20} />
            {(xpData?.currentStreak || profile?.streak?.current || 0) > 0 
              ? `${xpData?.currentStreak || profile?.streak?.current} Win Streak`
              : 'No Streak'
            }
          </StreakBadge>
        </ProfileHeader>
        
        {/* Weekly Competition Pressure */}
        {walletAddress && (
          <WeeklyPressure wallet={walletAddress} />
        )}
        
        {/* XP Progress */}
        {xpData && (
          <XpProgressSection>
            <XpHeader>
              <LevelDisplay>
                <LevelCircle>{xpData.level}</LevelCircle>
                <LevelInfo>
                  <div className="level-text">Level {xpData.level}</div>
                  <div className="xp-text">{xpData.xp} XP</div>
                </LevelInfo>
              </LevelDisplay>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#738094' }}>Next Level</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                  {xpData.xpProgress.current} / {xpData.xpProgress.needed} XP
                </div>
              </div>
            </XpHeader>
            <ProgressBarContainer>
              <ProgressBarFill $percentage={xpData.xpProgress.percentage} />
            </ProgressBarContainer>
            <ProgressText>
              <span>{xpData.xpProgress.percentage.toFixed(0)}% to Level {xpData.level + 1}</span>
              <span>{xpData.xpProgress.needed - xpData.xpProgress.current} XP needed</span>
            </ProgressText>
          </XpProgressSection>
        )}
        
        {/* Badges */}
        {xpData && xpData.badges.length > 0 && (
          <BadgesSection>
            <SectionTitle>
              <Award size={20} />
              Badges Earned
            </SectionTitle>
            <BadgesGrid>
              {xpData.badgeDetails.map((badge) => (
                <BadgeItem key={badge.id} title={badge.description}>
                  <span className="emoji">{badge.emoji}</span>
                  <span className="name">{badge.name}</span>
                </BadgeItem>
              ))}
            </BadgesGrid>
          </BadgesSection>
        )}

        {/* Tab Navigation */}
        <TabNav>
          <Tab 
            $active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')}
            data-testid="stats-tab"
          >
            <BarChart3 size={18} />
            Stats
          </Tab>
          <Tab 
            $active={activeTab === 'rivals'} 
            onClick={() => setActiveTab('rivals')}
            data-testid="rivals-tab-btn"
          >
            <Swords size={18} />
            Rivals
          </Tab>
        </TabNav>

        {/* Rivals Tab Content */}
        {activeTab === 'rivals' && (
          <RivalsTab 
            wallet={walletAddress}
            onRematch={(opponent, lastStake) => {
              // Navigate to duels page or open modal with prefilled data
              router.push(`/arena?tab=duels&rematch=${opponent}&stake=${lastStake}`);
            }}
          />
        )}

        {/* Stats Tab Content */}
        {activeTab === 'stats' && (
          <>
            {!hasActivity ? (
              <EmptyState>
                <EmptyTitle>No bets yet</EmptyTitle>
                <EmptyText>Place your first bet to start building your profile</EmptyText>
              </EmptyState>
            ) : (
              <>
                {/* Main Stats */}
                <SectionTitle>
                  <Activity size={20} />
                  Performance Stats
                </SectionTitle>
            
            <StatsGrid>
              <StatCard $variant={getWinrateVariant(profile.stats.winrate)}>
                <StatIcon $variant={getWinrateVariant(profile.stats.winrate)}>
                  <Target size={20} />
                </StatIcon>
                <StatValue $variant={getWinrateVariant(profile.stats.winrate)}>
                  {profile.stats.winrate}%
                </StatValue>
                <StatLabel>Winrate</StatLabel>
              </StatCard>
              
              <StatCard $variant={getPnlVariant(profile.stats.pnl)}>
                <StatIcon $variant={getPnlVariant(profile.stats.pnl)}>
                  {profile.stats.pnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </StatIcon>
                <StatValue $variant={getPnlVariant(profile.stats.pnl)}>
                  {profile.stats.pnl >= 0 ? '+' : ''}{profile.stats.pnl} USDT
                </StatValue>
                <StatLabel>Total PnL</StatLabel>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <Trophy size={20} />
                </StatIcon>
                <StatValue>{profile.stats.totalBets}</StatValue>
                <StatLabel>Total Bets</StatLabel>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <DollarSign size={20} />
                </StatIcon>
                <StatValue>${profile.stats.avgBet}</StatValue>
                <StatLabel>Avg Bet</StatLabel>
              </StatCard>
            </StatsGrid>

            {/* Positions Breakdown */}
            <SectionTitle>
              <Trophy size={20} />
              Positions Breakdown
            </SectionTitle>
            
            <PositionsGrid>
              <PositionCard $variant="active">
                <PositionValue>{profile.positions.active}</PositionValue>
                <PositionLabel>Active</PositionLabel>
              </PositionCard>
              
              <PositionCard $variant="won">
                <PositionValue>{profile.positions.won}</PositionValue>
                <PositionLabel>Won</PositionLabel>
              </PositionCard>
              
              <PositionCard $variant="lost">
                <PositionValue>{profile.positions.lost}</PositionValue>
                <PositionLabel>Lost</PositionLabel>
              </PositionCard>
              
              <PositionCard $variant="claimed">
                <PositionValue>{profile.positions.claimed}</PositionValue>
                <PositionLabel>Claimed</PositionLabel>
              </PositionCard>
            </PositionsGrid>

            {/* Streak Info */}
            {profile.streak.best > 0 && (
              <>
                <SectionTitle>
                  <Flame size={20} />
                  Streak History
                </SectionTitle>
                
                <StatsGrid style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <StatCard>
                    <StatIcon $variant={profile.streak.current >= 3 ? 'success' : 'neutral'}>
                      <Flame size={20} />
                    </StatIcon>
                    <StatValue>{profile.streak.current}</StatValue>
                    <StatLabel>Current Streak</StatLabel>
                  </StatCard>
                  
                  <StatCard>
                    <StatIcon>
                      <Award size={20} />
                    </StatIcon>
                    <StatValue>{profile.streak.best}</StatValue>
                    <StatLabel>Best Streak</StatLabel>
                  </StatCard>
                </StatsGrid>
              </>
            )}
          </>
            )}
          </>
        )}
      </Container>
    </PageWrapper>
  );
}
