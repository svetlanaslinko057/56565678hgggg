'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { TgPageContainer } from '@/components/tg';
import { useTheme } from '@/lib/ThemeContext';
import { useWallet } from '@/lib/wagmi';
import { MyPositions } from '@/components/tg/arena/MyPositions';
import { NotificationSettingsPanel } from '@/components/arena/NotificationSettingsPanel';
import { 
  Trophy, Target, Flame, Medal, 
  Share2, Settings, Wallet, ChevronRight,
  TrendingUp, Swords, Moon, Sun, X, LogOut, Copy, Check, Bell
} from 'lucide-react';

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 20px;
`;

const Avatar = styled.div<{ $accentColor: string }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  border: 3px solid ${props => props.$accentColor};
`;

const Username = styled.h2<{ $textColor: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.$textColor};
  margin: 0 0 4px 0;
`;

const WalletAddress = styled.p<{ $textColor: string }>`
  font-size: 13px;
  color: ${props => props.$textColor};
  margin: 0;
  font-family: monospace;
`;

const LevelBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 20px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #ffd700;
`;

const XpBar = styled.div<{ $mutedColor: string; $accentColor: string }>`
  width: 100%;
  max-width: 200px;
  margin-top: 12px;
  
  .bar {
    height: 6px;
    background: ${props => props.$mutedColor}30;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 4px;
    
    .fill {
      height: 100%;
      background: linear-gradient(90deg, ${props => props.$accentColor}, ${props => props.$accentColor}cc);
      border-radius: 3px;
      width: 65%;
    }
  }
  
  .text {
    font-size: 11px;
    color: ${props => props.$mutedColor};
    text-align: center;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const StatCard = styled.div<{ $bgColor: string; $textColor: string; $mutedColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  
  .icon {
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
    color: ${props => props.$mutedColor};
  }
  
  .value {
    font-size: 22px;
    font-weight: 700;
    color: ${props => props.$textColor};
    margin-bottom: 4px;
  }
  
  .label {
    font-size: 12px;
    color: ${props => props.$mutedColor};
  }
`;

const SectionTitle = styled.h3<{ $textColor: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$textColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
`;

const BadgesList = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 24px;
  padding-bottom: 4px;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Badge = styled.div<{ $earned?: boolean; $accentColor: string; $bgColor: string; $textColor: string }>`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: ${({ $earned, $accentColor, $bgColor }) => $earned 
    ? `linear-gradient(135deg, ${$accentColor}15 0%, ${$accentColor}08 100%)`
    : $bgColor
  };
  border: 1px solid ${({ $earned, $accentColor }) => $earned 
    ? `${$accentColor}50`
    : 'transparent'
  };
  border-radius: 12px;
  min-width: 80px;
  opacity: ${({ $earned }) => $earned ? 1 : 0.5};
  
  .icon {
    font-size: 24px;
  }
  
  .name {
    font-size: 11px;
    font-weight: 600;
    color: ${({ $earned, $textColor }) => $earned ? $textColor : `${$textColor}60`};
    text-align: center;
  }
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MenuItem = styled.button<{ $bgColor: string; $textColor: string; $mutedColor: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 12px;
  background: ${props => props.$bgColor};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
  
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: ${props => props.$mutedColor}15;
    color: ${props => props.$textColor}b0;
  }
  
  .text {
    flex: 1;
    text-align: left;
    
    .title {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.$textColor};
    }
    
    .subtitle {
      font-size: 12px;
      color: ${props => props.$mutedColor};
    }
  }
  
  .arrow {
    color: ${props => props.$mutedColor};
  }
`;

const ThemeToggle = styled.div<{ $bgColor: string; $accentColor: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: ${props => props.$bgColor};
  border-radius: 20px;
`;

const ThemeButton = styled.button<{ $active: boolean; $accentColor: string; $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? props.$accentColor : 'transparent'};
  color: ${props => props.$active ? '#000' : props.$textColor};
  
  &:active {
    transform: scale(0.9);
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div<{ $bgColor: string; $textColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 20px;
  width: 100%;
  max-width: 360px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div<{ $borderColor: string; $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.$borderColor};
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.$textColor};
  }
`;

const CloseButton = styled.button<{ $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--border-light);
  color: ${props => props.$textColor};
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const WalletInfo = styled.div<{ $bgColor: string; $textColor: string; $mutedColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  
  .label {
    font-size: 12px;
    color: ${props => props.$mutedColor};
    margin-bottom: 8px;
  }
  
  .address {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: monospace;
    font-size: 14px;
    color: ${props => props.$textColor};
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 10px;
  
  background: ${props => props.$variant === 'danger' 
    ? 'rgba(239, 68, 68, 0.15)' 
    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'};
  color: ${props => props.$variant === 'danger' ? '#EF4444' : '#fff'};
  
  &:active {
    transform: scale(0.98);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ShareButton = styled.button<{ $bgColor: string; $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: ${props => props.$bgColor};
  color: ${props => props.$textColor};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 10px;
  
  &:active {
    transform: scale(0.98);
  }
`;

const badges = [
  { icon: '🎯', name: 'First Bet', earned: true },
  { icon: '🔥', name: '3 Streak', earned: true },
  { icon: '⚔️', name: 'Duelist', earned: true },
  { icon: '🏆', name: 'Top 10', earned: false },
  { icon: '💎', name: 'Diamond', earned: false },
  { icon: '🦈', name: 'Whale', earned: false },
];

export default function TgProfilePage() {
  const { theme, mode, toggleTheme, setTheme } = useTheme();
  const { 
    isConnected, 
    walletAddress, 
    shortAddress, 
    connectWallet, 
    disconnectWallet 
  } = useWallet();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareProfile = () => {
    const shareUrl = `https://t.me/fomo_arena_bot?startapp=ref_${shortAddress || 'demo'}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on FOMO Arena!',
        text: 'Bet on predictions and earn rewards!',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const displayAddress = isConnected ? shortAddress : '0x1234...5678';
  const displayName = isConnected ? shortAddress : 'CryptoKing';

  return (
    <TgPageContainer>
      <ProfileHeader>
        <Avatar $accentColor={theme.accent}>{displayName?.slice(0, 2).toUpperCase() || 'CK'}</Avatar>
        <Username $textColor={theme.textPrimary}>{displayName}</Username>
        <WalletAddress $textColor={theme.textMuted}>{displayAddress}</WalletAddress>
        <LevelBadge>
          <Trophy size={14} /> Level 12
        </LevelBadge>
        <XpBar $mutedColor={theme.textMuted} $accentColor={theme.accent}>
          <div className="bar">
            <div className="fill" />
          </div>
          <div className="text">6,500 / 10,000 XP to Level 13</div>
        </XpBar>
      </ProfileHeader>

      <StatsGrid>
        <StatCard $bgColor={theme.bgCard} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
          <div className="icon"><Target size={20} /></div>
          <div className="value">45</div>
          <div className="label">Total Bets</div>
        </StatCard>
        <StatCard $bgColor={theme.bgCard} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
          <div className="icon"><Trophy size={20} /></div>
          <div className="value">32</div>
          <div className="label">Wins</div>
        </StatCard>
        <StatCard $bgColor={theme.bgCard} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
          <div className="icon"><TrendingUp size={20} /></div>
          <div className="value">71%</div>
          <div className="label">Win Rate</div>
        </StatCard>
        <StatCard $bgColor={theme.bgCard} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
          <div className="icon"><Swords size={20} /></div>
          <div className="value">8</div>
          <div className="label">Duels Won</div>
        </StatCard>
      </StatsGrid>

      <SectionTitle $textColor={theme.textMuted}>My Positions</SectionTitle>
      <MyPositions />

      <SectionTitle $textColor={theme.textMuted}>Badges</SectionTitle>
      <BadgesList>
        {badges.map((badge, i) => (
          <Badge 
            key={i} 
            $earned={badge.earned}
            $accentColor={theme.accent}
            $bgColor={theme.bgCard}
            $textColor={theme.textPrimary}
          >
            <span className="icon">{badge.icon}</span>
            <span className="name">{badge.name}</span>
          </Badge>
        ))}
      </BadgesList>

      <SectionTitle $textColor={theme.textMuted}>Settings</SectionTitle>
      <MenuList>
        <MenuItem 
          $bgColor={theme.bgCard} 
          $textColor={theme.textPrimary} 
          $mutedColor={theme.textMuted}
          onClick={() => setShowWalletModal(true)}
          data-testid="wallet-menu-item"
        >
          <div className="icon"><Wallet size={18} /></div>
          <div className="text">
            <div className="title">Wallet</div>
            <div className="subtitle">{isConnected ? `Connected: ${displayAddress}` : 'Not connected'}</div>
          </div>
          <ChevronRight size={18} className="arrow" />
        </MenuItem>

        <MenuItem 
          $bgColor={theme.bgCard} 
          $textColor={theme.textPrimary} 
          $mutedColor={theme.textMuted}
          as="div"
        >
          <div className="icon">{mode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}</div>
          <div className="text">
            <div className="title">Theme</div>
            <div className="subtitle">{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
          </div>
          <ThemeToggle $bgColor={theme.bgSecondary} $accentColor={theme.accent}>
            <ThemeButton 
              $active={mode === 'light'} 
              $accentColor={theme.accent}
              $textColor={theme.textPrimary}
              onClick={() => setTheme('light')}
              data-testid="theme-light-btn"
            >
              <Sun size={16} />
            </ThemeButton>
            <ThemeButton 
              $active={mode === 'dark'} 
              $accentColor={theme.accent}
              $textColor={theme.textPrimary}
              onClick={() => setTheme('dark')}
              data-testid="theme-dark-btn"
            >
              <Moon size={16} />
            </ThemeButton>
          </ThemeToggle>
        </MenuItem>

        <MenuItem 
          $bgColor={theme.bgCard} 
          $textColor={theme.textPrimary} 
          $mutedColor={theme.textMuted}
          onClick={() => setShowShareModal(true)}
          data-testid="share-menu-item"
        >
          <div className="icon"><Share2 size={18} /></div>
          <div className="text">
            <div className="title">Share Profile</div>
            <div className="subtitle">Invite friends, earn rewards</div>
          </div>
          <ChevronRight size={18} className="arrow" />
        </MenuItem>
        
        <MenuItem 
          $bgColor={theme.bgCard} 
          $textColor={theme.textPrimary} 
          $mutedColor={theme.textMuted}
          onClick={() => setShowSettingsModal(true)}
          data-testid="settings-menu-item"
        >
          <div className="icon"><Settings size={18} /></div>
          <div className="text">
            <div className="title">Settings</div>
            <div className="subtitle">Notifications, preferences</div>
          </div>
          <ChevronRight size={18} className="arrow" />
        </MenuItem>
      </MenuList>

      {/* Wallet Modal */}
      {showWalletModal && (
        <ModalOverlay onClick={() => setShowWalletModal(false)}>
          <ModalContent 
            $bgColor={theme.bgPrimary} 
            $textColor={theme.textPrimary}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader $borderColor={theme.border} $textColor={theme.textPrimary}>
              <h3>Wallet</h3>
              <CloseButton $textColor={theme.textPrimary} onClick={() => setShowWalletModal(false)}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {isConnected ? (
                <>
                  <WalletInfo $bgColor={theme.bgCard} $textColor={theme.textPrimary} $mutedColor={theme.textMuted}>
                    <div className="label">Connected Address</div>
                    <div className="address">
                      <span>{walletAddress}</span>
                      <button onClick={copyAddress} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.accent }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </WalletInfo>
                  <ActionButton $variant="danger" onClick={() => { disconnectWallet(); setShowWalletModal(false); }}>
                    <LogOut size={18} />
                    Disconnect Wallet
                  </ActionButton>
                </>
              ) : (
                <ActionButton onClick={() => { connectWallet(); setShowWalletModal(false); }}>
                  <Wallet size={18} />
                  Connect Wallet
                </ActionButton>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ModalOverlay onClick={() => setShowShareModal(false)}>
          <ModalContent 
            $bgColor={theme.bgPrimary} 
            $textColor={theme.textPrimary}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader $borderColor={theme.border} $textColor={theme.textPrimary}>
              <h3>Share Profile</h3>
              <CloseButton $textColor={theme.textPrimary} onClick={() => setShowShareModal(false)}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: theme.textSecondary, marginBottom: 16, fontSize: 14 }}>
                Invite friends to FOMO Arena and earn 10% of their trading fees!
              </p>
              <ActionButton onClick={shareProfile}>
                <Share2 size={18} />
                Share Referral Link
              </ActionButton>
              <ShareButton 
                $bgColor={theme.bgCard} 
                $textColor={theme.textPrimary}
                onClick={() => {
                  const link = `https://t.me/fomo_arena_bot?startapp=ref_${shortAddress || 'demo'}`;
                  navigator.clipboard.writeText(link);
                  alert('Link copied!');
                }}
              >
                <Copy size={16} />
                Copy Link
              </ShareButton>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <ModalOverlay onClick={() => setShowSettingsModal(false)}>
          <ModalContent 
            $bgColor={theme.bgPrimary} 
            $textColor={theme.textPrimary}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader $borderColor={theme.border} $textColor={theme.textPrimary}>
              <h3>Notification Settings</h3>
              <CloseButton $textColor={theme.textPrimary} onClick={() => setShowSettingsModal(false)}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <NotificationSettingsPanel 
                wallet={walletAddress || ''} 
                onSave={() => setShowSettingsModal(false)}
              />
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </TgPageContainer>
  );
}
