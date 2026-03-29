'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Play,
  Shield,
  Trophy,
  Clock,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { ShareAPI, saveReferralToStorage } from '@/lib/api/shareApi';

// ==================== Styled Components ====================

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0f1c 0%, #111827 50%, #0a0f1c 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Container = styled.div`
  max-width: 480px;
  width: 100%;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 32px;
    font-weight: 800;
    background: linear-gradient(135deg, #05A584, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
  }
  
  p {
    color: #64748b;
    font-size: 14px;
  }
`;

const ShareCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #05A584, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 18px;
`;

const CreatorInfo = styled.div`
  flex: 1;
  
  .name {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 4px;
  }
  
  .label {
    font-size: 12px;
    color: #64748b;
  }
`;

const VerifiedBadge = styled.div<{ $verified: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  ${({ $verified }) => $verified ? `
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  ` : `
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  `}
`;

const MarketTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
  line-height: 1.4;
`;

const OutcomeBadge = styled.div<{ $side: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 20px;
  
  ${({ $side }) => $side === 'yes' || $side === 'won' ? `
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  ` : `
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  `}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  
  .label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
  }
  
  &.highlight {
    background: linear-gradient(135deg, rgba(5, 165, 132, 0.2), rgba(16, 185, 129, 0.1));
    border: 1px solid rgba(5, 165, 132, 0.3);
    
    .value {
      color: #10b981;
    }
  }
  
  &.loss {
    background: rgba(239, 68, 68, 0.1);
    
    .value {
      color: #ef4444;
    }
  }
`;

const ResultBanner = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 16px;
  
  ${({ $status }) => {
    switch ($status) {
      case 'won':
        return `background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 165, 132, 0.1));
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.3);`;
      case 'lost':
        return `background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);`;
      default:
        return `background: rgba(59, 130, 246, 0.15);
                color: #3b82f6;
                border: 1px solid rgba(59, 130, 246, 0.3);`;
    }
  }}
`;

const CTASection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const CTAButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $primary }) => $primary ? `
    background: linear-gradient(135deg, #05A584, #10b981);
    color: white;
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(5, 165, 132, 0.4);
    }
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `}
`;

const ClickCount = styled.div`
  text-align: center;
  font-size: 12px;
  color: #64748b;
  margin-top: 16px;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 32px;
  color: #64748b;
  font-size: 12px;
  
  a {
    color: #05A584;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(5, 165, 132, 0.2);
    border-top-color: #05A584;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  p {
    color: #64748b;
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    width: 64px;
    height: 64px;
    background: rgba(239, 68, 68, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }
  
  h3 {
    color: #ffffff;
    margin-bottom: 8px;
  }
  
  p {
    color: #64748b;
    margin-bottom: 24px;
  }
`;

// ==================== Component ====================

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params?.shareId as string;
  
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShareData() {
      if (!shareId) return;
      
      setLoading(true);
      try {
        const data = await ShareAPI.getShareData(shareId);
        setShareData(data);
        
        // Save referral to localStorage
        if (data.ref) {
          saveReferralToStorage(shareId, data.ref);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load share data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchShareData();
  }, [shareId]);

  const handleTryDemo = () => {
    router.push('/?demo=true');
  };

  const handleConnectWallet = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <Logo>
            <h1>FOMO Arena</h1>
            <p>Prediction Market Platform</p>
          </Logo>
          <ShareCard>
            <LoadingState>
              <div className="spinner" />
              <p>Loading prediction...</p>
            </LoadingState>
          </ShareCard>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !shareData) {
    return (
      <PageWrapper>
        <Container>
          <Logo>
            <h1>FOMO Arena</h1>
            <p>Prediction Market Platform</p>
          </Logo>
          <ShareCard>
            <ErrorState>
              <div className="icon">
                <X size={32} color="#ef4444" />
              </div>
              <h3>Share Link Not Found</h3>
              <p>{error || 'This share link may have expired or been removed.'}</p>
              <CTAButton $primary onClick={handleConnectWallet}>
                <ExternalLink size={18} />
                Go to Arena
              </CTAButton>
            </ErrorState>
          </ShareCard>
        </Container>
      </PageWrapper>
    );
  }

  const isWin = shareData.status === 'won';
  const isLoss = shareData.status === 'lost';
  const isOpen = shareData.status === 'open';

  return (
    <PageWrapper>
      <Container>
        <Logo>
          <h1>FOMO Arena</h1>
          <p>Prediction Market Platform</p>
        </Logo>

        <ShareCard data-testid="share-card">
          <CardHeader>
            <Avatar>
              {shareData.creatorName?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
            <CreatorInfo>
              <div className="name">{shareData.creatorName}</div>
              <div className="label">Prediction Bet Slip</div>
            </CreatorInfo>
            <VerifiedBadge $verified={shareData.verified} data-testid="verified-badge">
              {shareData.verified ? (
                <>
                  <Shield size={14} />
                  Verified
                </>
              ) : (
                <>
                  <X size={14} />
                  Unverified
                </>
              )}
            </VerifiedBadge>
          </CardHeader>

          <MarketTitle data-testid="market-title">{shareData.marketTitle}</MarketTitle>

          <OutcomeBadge $side={shareData.status !== 'open' ? shareData.status : shareData.outcomeLabel?.toLowerCase()}>
            {isWin ? <Trophy size={18} /> : isLoss ? <X size={18} /> : <TrendingUp size={18} />}
            Prediction: {shareData.outcomeLabel}
          </OutcomeBadge>

          {!isOpen && (
            <ResultBanner $status={shareData.status} data-testid="result-banner">
              {isWin ? (
                <>
                  <Trophy size={20} />
                  Winner! +{shareData.roi}% ROI
                </>
              ) : (
                <>
                  <TrendingDown size={20} />
                  Prediction Lost
                </>
              )}
            </ResultBanner>
          )}

          <StatsGrid>
            <StatCard>
              <div className="label">Stake</div>
              <div className="value" data-testid="stake-value">${shareData.stake}</div>
            </StatCard>
            <StatCard>
              <div className="label">Odds</div>
              <div className="value" data-testid="odds-value">{shareData.odds.toFixed(2)}x</div>
            </StatCard>
            {isWin && (
              <StatCard className="highlight">
                <div className="label">Payout</div>
                <div className="value" data-testid="payout-value">${shareData.payout.toFixed(0)}</div>
              </StatCard>
            )}
            {isWin && (
              <StatCard className="highlight">
                <div className="label">Profit</div>
                <div className="value">+${(shareData.payout - shareData.stake).toFixed(0)}</div>
              </StatCard>
            )}
            {isLoss && (
              <StatCard className="loss">
                <div className="label">Loss</div>
                <div className="value">-${shareData.stake}</div>
              </StatCard>
            )}
            {isOpen && (
              <StatCard>
                <div className="label">Potential</div>
                <div className="value">${(shareData.stake * shareData.odds).toFixed(0)}</div>
              </StatCard>
            )}
          </StatsGrid>

          <CTASection>
            <CTAButton $primary onClick={handleTryDemo} data-testid="try-demo-btn">
              <Play size={18} />
              Try Demo Mode
            </CTAButton>
            <CTAButton onClick={handleConnectWallet} data-testid="connect-wallet-btn">
              <Wallet size={18} />
              Connect Wallet & Trade
            </CTAButton>
          </CTASection>

          <ClickCount>
            <Share2 size={12} style={{ marginRight: 4 }} />
            {shareData.clickCount} people viewed this prediction
          </ClickCount>
        </ShareCard>

        <Footer>
          <p>
            Trade predictions on crypto, politics, sports & more.
            <br />
            <a href="/">Learn more about FOMO Arena</a>
          </p>
        </Footer>
      </Container>
    </PageWrapper>
  );
}
