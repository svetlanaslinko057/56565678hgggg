'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  Wallet, Trophy, RefreshCw, ExternalLink, 
  Check, X, Loader2, AlertCircle, DollarSign,
  TrendingUp, Clock, Hash, Share2, Swords
} from 'lucide-react';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket, MarketStatus } from '@/lib/contracts';
import * as PredictionMarket from '@/lib/contracts/predictionMarket';
import { CHAIN_CONFIG, MARKET_STATUS_LABELS, MARKET_STATUS_COLORS } from '@/lib/contracts/config';
import { ShareWinModal } from '@/components/share';
import { WinCardAPI, WinCardData } from '@/lib/api/winCardApi';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  background: #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SpinIcon = styled(RefreshCw)<{ $loading?: boolean }>`
  ${({ $loading }) => $loading && `animation: ${spin} 1s linear infinite;`}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: rgba(255, 255, 255, 0.5);
  
  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
  }
`;

const PositionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PositionCard = styled.div<{ $status?: number }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const PositionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const PositionInfo = styled.div`
  flex: 1;
`;

const PositionTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TokenBadge = styled.span`
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
`;

const PositionMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const OutcomeBadge = styled.span<{ $outcome: number }>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  
  ${({ $outcome }) => $outcome === 0 ? `
    background: rgba(0, 255, 136, 0.15);
    color: #00ff88;
  ` : `
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  `}
`;

const StatusBadge = styled.span<{ $color: string }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
`;

const PositionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const StatBox = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
  text-transform: uppercase;
`;

const StatValue = styled.div<{ $highlight?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $highlight }) => $highlight ? '#00ff88' : '#fff'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button<{ $variant?: 'claim' | 'refund' | 'secondary' | 'share' | 'rematch' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'claim':
        return `
          background: linear-gradient(135deg, #00ff88, #00cc66);
          color: #000;
          &:hover:not(:disabled) {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
          }
        `;
      case 'refund':
        return `
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          &:hover:not(:disabled) {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
          }
        `;
      case 'share':
        return `
          background: linear-gradient(135deg, #52c41a, #389e0d);
          color: #fff;
          font-size: 16px;
          padding: 16px 24px;
          &:hover:not(:disabled) {
            transform: scale(1.03);
            box-shadow: 0 6px 25px rgba(82, 196, 26, 0.4);
          }
        `;
      case 'rematch':
        return `
          background: linear-gradient(135deg, #ff4d4f, #cf1322);
          color: #fff;
          &:hover:not(:disabled) {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(255, 77, 79, 0.3);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const LoadingSpinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const ExplorerLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #00ff88;
  font-size: 12px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TxStatus = styled.div<{ $success?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
  
  ${({ $success }) => $success ? `
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88;
  ` : `
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
  `}
`;

// Win Celebration UI
const WinCelebration = styled.div`
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.15) 0%, rgba(0, 255, 136, 0.1) 100%);
  border: 2px solid rgba(82, 196, 26, 0.4);
  border-radius: 16px;
  padding: 24px;
  margin-top: 16px;
  text-align: center;
  animation: celebrationPulse 2s ease-in-out infinite;
  
  @keyframes celebrationPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(82, 196, 26, 0.2); }
    50% { box-shadow: 0 0 40px rgba(82, 196, 26, 0.4); }
  }
`;

const WinTitle = styled.h3`
  color: #52c41a;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const WinAmount = styled.div`
  font-size: 36px;
  font-weight: 900;
  color: #fff;
  margin-bottom: 20px;
`;

const WinActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

// Types
interface Position {
  tokenId: number;
  marketId: number;
  outcome: number;
  amount: string;
  amountFormatted: string;
  claimed: boolean;
  marketStatus?: number;
  marketQuestion?: string;
  outcomeLabel?: string;
  claimPreview?: {
    claimable: boolean;
    netAmountFormatted: string;
    feeAmountFormatted: string;
  };
  refundPreview?: {
    refundable: boolean;
    amountFormatted: string;
  };
}

interface OnchainPositionsPanelProps {
  tokenIds?: number[];
  onPositionClaimed?: (tokenId: number) => void;
  onPositionRefunded?: (tokenId: number) => void;
}

export const OnchainPositionsPanel: React.FC<OnchainPositionsPanelProps> = ({
  tokenIds = [],
  onPositionClaimed,
  onPositionRefunded,
}) => {
  const { isAuthenticated, walletAddress } = useWallet();
  const { marketAddress, claim, refund } = usePredictionMarket();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [txResult, setTxResult] = useState<{ tokenId: number; success: boolean; hash?: string; error?: string } | null>(null);
  
  // Win Share Modal state
  const [showWinModal, setShowWinModal] = useState(false);
  const [winCardData, setWinCardData] = useState<WinCardData | null>(null);
  const [claimedPosition, setClaimedPosition] = useState<Position | null>(null);

  const loadPositions = useCallback(async () => {
    if (!tokenIds.length || !marketAddress) return;
    
    setLoading(true);
    
    try {
      const positionsData: Position[] = [];
      
      for (const tokenId of tokenIds) {
        const posResult = await PredictionMarket.getPosition(marketAddress, tokenId);
        if (!posResult.ok) continue;
        
        const pos = posResult.data;
        
        // Get market info
        const marketResult = await PredictionMarket.getMarketWithLabels(marketAddress, pos.marketId);
        
        // Get claim/refund previews
        const [claimPreview, refundPreview] = await Promise.all([
          PredictionMarket.previewClaim(marketAddress, tokenId),
          PredictionMarket.previewRefund(marketAddress, tokenId),
        ]);
        
        positionsData.push({
          tokenId,
          marketId: Number(pos.marketId),
          outcome: pos.outcome,
          amount: String(pos.amount),
          amountFormatted: pos.amountFormatted,
          claimed: pos.claimed,
          marketStatus: marketResult.ok ? marketResult.data.status : undefined,
          marketQuestion: marketResult.ok ? marketResult.data.question : undefined,
          outcomeLabel: marketResult.ok && 'labels' in marketResult.data ? marketResult.data.labels?.[pos.outcome] : undefined,
          claimPreview: claimPreview.ok ? {
            claimable: claimPreview.data.claimable,
            netAmountFormatted: claimPreview.data.netAmountFormatted,
            feeAmountFormatted: claimPreview.data.feeAmountFormatted,
          } : undefined,
          refundPreview: refundPreview.ok ? {
            refundable: refundPreview.data.refundable,
            amountFormatted: refundPreview.data.amountFormatted,
          } : undefined,
        });
      }
      
      setPositions(positionsData);
    } catch (err) {
      console.error('Failed to load positions:', err);
    }
    
    setLoading(false);
  }, [tokenIds, marketAddress]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPositions();
    }
  }, [isAuthenticated, loadPositions]);

  const handleClaim = async (tokenId: number) => {
    setActionLoading(tokenId);
    setTxResult(null);
    
    const result = await claim(tokenId);
    
    if (result.ok) {
      setTxResult({ tokenId, success: true, hash: result.txHash });
      onPositionClaimed?.(tokenId);
      
      // Find claimed position for win card
      const pos = positions.find(p => p.tokenId === tokenId);
      if (pos) {
        setClaimedPosition(pos);
        
        // Generate win card data
        const cardData: WinCardData = {
          positionId: String(tokenId),
          title: `I won $${pos.claimPreview?.netAmountFormatted || pos.amountFormatted}`,
          market: pos.marketQuestion || `Market #${pos.marketId}`,
          side: pos.outcomeLabel || (pos.outcome === 0 ? 'YES' : 'NO'),
          entry: parseFloat(pos.amountFormatted),
          payout: parseFloat(pos.claimPreview?.netAmountFormatted || pos.amountFormatted),
          profit: parseFloat(pos.claimPreview?.netAmountFormatted || pos.amountFormatted) - parseFloat(pos.amountFormatted),
          roi: ((parseFloat(pos.claimPreview?.netAmountFormatted || pos.amountFormatted) / parseFloat(pos.amountFormatted) - 1) * 100).toFixed(1),
          refLink: `https://t.me/fomo_arena_bot?startapp=market_${pos.marketId}`,
          telegramShareUrl: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/fomo_arena_bot?startapp=market_${pos.marketId}`)}&text=${encodeURIComponent(`🎉 I just won $${pos.claimPreview?.netAmountFormatted || pos.amountFormatted} on FOMO Arena!\n\nJoin the Arena`)}`,
          shareText: `🎉 I just won $${pos.claimPreview?.netAmountFormatted || pos.amountFormatted} on FOMO Arena!\n\nJoin the Arena`,
        };
        setWinCardData(cardData);
        setShowWinModal(true);
      }
      
      // Refresh positions
      setTimeout(() => loadPositions(), 2000);
    } else {
      setTxResult({ tokenId, success: false, error: 'error' in result ? result.error : 'Unknown error' });
    }
    
    setActionLoading(null);
  };

  const handleShareTracked = async () => {
    if (walletAddress && claimedPosition) {
      try {
        await WinCardAPI.trackShare(String(claimedPosition.tokenId), walletAddress);
      } catch (err) {
        console.error('Failed to track share:', err);
      }
    }
  };

  const handleRefund = async (tokenId: number) => {
    setActionLoading(tokenId);
    setTxResult(null);
    
    const result = await refund(tokenId);
    
    if (result.ok) {
      setTxResult({ tokenId, success: true, hash: result.txHash });
      onPositionRefunded?.(tokenId);
      // Refresh positions
      setTimeout(() => loadPositions(), 2000);
    } else {
      setTxResult({ tokenId, success: false, error: 'error' in result ? result.error : 'Unknown error' });
    }
    
    setActionLoading(null);
  };

  const explorerUrl = CHAIN_CONFIG.blockExplorer;

  if (!isAuthenticated) {
    return (
      <Container>
        <EmptyState>
          <Wallet size={48} />
          <h3>Connect Wallet</h3>
          <p>Connect your wallet to view your on-chain positions</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Trophy size={24} color="#00ff88" />
          My On-Chain Positions
        </Title>
        <RefreshButton onClick={loadPositions} disabled={loading}>
          <SpinIcon size={18} $loading={loading} />
        </RefreshButton>
      </Header>

      {loading && positions.length === 0 ? (
        <EmptyState>
          <LoadingSpinner size={32} />
          <p>Loading positions...</p>
        </EmptyState>
      ) : positions.length === 0 ? (
        <EmptyState>
          <Wallet size={48} />
          <h3>No Positions Yet</h3>
          <p>Place bets on markets to see your positions here</p>
        </EmptyState>
      ) : (
        <PositionsList>
          {positions.map((position) => (
            <PositionCard key={position.tokenId} $status={position.marketStatus}>
              <PositionHeader>
                <PositionInfo>
                  <PositionTitle>
                    {position.marketQuestion || `Market #${position.marketId}`}
                    <TokenBadge>#{position.tokenId}</TokenBadge>
                  </PositionTitle>
                  <PositionMeta>
                    <MetaItem>
                      <Hash size={12} />
                      Market #{position.marketId}
                    </MetaItem>
                    {position.marketStatus !== undefined && (
                      <StatusBadge $color={MARKET_STATUS_COLORS[position.marketStatus] || '#6B7280'}>
                        {MARKET_STATUS_LABELS[position.marketStatus] || 'Unknown'}
                      </StatusBadge>
                    )}
                  </PositionMeta>
                </PositionInfo>
                <OutcomeBadge $outcome={position.outcome}>
                  {position.outcomeLabel || (position.outcome === 0 ? 'YES' : 'NO')}
                </OutcomeBadge>
              </PositionHeader>

              <PositionStats>
                <StatBox>
                  <StatLabel>Staked</StatLabel>
                  <StatValue>${position.amountFormatted}</StatValue>
                </StatBox>
                <StatBox>
                  <StatLabel>Potential Return</StatLabel>
                  <StatValue $highlight>
                    {position.claimPreview?.claimable 
                      ? `$${position.claimPreview.netAmountFormatted}`
                      : position.refundPreview?.refundable
                        ? `$${position.refundPreview.amountFormatted}`
                        : '-'
                    }
                  </StatValue>
                </StatBox>
                <StatBox>
                  <StatLabel>Status</StatLabel>
                  <StatValue>
                    {position.claimed 
                      ? 'Claimed'
                      : position.claimPreview?.claimable 
                        ? 'Won!'
                        : position.refundPreview?.refundable
                          ? 'Refundable'
                          : 'Active'
                    }
                  </StatValue>
                </StatBox>
              </PositionStats>

              {/* Transaction Result */}
              {txResult && txResult.tokenId === position.tokenId && (
                <TxStatus $success={txResult.success}>
                  {txResult.success ? (
                    <>
                      <Check size={16} />
                      Transaction successful!
                      {txResult.hash && (
                        <ExplorerLink href={`${explorerUrl}/tx/${txResult.hash}`} target="_blank">
                          View <ExternalLink size={12} />
                        </ExplorerLink>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      {txResult.error || 'Transaction failed'}
                    </>
                  )}
                </TxStatus>
              )}

              {/* Action Buttons */}
              {!position.claimed && (
                <ActionButtons>
                  {position.claimPreview?.claimable && (
                    <ActionButton
                      $variant="claim"
                      onClick={() => handleClaim(position.tokenId)}
                      disabled={actionLoading === position.tokenId}
                    >
                      {actionLoading === position.tokenId ? (
                        <LoadingSpinner size={16} />
                      ) : (
                        <>
                          <DollarSign size={16} />
                          Claim ${position.claimPreview.netAmountFormatted}
                        </>
                      )}
                    </ActionButton>
                  )}
                  
                  {position.refundPreview?.refundable && (
                    <ActionButton
                      $variant="refund"
                      onClick={() => handleRefund(position.tokenId)}
                      disabled={actionLoading === position.tokenId}
                    >
                      {actionLoading === position.tokenId ? (
                        <LoadingSpinner size={16} />
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Refund ${position.refundPreview.amountFormatted}
                        </>
                      )}
                    </ActionButton>
                  )}
                  
                  <ActionButton
                    $variant="secondary"
                    as="a"
                    href={`${explorerUrl}/token/${marketAddress}?a=${position.tokenId}`}
                    target="_blank"
                  >
                    <ExternalLink size={16} />
                    View NFT
                  </ActionButton>
                </ActionButtons>
              )}

              {position.claimed && (
                <ActionButtons>
                  <ActionButton $variant="secondary" disabled>
                    <Check size={16} />
                    Already Claimed
                  </ActionButton>
                </ActionButtons>
              )}
              
              {/* Win Celebration UI - показываем сразу после claim */}
              {txResult && txResult.tokenId === position.tokenId && txResult.success && position.claimPreview?.claimable && (
                <WinCelebration data-testid="win-celebration">
                  <WinTitle>
                    <span>&#127881;</span> You Won! <span>&#127881;</span>
                  </WinTitle>
                  <WinAmount data-testid="win-amount">+${position.claimPreview.netAmountFormatted}</WinAmount>
                  <WinActions>
                    <ActionButton 
                      $variant="share" 
                      onClick={() => {
                        setClaimedPosition(position);
                        setShowWinModal(true);
                      }}
                      data-testid="share-win-btn"
                    >
                      <Share2 size={20} />
                      Share Win
                    </ActionButton>
                    <ActionButton 
                      $variant="rematch"
                      as="a"
                      href={`/arena/duels?market=${position.marketId}`}
                      data-testid="rematch-btn"
                    >
                      <Swords size={18} />
                      Rematch
                    </ActionButton>
                  </WinActions>
                </WinCelebration>
              )}
            </PositionCard>
          ))}
        </PositionsList>
      )}
      
      {/* Share Win Modal */}
      <ShareWinModal
        isOpen={showWinModal}
        onClose={() => setShowWinModal(false)}
        winData={winCardData}
        onShareTracked={handleShareTracked}
      />
    </Container>
  );
};

export default OnchainPositionsPanel;
