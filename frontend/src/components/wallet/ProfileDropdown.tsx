'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { User, Wallet, Trophy, LogOut, ChevronDown, Copy, Check, AlertTriangle, Loader2, Settings } from 'lucide-react';
import { useWallet } from '@/lib/wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface UserProfile {
  wallet: string;
  username: string;
  avatar?: string;
  xp: number;
  tier: string;
  balance: number;
  openPositions: number;
  roi: number;
  accuracy: number;
}

const DropdownContainer = styled.div`
  position: relative;
`;

const WalletButton = styled.button<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: ${props => props.$connected ? '#f5f7fa' : '#0f172a'};
  border: 1px solid ${props => props.$connected ? '#e5e7eb' : 'transparent'};
  border-radius: 6px;
  color: ${props => props.$connected ? '#0f172a' : '#fff'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$connected ? '#eef1f5' : '#1e293b'};
    border-color: ${props => props.$connected ? '#d1d5db' : 'transparent'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const WalletAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`;

const WalletAvatarPlaceholder = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

const WalletText = styled.span`
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ChevronIcon = styled(ChevronDown)<{ $open: boolean }>`
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transform: ${props => props.$open ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s ease;
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: #ffffff;
  border: 1px solid #eef1f5;
  border-radius: 6px;
  padding: 16px;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? '0' : '-10px'});
  transition: all 0.2s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef1f5;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Username = styled.div`
  color: #0f172a;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
`;

const WalletAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #738094;
  font-size: 12px;
  
  button {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: #738094;
    
    &:hover {
      color: #10B981;
    }
  }
`;

const TierBadge = styled.span<{ $tier: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch(props.$tier?.toLowerCase()) {
      case 'diamond': return 'linear-gradient(135deg, #B9F2FF, #00D4FF)';
      case 'platinum': return 'linear-gradient(135deg, #E5E5E5, #A8A8A8)';
      case 'gold': return 'linear-gradient(135deg, #FFD700, #FFA500)';
      case 'silver': return 'linear-gradient(135deg, #C0C0C0, #808080)';
      case 'demo': return 'linear-gradient(135deg, #6366F1, #8B5CF6)';
      default: return 'linear-gradient(135deg, #CD7F32, #8B4513)';
    }
  }};
  color: ${props => props.$tier?.toLowerCase() === 'gold' ? '#000' : '#fff'};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  
  .label {
    color: #738094;
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  
  .value {
    color: #0f172a;
    font-size: 18px;
    font-weight: 600;
  }
  
  .sub {
    color: #738094;
    font-size: 11px;
  }
`;

const MenuItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #0f172a;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f7fa;
    color: #10B981;
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: #738094;
  }
  
  &.danger {
    color: #EF4444;
    
    svg {
      color: #EF4444;
    }
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

const SignInButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #10B981;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #059669;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SpinIcon = styled(Loader2)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Custom connect button wrapper for RainbowKit styling
const ConnectButtonWrapper = styled.div`
  [data-testid="rk-connect-button"] {
    background: #0f172a !important;
    color: #fff !important;
    border-radius: 6px !important;
    font-weight: 500 !important;
    padding: 10px 16px !important;
    transition: all 0.2s ease !important;
    
    &:hover {
      background: #1e293b !important;
    }
  }
`;

export const ProfileDropdown: React.FC = () => {
  const { 
    isConnected, 
    isConnecting, 
    walletAddress, 
    shortAddress,
    isCorrectNetwork,
    disconnectWallet,
    switchToCorrectNetwork,
  } = useWallet();
  
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set profile immediately when wallet is connected (no SIWE required)
  useEffect(() => {
    if (isConnected && walletAddress) {
      // Create profile immediately based on wallet address
      setProfile({
        wallet: walletAddress,
        username: shortAddress || walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
        xp: 0,
        tier: 'bronze',
        balance: 0,
        openPositions: 0,
        roi: 0,
        accuracy: 0,
      });
      
      // Try to fetch full profile from backend (optional, non-blocking)
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isConnected, walletAddress, shortAddress]);

  const fetchProfile = async () => {
    if (!walletAddress) return;
    try {
      // Fetch profile data from backend using wallet address
      const [profileRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile/${walletAddress}`).catch(() => null),
        fetch(`${API_BASE}/api/profile/${walletAddress}/stats`).catch(() => null)
      ]);
      
      const profileData = profileRes ? await profileRes.json().catch(() => ({})) : {};
      const statsData = statsRes ? await statsRes.json().catch(() => ({})) : {};
      
      if (profileData.success || statsData.success) {
        const profileInfo = profileData.data || {};
        const statsInfo = statsData.data || {};
        
        setProfile(prev => ({
          wallet: walletAddress,
          username: profileInfo.username || prev?.username || shortAddress || '',
          avatar: profileInfo.avatar,
          xp: statsInfo.xp || profileInfo.xp || 0,
          tier: statsInfo.tier || profileInfo.tier || 'bronze',
          balance: statsInfo.totalInvested || 0,
          openPositions: statsInfo.activePositions || 0,
          roi: statsInfo.realizedPnL || 0,
          accuracy: statsInfo.winRate || 0,
        }));
      }
    } catch {
      // Keep the basic profile, non-critical error
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setProfile(null);
    setIsOpen(false);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Not connected - show RainbowKit Connect Button
  if (!isConnected) {
    return (
      <ConnectButtonWrapper data-testid="connect-wallet-wrapper">
        <ConnectButton 
          showBalance={false}
          chainStatus="icon"
          accountStatus="avatar"
        />
      </ConnectButtonWrapper>
    );
  }

  // Connected but wrong network - handled by RainbowKit
  if (!isCorrectNetwork) {
    return (
      <ConnectButtonWrapper>
        <ConnectButton />
      </ConnectButtonWrapper>
    );
  }

  // Helper to check if username is custom (not just wallet-based or auto-generated)
  const hasCustomUsername = (username?: string) => {
    if (!username) return false;
    // If username starts with 0x or contains "..." it's wallet-based
    if (username.startsWith('0x') || username.includes('...')) return false;
    // If username starts with "User_" it's auto-generated - NOT custom
    if (username.startsWith('User_')) return false;
    return true;
  };

  // Get display name for Button: custom username OR shortAddress (NO "User_" prefix)
  const getDisplayName = () => {
    const username = profile?.username;
    if (hasCustomUsername(username)) {
      return username;
    }
    // Show clean shortAddress, not "User_xxx"
    return shortAddress || 'Loading...';
  };

  // Get display name for Dropdown header (same logic - no User_ prefix)
  const getDropdownDisplayName = () => {
    const username = profile?.username;
    if (hasCustomUsername(username)) {
      return username;
    }
    // Show clean shortAddress in dropdown too
    return shortAddress || walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4) || 'Unknown';
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    return profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`;
  };

  // Connected - show profile dropdown immediately (no SIWE required)
  return (
    <DropdownContainer ref={dropdownRef}>
      <WalletButton $connected={true} onClick={() => setIsOpen(!isOpen)} data-testid="wallet-dropdown-btn">
        {profile?.avatar ? (
          <WalletAvatar src={getAvatarUrl()} alt="" />
        ) : (
          <WalletAvatar src={getAvatarUrl()} alt="" />
        )}
        <WalletText>{getDisplayName()}</WalletText>
        <ChevronIcon $open={isOpen} />
      </WalletButton>

      <DropdownMenu $isOpen={isOpen} data-testid="profile-dropdown">
        {(profile || walletAddress) && (
          <>
            <ProfileHeader>
              <Avatar>
                <img src={getAvatarUrl()} alt="" style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }} />
              </Avatar>
              <ProfileInfo>
                <Username>{getDropdownDisplayName()}</Username>
                <WalletAddress>
                  {shortAddress}
                  <button onClick={copyAddress} data-testid="copy-address-btn">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </WalletAddress>
              </ProfileInfo>
              {profile?.tier && (
                <TierBadge $tier={profile.tier}>
                  {profile.tier}
                </TierBadge>
              )}
            </ProfileHeader>

            <StatsGrid>
              <StatItem>
                <div className="label">Balance</div>
                <div className="value">${profile?.balance?.toFixed(2) || '0.00'}</div>
                <div className="sub">USDT</div>
              </StatItem>
              <StatItem>
                <div className="label">XP</div>
                <div className="value">{profile?.xp || 0}</div>
                <div className="sub">Experience</div>
              </StatItem>
              <StatItem>
                <div className="label">ROI</div>
                <div className="value" style={{ color: (profile?.roi || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                  {(profile?.roi || 0) >= 0 ? '+' : ''}{profile?.roi?.toFixed(1) || '0'}%
                </div>
              </StatItem>
              <StatItem>
                <div className="label">Positions</div>
                <div className="value">{profile?.openPositions || 0}</div>
                <div className="sub">Open</div>
              </StatItem>
            </StatsGrid>

            <MenuItems>
              <MenuItem onClick={() => { router.push('/arena/cabinet'); setIsOpen(false); }} data-testid="menu-profile">
                <User /> My Profile
              </MenuItem>
              <MenuItem onClick={() => { router.push('/arena/cabinet?tab=positions'); setIsOpen(false); }} data-testid="menu-positions">
                <Wallet /> My Positions
              </MenuItem>
              <MenuItem className="danger" onClick={handleDisconnect} data-testid="menu-disconnect">
                <LogOut /> Disconnect
              </MenuItem>
            </MenuItems>
          </>
        )}
      </DropdownMenu>
    </DropdownContainer>
  );
};

declare global { interface Window { ethereum?: any; } }
