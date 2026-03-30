'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { Trophy, Wallet, RefreshCw, ExternalLink, DollarSign, Clock, Check, X as XIcon, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket } from '@/lib/contracts';
import * as PredictionMarket from '@/lib/contracts/predictionMarket';
import { CHAIN_CONFIG } from '@/lib/contracts/config';
import ClaimSheet, { ClaimPosition } from './ClaimSheet';
import ShareWinModal, { ShareWinData } from './ShareWinModal';
import { triggerHaptic } from '@/lib/telegram';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div<{ $bgColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h3<{ $textColor: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.$textColor};
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const RefreshButton = styled.button<{ $bgColor: string }>`
  background: ${props => props.$bgColor};
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
  }
`;

const SpinIcon = styled(RefreshCw)<{ $loading?: boolean }>`
  ${({ $loading }) => $loading && `animation: ${spin} 1s linear infinite;`}
`;

const EmptyState = styled.div<{ $mutedColor: string }>`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.$mutedColor};
  
  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    margin: 0;
  }
`;

const PositionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const PositionCard = styled.div<{ $status: string; $bgColor: string; $borderColor: string }>`
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s;
  
  ${({ $status }) => {
    switch ($status) {
      case 'won':
        return `border-color: rgba(16, 185, 129, 0.4);`;
      case 'lost':
        return `border-color: rgba(239, 68, 68, 0.3); opacity: 0.7;`;
      case 'claimed':
        return `border-color: rgba(99, 102, 241, 0.3); opacity: 0.8;`;
      default:
        return '';
    }
  }}
`;

const PositionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const PositionInfo = styled.div`
  flex: 1;
`;

const PositionTitle = styled.h4<{ $textColor: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$textColor};
  margin: 0 0 6px 0;
  line-height: 1.3;
`;

const PositionMeta = styled.div<{ $mutedColor: string }>`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: ${props => props.$mutedColor};
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
  font-weight: 700;
  
  ${({ $outcome }) => $outcome === 0 ? `
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
  ` : `
    background: rgba(239, 68, 68, 0.15);
    color: #EF4444;
  `}
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  margin-left: 8px;
  
  ${({ $status }) => {
    switch ($status) {
      case 'won':
        return `background: rgba(16, 185, 129, 0.2); color: #10B981;`;
      case 'lost':
        return `background: rgba(239, 68, 68, 0.2); color: #EF4444;`;
      case 'claimed':
        return `background: rgba(99, 102, 241, 0.2); color: #818CF8;`;
      case 'open':
        return `background: rgba(245, 158, 11, 0.2); color: #F59E0B;`;
      default:
        return `background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6);`;
    }
  }}
`;

const PositionStats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
`;

const Stat = styled.div<{ $mutedColor: string; $textColor: string }>`
  .label {
    font-size: 11px;
    color: ${props => props.$mutedColor};
    margin-bottom: 2px;
    text-transform: uppercase;
  }
  .value {
    font-size: 16px;
    font-weight: 700;
    color: ${props => props.$textColor};
  }
  .value.highlight {
    color: #10B981;
  }
`;

const ActionButton = styled.button<{ $variant: 'claim' | 'view' }>`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  ${({ $variant }) => $variant === 'claim' ? `
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: #000;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    
    &:active {
      transform: scale(0.98);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    
    &:active {
      background: rgba(255, 255, 255, 0.15);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

// Types
interface Position {
  tokenId: number;
  marketId: number;
  outcome: number;
  amount: string;
  amountFormatted: string;
  claimed: boolean;
  status: string;
  marketStatus?: number;
  marketQuestion?: string;
  outcomeLabel?: string;
  claimPreview?: {
    claimable: boolean;
    netAmountFormatted: string;
    feeAmountFormatted: string;
    grossAmountFormatted: string;
  };
}

interface MyPositionsProps {
  onPositionClaimed?: (tokenId: number, amount: number) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function MyPositions({ onPositionClaimed }: MyPositionsProps) {
  const { theme } = useTheme();
  const { isConnected, walletAddress } = useWallet();
  const { marketAddress } = usePredictionMarket();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<ClaimPosition | null>(null);
  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<ShareWinData | null>(null);

  const loadPositions = useCallback(async () => {
    if (!walletAddress || !marketAddress) return;
    
    setLoading(true);
    
    try {
      // Fetch positions from backend
      const response = await fetch(
        `${API_URL}/api/onchain/positions?owner=${walletAddress.toLowerCase()}`
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        const positionsData: Position[] = [];
        
        for (const pos of result.data) {
          // Get claim preview from contract
          const claimPreview = await PredictionMarket.previewClaim(marketAddress, pos.tokenId);
          
          positionsData.push({
            tokenId: pos.tokenId,
            marketId: pos.marketId,
            outcome: pos.outcome,
            amount: pos.amount,
            amountFormatted: pos.amountFormatted || (parseFloat(pos.amount) / 1e18).toFixed(2),
            claimed: pos.claimed || pos.status === 'claimed',
            status: pos.status || 'open',
            marketQuestion: pos.marketQuestion || pos.question,
            outcomeLabel: pos.outcomeLabel,
            claimPreview: claimPreview.ok ? {
              claimable: claimPreview.data.claimable,
              netAmountFormatted: claimPreview.data.netAmountFormatted,
              feeAmountFormatted: claimPreview.data.feeAmountFormatted,
              grossAmountFormatted: claimPreview.data.grossAmountFormatted,
            } : undefined,
          });
        }
        
        setPositions(positionsData);
      }
    } catch (err) {
      console.error('Failed to load positions:', err);
    }
    
    setLoading(false);
  }, [walletAddress, marketAddress]);

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadPositions();
    }
  }, [isConnected, walletAddress, loadPositions]);

  const handleClaimClick = (position: Position) => {
    if (!position.claimPreview?.claimable) return;
    
    triggerHaptic('light');
    
    setSelectedPosition({
      tokenId: position.tokenId,
      marketId: position.marketId,
      outcome: position.outcome,
      outcomeLabel: position.outcomeLabel,
      amount: position.amount,
      amountFormatted: position.amountFormatted,
      marketQuestion: position.marketQuestion,
      claimPreview: position.claimPreview ? {
        claimable: position.claimPreview.claimable,
        grossAmount: '',
        grossAmountFormatted: position.claimPreview.grossAmountFormatted,
        feeAmount: '',
        feeAmountFormatted: position.claimPreview.feeAmountFormatted,
        netAmount: '',
        netAmountFormatted: position.claimPreview.netAmountFormatted,
      } : undefined,
    });
    setShowClaimSheet(true);
  };

  const handleClaimed = (txHash: string, amount: number) => {
    if (selectedPosition) {
      onPositionClaimed?.(selectedPosition.tokenId, amount);
    }
    // Refresh positions
    setTimeout(() => loadPositions(), 2000);
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'won': return 'WON';
      case 'lost': return 'LOST';
      case 'claimed': return 'CLAIMED';
      case 'open': return 'ACTIVE';
      default: return status.toUpperCase();
    }
  };

  if (!isConnected) {
    return (
      <Container $bgColor={theme.bgCard}>
        <EmptyState $mutedColor={theme.textMuted}>
          <Wallet size={48} />
          <h4>Connect Wallet</h4>
          <p>Connect your wallet to view your positions</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <>
      <Container $bgColor={theme.bgCard} data-testid="my-positions">
        <Header>
          <Title $textColor={theme.textPrimary}>
            <Trophy size={22} color="#10B981" />
            My Positions
          </Title>
          <RefreshButton onClick={loadPositions} disabled={loading} $bgColor={theme.bgPrimary}>
            <SpinIcon size={18} $loading={loading} />
          </RefreshButton>
        </Header>

        {loading && positions.length === 0 ? (
          <EmptyState $mutedColor={theme.textMuted}>
            <LoadingSpinner size={32} />
            <p style={{ marginTop: 12 }}>Loading positions...</p>
          </EmptyState>
        ) : positions.length === 0 ? (
          <EmptyState $mutedColor={theme.textMuted}>
            <Wallet size={48} />
            <h4>No Positions</h4>
            <p>Place bets on markets to see your positions here</p>
          </EmptyState>
        ) : (
          <PositionsList>
            {positions.map((position) => (
              <PositionCard 
                key={position.tokenId}
                $status={position.status}
                $bgColor={theme.bgPrimary}
                $borderColor={theme.border}
                data-testid={`position-card-${position.tokenId}`}
              >
                <PositionHeader>
                  <PositionInfo>
                    <PositionTitle $textColor={theme.textPrimary}>
                      {position.marketQuestion || `Market #${position.marketId}`}
                    </PositionTitle>
                    <PositionMeta $mutedColor={theme.textMuted}>
                      <MetaItem>Token #{position.tokenId}</MetaItem>
                      <StatusBadge $status={position.status}>
                        {getStatusLabel(position.status)}
                      </StatusBadge>
                    </PositionMeta>
                  </PositionInfo>
                  <OutcomeBadge $outcome={position.outcome}>
                    {position.outcomeLabel || (position.outcome === 0 ? 'YES' : 'NO')}
                  </OutcomeBadge>
                </PositionHeader>

                <PositionStats>
                  <Stat $mutedColor={theme.textMuted} $textColor={theme.textPrimary}>
                    <div className="label">Stake</div>
                    <div className="value">${position.amountFormatted}</div>
                  </Stat>
                  {position.claimPreview?.claimable && (
                    <Stat $mutedColor={theme.textMuted} $textColor={theme.textPrimary}>
                      <div className="label">Payout</div>
                      <div className="value highlight">
                        ${position.claimPreview.netAmountFormatted}
                      </div>
                    </Stat>
                  )}
                </PositionStats>

                {/* Claim Button - Show only for won positions */}
                {position.status === 'won' && position.claimPreview?.claimable && !position.claimed && (
                  <ActionButton 
                    $variant="claim"
                    onClick={() => handleClaimClick(position)}
                    data-testid={`claim-btn-${position.tokenId}`}
                  >
                    <DollarSign size={18} />
                    Claim ${position.claimPreview.netAmountFormatted}
                  </ActionButton>
                )}

                {/* Already Claimed */}
                {(position.claimed || position.status === 'claimed') && (
                  <ActionButton $variant="view" disabled>
                    <Check size={16} />
                    Claimed
                  </ActionButton>
                )}

                {/* Lost */}
                {position.status === 'lost' && (
                  <ActionButton $variant="view" disabled>
                    <XIcon size={16} />
                    Lost
                  </ActionButton>
                )}

                {/* Active/Open */}
                {position.status === 'open' && (
                  <ActionButton $variant="view">
                    <Clock size={16} />
                    Waiting for Result
                  </ActionButton>
                )}
              </PositionCard>
            ))}
          </PositionsList>
        )}
      </Container>

      {/* Claim Sheet */}
      <ClaimSheet
        isOpen={showClaimSheet}
        position={selectedPosition}
        onClose={() => setShowClaimSheet(false)}
        onClaimed={handleClaimed}
        onShareWin={(data) => {
          setShareData({
            tokenId: data.tokenId,
            marketId: data.marketId,
            marketQuestion: data.marketQuestion,
            outcome: data.outcome,
            outcomeLabel: data.outcomeLabel,
            amount: '',
            amountFormatted: data.amountFormatted,
            profit: '',
            profitFormatted: data.profitFormatted,
            txHash: data.txHash,
          });
          setShowShareModal(true);
        }}
      />

      {/* Share Win Modal */}
      <ShareWinModal
        isOpen={showShareModal}
        data={shareData}
        onClose={() => setShowShareModal(false)}
        onShared={(platform) => {
          console.log(`Shared on ${platform}`);
        }}
      />
    </>
  );
}

export default MyPositions;
