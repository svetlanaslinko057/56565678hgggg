'use client';

import React, { useState, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Share2, Trophy, Flame, Swords, TrendingUp, Copy, Check, ExternalLink, Zap, DollarSign } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { triggerHaptic } from '@/lib/telegram';

// ==================== ANIMATIONS ====================
const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const celebratePulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const confetti = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-150px) rotate(720deg); opacity: 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

// ==================== STYLED COMPONENTS ====================
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1001;
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
  backdrop-filter: blur(12px);
`;

const Modal = styled.div<{ $bgColor: string }>`
  width: 100%;
  max-width: 380px;
  background: ${props => props.$bgColor};
  border-radius: 24px;
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  position: relative;
`;

const CloseButton = styled.button<{ $bgColor: string }>`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$bgColor};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  z-index: 10;
  
  &:active {
    transform: scale(0.9);
  }
`;

// ==================== WIN CARD (for sharing) ====================
const WinCard = styled.div`
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #10B981, #34D399, #10B981);
    background-size: 200% 100%;
    animation: ${shimmer} 2s infinite;
  }
`;

const ConfettiContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const ConfettiPiece = styled.div<{ $left: number; $delay: number; $color: string }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${props => props.$color};
  left: ${props => props.$left}%;
  top: 60%;
  border-radius: 2px;
  animation: ${confetti} 2s ease-out ${props => props.$delay}s infinite;
`;

const WinBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const TrophyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4);
  animation: ${float} 2s ease-in-out infinite;
  
  svg {
    color: #000;
  }
`;

const WinTitle = styled.h2`
  font-size: 28px;
  font-weight: 900;
  text-align: center;
  color: #fff;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const WinAmount = styled.div`
  font-size: 52px;
  font-weight: 900;
  text-align: center;
  background: linear-gradient(135deg, #10B981 0%, #34D399 50%, #10B981 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
  animation: ${celebratePulse} 2s ease-in-out infinite;
`;

const MarketQuestion = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  text-align: center;
  
  .label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  
  .question {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    line-height: 1.4;
  }
`;

const OutcomeBadge = styled.div<{ $outcome: number }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  margin-top: 8px;
  
  ${({ $outcome }) => $outcome === 0 ? `
    background: rgba(16, 185, 129, 0.2);
    color: #10B981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  ` : `
    background: rgba(239, 68, 68, 0.2);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  `}
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const StatPill = styled.div<{ $color: string }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  background: ${props => props.$color}15;
  border: 1px solid ${props => props.$color}30;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  color: ${props => props.$color};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const BrandingFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .logo {
    font-size: 16px;
    font-weight: 800;
    color: #10B981;
    letter-spacing: 1px;
  }
  
  .tagline {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }
`;

// ==================== SHARE ACTIONS ====================
const ShareActions = styled.div`
  padding: 24px;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%);
`;

const ShareTitle = styled.h3<{ $textColor: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.$textColor};
  text-align: center;
  margin: 0 0 16px 0;
`;

const ShareButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ShareButton = styled.button<{ $variant: 'telegram' | 'copy' | 'twitter' }>`
  width: 100%;
  padding: 16px 20px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'telegram':
        return `
          background: linear-gradient(135deg, #0088cc 0%, #0077b5 100%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(0, 136, 204, 0.3);
        `;
      case 'twitter':
        return `
          background: linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%);
          color: #fff;
        `;
      case 'copy':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
    }
  }}
  
  &:active {
    transform: scale(0.98);
  }
`;

const XpReward = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 16px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #A855F7;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// ==================== TYPES ====================
export interface ShareWinData {
  tokenId: number;
  marketId: number;
  marketQuestion: string;
  outcome: number;
  outcomeLabel: string;
  amount: string;
  amountFormatted: string;
  profit: string;
  profitFormatted: string;
  streak?: number;
  rivalName?: string;
  edge?: string;
  txHash?: string;
}

interface ShareWinModalProps {
  isOpen: boolean;
  data: ShareWinData | null;
  onClose: () => void;
  onShared?: (platform: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'fomo_arena_bot';

// ==================== COMPONENT ====================
export function ShareWinModal({ isOpen, data, onClose, onShared }: ShareWinModalProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  // Generate share URL with deep link
  const shareUrl = `https://t.me/${BOT_USERNAME}?startapp=win_${data.tokenId}`;
  
  // Share text
  const shareText = `🏆 I just won +$${data.profitFormatted} on FOMO Arena!\n\n` +
    `📊 "${data.marketQuestion}"\n` +
    `✅ Bet: ${data.outcomeLabel}\n` +
    (data.streak && data.streak >= 3 ? `🔥 ${data.streak} win streak!\n` : '') +
    (data.edge ? `📈 ${data.edge} edge\n` : '') +
    `\n💰 Join and predict to earn!`;

  const handleTelegramShare = async () => {
    triggerHaptic('medium');
    
    // Track share
    try {
      await fetch(`${API_URL}/api/share/win/${data.tokenId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'telegram' }),
      });
    } catch (err) {
      console.error('Failed to track share:', err);
    }

    // Open Telegram share
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    
    onShared?.('telegram');
  };

  const handleTwitterShare = async () => {
    triggerHaptic('medium');
    
    // Track share
    try {
      await fetch(`${API_URL}/api/share/win/${data.tokenId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'twitter' }),
      });
    } catch (err) {
      console.error('Failed to track share:', err);
    }

    // Open Twitter share
    const twitterText = `🏆 Won +$${data.profitFormatted} on @FOMO_Arena!\n\n"${data.marketQuestion}"\n\n${data.streak && data.streak >= 3 ? `🔥 ${data.streak} streak ` : ''}Join the prediction market 👇`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    
    onShared?.('twitter');
  };

  const handleCopyLink = async () => {
    triggerHaptic('light');
    
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      
      // Track share
      await fetch(`${API_URL}/api/share/win/${data.tokenId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'copy' }),
      });
      
      setTimeout(() => setCopied(false), 2000);
      onShared?.('copy');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Confetti colors
  const confettiColors = ['#10B981', '#fbbf24', '#A855F7', '#3B82F6', '#EC4899'];

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Modal $bgColor={theme.bgCard} onClick={(e) => e.stopPropagation()} data-testid="share-win-modal">
        <CloseButton onClick={onClose} $bgColor={theme.bgPrimary}>
          <X size={20} />
        </CloseButton>

        {/* Win Card - Shareable Visual */}
        <WinCard ref={cardRef} data-testid="win-card">
          <ConfettiContainer>
            {confettiColors.map((color, i) => (
              <React.Fragment key={i}>
                <ConfettiPiece $left={10 + i * 18} $delay={i * 0.1} $color={color} />
                <ConfettiPiece $left={15 + i * 18} $delay={i * 0.15 + 0.5} $color={color} />
              </React.Fragment>
            ))}
          </ConfettiContainer>

          <WinBadge>
            <TrophyIcon>
              <Trophy size={28} />
            </TrophyIcon>
          </WinBadge>

          <WinTitle>You Won!</WinTitle>
          
          <WinAmount data-testid="win-amount">
            +${data.profitFormatted}
          </WinAmount>

          <MarketQuestion>
            <div className="label">Prediction</div>
            <div className="question">{data.marketQuestion}</div>
            <OutcomeBadge $outcome={data.outcome}>
              <Check size={14} />
              {data.outcomeLabel}
            </OutcomeBadge>
          </MarketQuestion>

          <StatsRow>
            {data.streak && data.streak >= 2 && (
              <StatPill $color="#F59E0B">
                <Flame size={16} />
                {data.streak} Streak
              </StatPill>
            )}
            {data.rivalName && (
              <StatPill $color="#8B5CF6">
                <Swords size={16} />
                Beat {data.rivalName}
              </StatPill>
            )}
            {data.edge && (
              <StatPill $color="#10B981">
                <TrendingUp size={16} />
                {data.edge} Edge
              </StatPill>
            )}
            {!data.streak && !data.rivalName && !data.edge && (
              <StatPill $color="#10B981">
                <DollarSign size={16} />
                Profit: ${data.profitFormatted}
              </StatPill>
            )}
          </StatsRow>

          <BrandingFooter>
            <Zap size={18} color="#10B981" />
            <span className="logo">FOMO ARENA</span>
            <span className="tagline">Predict & Earn</span>
          </BrandingFooter>
        </WinCard>

        {/* Share Actions */}
        <ShareActions>
          <ShareTitle $textColor={theme.textPrimary}>
            Share Your Victory
          </ShareTitle>

          <ShareButtons>
            <ShareButton 
              $variant="telegram" 
              onClick={handleTelegramShare}
              data-testid="share-telegram-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Share to Telegram
            </ShareButton>

            <ShareButton 
              $variant="twitter" 
              onClick={handleTwitterShare}
              data-testid="share-twitter-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </ShareButton>

            <ShareButton 
              $variant="copy" 
              onClick={handleCopyLink}
              data-testid="copy-link-btn"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </ShareButton>
          </ShareButtons>

          <XpReward>
            <Zap size={16} />
            +5 XP for sharing your win!
          </XpReward>
        </ShareActions>
      </Modal>
    </Overlay>
  );
}

export default ShareWinModal;
