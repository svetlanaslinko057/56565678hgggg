'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import styled from 'styled-components';
import { useWallet } from '@/lib/wagmi';
import { useArena } from '@/lib/api/ArenaContext';
import { useSearchParams } from 'next/navigation';
import { 
  User, Trophy, Settings, Bell, TrendingUp, TrendingDown, 
  Target, Activity, Award, Flame, Clock, Camera,
  Check, Loader2, AlertCircle, ArrowRight,
  Eye, Wallet, Crown, Medal, Star
} from 'lucide-react';
import { PositionsAPI, NotificationsAPI } from '@/lib/api/arena';
import { useRouter } from 'next/navigation';

// ==================== STYLED COMPONENTS ====================

const PageContainer = styled.div`
  min-height: calc(100vh - 65px);
  background: #f8f9fc;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  margin-bottom: 24px;
  color: white;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Avatar = styled.div<{ $url?: string }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  border: 4px solid rgba(255,255,255,0.2);
`;

const AvatarUploadBtn = styled.label<{ $success?: boolean }>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $success }) => $success ? '#10B981' : '#05A584'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px solid #1e293b;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ $success }) => $success ? '#059669' : '#048a6e'};
    transform: scale(1.1);
  }
  
  input {
    display: none;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UsernameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const Username = styled.div`
  font-size: 24px;
  font-weight: 700;
`;

const EditUsernameBtn = styled.button`
  padding: 4px 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.2);
    color: white;
  }
`;

const WalletAddress = styled.div`
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  font-family: monospace;
  margin-bottom: 12px;
`;

const LevelBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 14px;
  color: #93c5fd;
`;

const QuickStats = styled.div`
  display: flex;
  gap: 32px;

  @media (max-width: 640px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
`;

const QuickStat = styled.div`
  text-align: center;

  .value {
    font-size: 28px;
    font-weight: 700;
  }
  .label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 4px;
  }
`;

// Tab Navigation
const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  background: #fff;
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
  
  ${({ $active }) => $active ? `
    background: #0f172a;
    color: #fff;
  ` : `
    background: transparent;
    color: #738094;
    
    &:hover {
      background: #f5f7fa;
      color: #0f172a;
    }
  `}

  svg {
    width: 16px;
    height: 16px;
  }
`;

const TabBadge = styled.span<{ $color?: string }>`
  background: ${({ $color }) => $color || '#3b82f6'};
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
`;

const TabContent = styled.div`
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Section Cards
const Section = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 20px;
    height: 20px;
    color: #05A584;
  }
`;

// Stats Grid
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
  border-radius: 12px;
  border: 1px solid #eef1f5;
  padding: 16px;
  
  ${({ $variant }) => $variant === 'success' && `border-color: #10B981; background: linear-gradient(135deg, #ECFDF5 0%, #fff 100%);`}
  ${({ $variant }) => $variant === 'danger' && `border-color: #EF4444; background: linear-gradient(135deg, #FEF2F2 0%, #fff 100%);`}
`;

const StatIcon = styled.div<{ $color?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: ${({ $color }) => $color || '#3b82f6'};
  color: white;
`;

const StatValue = styled.div<{ $color?: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${({ $color }) => $color || '#0f172a'};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #738094;
`;

// Positions List
const PositionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PositionCard = styled.div<{ $status?: string }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef1f5;
  cursor: pointer;
  transition: all 0.2s;
  
  border-left: 4px solid ${({ $status }) => {
    switch ($status) {
      case 'won': return '#05A584';
      case 'lost': return '#FF5858';
      case 'listed': return '#FFB800';
      default: return '#3B82F6';
    }
  }};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
`;

const PositionInfo = styled.div`
  flex: 1;
`;

const PositionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
`;

const PositionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetaTag = styled.span<{ $variant?: string }>`
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'yes': return 'background: #E6F7F3; color: #05A584;';
      case 'no': return 'background: #FEE2E2; color: #FF5858;';
      case 'won': return 'background: #D1FAE5; color: #059669;';
      case 'lost': return 'background: #FEE2E2; color: #DC2626;';
      case 'open': return 'background: #DBEAFE; color: #2563EB;';
      default: return 'background: #EEF1F5; color: #738094;';
    }
  }}
`;

const PositionStats = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const PositionStat = styled.div`
  text-align: right;
  
  .label {
    font-size: 10px;
    color: #738094;
    margin-bottom: 2px;
  }
  .value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
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
    &:hover { background: #048a6e; }
  ` : `
    background: #fff;
    color: #738094;
    border: 1px solid #eef1f5;
    &:hover { border-color: #05A584; color: #05A584; }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Leaderboard
const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LeaderboardItem = styled.div<{ $rank: number }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${({ $rank }) => $rank <= 3 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, #fff 100%)' : '#fff'};
  border-radius: 12px;
  border: 1px solid ${({ $rank }) => $rank <= 3 ? 'rgba(251, 191, 36, 0.3)' : '#eef1f5'};
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  
  ${({ $rank }) => {
    switch ($rank) {
      case 1: return 'background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff;';
      case 2: return 'background: linear-gradient(135deg, #C0C0C0, #808080); color: #fff;';
      case 3: return 'background: linear-gradient(135deg, #CD7F32, #8B4513); color: #fff;';
      default: return 'background: #f5f7fa; color: #738094;';
    }
  }}
`;

const LeaderAvatar = styled.div<{ $url?: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const LeaderInfo = styled.div`
  flex: 1;
`;

const LeaderName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const LeaderStats = styled.div`
  font-size: 12px;
  color: #738094;
`;

const LeaderPnL = styled.div<{ $positive?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $positive }) => $positive ? '#05A584' : '#FF5858'};
`;

// Notifications
const NotificationItem = styled.div<{ $unread?: boolean }>`
  padding: 16px;
  background: ${({ $unread }) => $unread ? '#f8fafc' : '#fff'};
  border-radius: 12px;
  border: 1px solid #eef1f5;
  margin-bottom: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #d1d5db;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NotificationIcon = styled.div<{ $variant?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'success': return 'background: #D1FAE5; color: #059669;';
      case 'danger': return 'background: #FEE2E2; color: #DC2626;';
      default: return 'background: #E0F2FE; color: #0284C7;';
    }
  }}
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const NotificationDesc = styled.div`
  font-size: 13px;
  color: #738094;
  margin-top: 4px;
`;

const NotificationTime = styled.div`
  font-size: 11px;
  color: #9ca3af;
`;

// Settings Form
const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #05A584;
    box-shadow: 0 0 0 3px rgba(5, 165, 132, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToggleInfo = styled.div`
  flex: 1;
`;

const ToggleTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 2px;
`;

const ToggleDesc = styled.div`
  font-size: 13px;
  color: #738094;
`;

const Toggle = styled.button<{ $enabled?: boolean }>`
  width: 48px;
  height: 26px;
  border-radius: 13px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  background: ${({ $enabled }) => $enabled ? '#05A584' : '#e5e7eb'};
  
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $enabled }) => $enabled ? '25px' : '3px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: #738094;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #05A584;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #048a6e;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConnectPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 48px;
  background: #fff;
  border-radius: 20px;
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 16px;
    color: #738094;
    margin-bottom: 24px;
  }
`;

// Username Edit Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #f5f7fa;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #738094;
  cursor: pointer;
  
  &:hover {
    background: #eef1f5;
  }
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #05A584;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  
  &:hover {
    background: #048a6e;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// ==================== TYPES ====================

type TabType = 'overview' | 'positions' | 'leaderboard' | 'notifications' | 'settings';

interface ProfileData {
  wallet: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    winrate: number;
    totalStaked: number;
    pnl: number;
  };
  streak: {
    current: number;
    best: number;
  };
}

interface Position {
  _id: string;
  marketId: string;
  outcomeLabel: string;
  side: string;
  stake: number;
  odds: number;
  potentialReturn: number;
  payout?: number;
  status: string;
  createdAt: string;
}

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  username: string;
  avatar?: string;
  pnl: number;
  winrate: number;
  totalBets: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ==================== MAIN COMPONENT ====================

function CabinetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, walletAddress, shortAddress } = useWallet();
  const { refreshNotifications, unreadCount } = useArena();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get initial tab from URL params
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Edit states
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSaveSuccess, setAvatarSaveSuccess] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    email: '',
    notifications: {
      email: true,
      push: true,
      trades: true,
    },
    privacy: {
      showBalance: true,
      showActivity: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const [profileRes, xpRes] = await Promise.all([
        fetch(`${API_URL}/api/profile/me`, {
          headers: { 'x-wallet-address': walletAddress }
        }),
        fetch(`${API_URL}/api/xp/stats/${walletAddress}`),
      ]);
      
      const profileData = await profileRes.json();
      const xpData = await xpRes.json();
      
      const savedProfile = profileData.success ? profileData.data : null;
      
      setProfile({
        wallet: walletAddress,
        username: savedProfile?.username || xpData.data?.username || shortAddress || formatAddress(walletAddress),
        avatar: savedProfile?.avatar || xpData.data?.avatar || '',
        xp: xpData.data?.xp || 0,
        level: xpData.data?.level || 1,
        stats: {
          totalBets: savedProfile?.stats?.totalBets || xpData.data?.totalBets || 0,
          wins: savedProfile?.stats?.wins || xpData.data?.totalWins || 0,
          losses: savedProfile?.stats?.losses || xpData.data?.totalLosses || 0,
          winrate: savedProfile?.stats?.winrate || 0,
          totalStaked: savedProfile?.stats?.totalStaked || 0,
          pnl: savedProfile?.stats?.pnl || xpData.data?.totalPnl || 0,
        },
        streak: {
          current: xpData.data?.currentStreak || savedProfile?.streak?.current || 0,
          best: xpData.data?.bestStreak || savedProfile?.streak?.best || 0,
        },
      });
      setEditUsername(savedProfile?.username || xpData.data?.username || '');
      
      // Load saved settings
      if (savedProfile) {
        setSettings(prev => ({
          ...prev,
          email: savedProfile.email || '',
          notifications: savedProfile.notifications || prev.notifications,
          privacy: savedProfile.privacy || prev.privacy,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Set default profile
      setProfile({
        wallet: walletAddress,
        username: shortAddress || formatAddress(walletAddress),
        avatar: '',
        xp: 0,
        level: 1,
        stats: { totalBets: 0, wins: 0, losses: 0, winrate: 0, totalStaked: 0, pnl: 0 },
        streak: { current: 0, best: 0 },
      });
    }
  }, [walletAddress, shortAddress, API_URL]);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const result = await PositionsAPI.getMyPositions({ limit: 50 });
      setPositions(result.data || []);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/xp/leaderboard?limit=20`);
      const data = await res.json();
      if (data.success && data.data) {
        setLeaderboard(data.data.map((item: any, index: number) => ({
          rank: index + 1,
          wallet: item.wallet,
          username: item.username || `${item.wallet.slice(0, 6)}...${item.wallet.slice(-4)}`,
          avatar: item.avatar,
          pnl: item.totalPnl || 0,
          winrate: item.winrate || 0,
          totalBets: item.totalBets || 0,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [API_URL]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const result = await NotificationsAPI.getNotifications({ limit: 20 });
      setNotifications(result.data.map((n: any) => ({
        id: n._id || n.id,
        type: n.type || 'system',
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        read: n.read || false,
        createdAt: n.createdAt || new Date().toISOString(),
      })));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchPositions(),
        fetchLeaderboard(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };
    
    if (isConnected && walletAddress) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected, walletAddress, fetchProfile, fetchPositions, fetchLeaderboard, fetchNotifications]);

  // Update tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['overview', 'positions', 'leaderboard', 'notifications', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/arena/cabinet?tab=${tab}`, { scroll: false });
  };

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !walletAddress) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    
    setAvatarUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        try {
          // Save avatar directly to profile
          const res = await fetch(`${API_URL}/api/profile/me`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json', 
              'x-wallet-address': walletAddress 
            },
            body: JSON.stringify({ avatar: dataUrl }),
          });
          
          const data = await res.json();
          
          if (data.success) {
            setProfile(prev => prev ? { ...prev, avatar: dataUrl } : prev);
            setAvatarSaveSuccess(true);
            setTimeout(() => setAvatarSaveSuccess(false), 3000);
          } else {
            alert('Failed to save avatar. Please try again.');
          }
        } catch (err) {
          console.error('Failed to save avatar:', err);
          alert('Failed to save avatar. Please try again.');
        }
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarUploading(false);
    }
  };

  // Save username
  const handleSaveUsername = async () => {
    if (!editUsername.trim() || !walletAddress) return;
    
    try {
      await fetch(`${API_URL}/api/profile/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({ username: editUsername.trim() }),
      });
      setProfile(prev => prev ? { ...prev, username: editUsername.trim() } : prev);
      setShowUsernameModal(false);
    } catch (err) {
      console.error('Failed to save username:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await NotificationsAPI.markAsRead(id);
      refreshNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/profile/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress || '' },
        body: JSON.stringify({
          email: settings.email,
          notifications: settings.notifications,
          privacy: settings.privacy,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    setSaving(false);
  };

  // Format helpers
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Not connected
  if (!isConnected || !walletAddress) {
    return (
      <PageContainer>
        <ContentWrapper>
          <ConnectPrompt>
            <Wallet size={48} style={{ color: '#05A584', marginBottom: 16 }} />
            <h2>Connect Your Wallet</h2>
            <p>Connect your wallet to access your profile</p>
          </ConnectPrompt>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const positionsByStatus = {
    active: positions.filter(p => p.status === 'open').length,
    won: positions.filter(p => p.status === 'won').length,
    lost: positions.filter(p => p.status === 'lost').length,
  };

  const getAvatarUrl = () => {
    return profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`;
  };

  return (
    <PageContainer>
      <ContentWrapper>
        {/* Profile Header with Avatar Edit */}
        <ProfileHeader data-testid="profile-header">
          <AvatarWrapper>
            <Avatar $url={getAvatarUrl()}>
              {!profile?.avatar && walletAddress.slice(2, 4).toUpperCase()}
            </Avatar>
            <AvatarUploadBtn $success={avatarSaveSuccess}>
              {avatarUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : avatarSaveSuccess ? (
                <Check size={16} />
              ) : (
                <Camera size={16} />
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                data-testid="avatar-upload"
              />
            </AvatarUploadBtn>
            {avatarSaveSuccess && (
              <div style={{
                position: 'absolute',
                bottom: -28,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#05A584',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                Avatar saved!
              </div>
            )}
          </AvatarWrapper>
          
          <UserInfo>
            <UsernameRow>
              <Username>{profile?.username || shortAddress}</Username>
              <EditUsernameBtn onClick={() => setShowUsernameModal(true)} data-testid="edit-username-btn">
                Edit
              </EditUsernameBtn>
            </UsernameRow>
            <WalletAddress>{walletAddress}</WalletAddress>
            <LevelBadge>
              <Award size={14} />
              Level {profile?.level || 1} • {profile?.xp || 0} XP
            </LevelBadge>
          </UserInfo>
          
          <QuickStats>
            <QuickStat>
              <div className="value">{profile?.stats.totalBets || 0}</div>
              <div className="label">Total Bets</div>
            </QuickStat>
            <QuickStat>
              <div className="value" style={{ color: (profile?.stats.pnl || 0) >= 0 ? '#4ade80' : '#f87171' }}>
                {(profile?.stats.pnl || 0) >= 0 ? '+' : ''}{profile?.stats.pnl || 0}
              </div>
              <div className="label">PnL (USDT)</div>
            </QuickStat>
            <QuickStat>
              <div className="value">{profile?.stats.winrate || 0}%</div>
              <div className="label">Win Rate</div>
            </QuickStat>
            <QuickStat>
              <div className="value">{profile?.streak.current || 0}</div>
              <div className="label">Streak</div>
            </QuickStat>
          </QuickStats>
        </ProfileHeader>

        {/* Tab Navigation */}
        <TabsContainer data-testid="profile-tabs">
          <TabButton 
            $active={activeTab === 'overview'} 
            onClick={() => handleTabChange('overview')}
            data-testid="tab-overview"
          >
            <User size={16} />
            Overview
          </TabButton>
          <TabButton 
            $active={activeTab === 'positions'} 
            onClick={() => handleTabChange('positions')}
            data-testid="tab-positions"
          >
            <Trophy size={16} />
            My Positions
            {positionsByStatus.active > 0 && <TabBadge>{positionsByStatus.active}</TabBadge>}
          </TabButton>
          <TabButton 
            $active={activeTab === 'leaderboard'} 
            onClick={() => handleTabChange('leaderboard')}
            data-testid="tab-leaderboard"
          >
            <Crown size={16} />
            Leaderboard
          </TabButton>
          <TabButton 
            $active={activeTab === 'notifications'} 
            onClick={() => handleTabChange('notifications')}
            data-testid="tab-notifications"
          >
            <Bell size={16} />
            Notifications
            {unreadCount > 0 && <TabBadge $color="#ef4444">{unreadCount}</TabBadge>}
          </TabButton>
          <TabButton 
            $active={activeTab === 'settings'} 
            onClick={() => handleTabChange('settings')}
            data-testid="tab-settings"
          >
            <Settings size={16} />
            Settings
          </TabButton>
        </TabsContainer>

        {/* Tab Content */}
        <TabContent>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <StatsGrid>
                <StatCard $variant={profile?.stats.winrate >= 50 ? 'success' : 'neutral'}>
                  <StatIcon $color={profile?.stats.winrate >= 50 ? '#10B981' : '#3b82f6'}>
                    <Target size={18} />
                  </StatIcon>
                  <StatValue $color={profile?.stats.winrate >= 50 ? '#10B981' : undefined}>
                    {profile?.stats.winrate || 0}%
                  </StatValue>
                  <StatLabel>Win Rate</StatLabel>
                </StatCard>
                
                <StatCard $variant={(profile?.stats.pnl || 0) > 0 ? 'success' : (profile?.stats.pnl || 0) < 0 ? 'danger' : 'neutral'}>
                  <StatIcon $color={(profile?.stats.pnl || 0) >= 0 ? '#10B981' : '#EF4444'}>
                    {(profile?.stats.pnl || 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </StatIcon>
                  <StatValue $color={(profile?.stats.pnl || 0) > 0 ? '#10B981' : (profile?.stats.pnl || 0) < 0 ? '#EF4444' : undefined}>
                    {(profile?.stats.pnl || 0) >= 0 ? '+' : ''}{profile?.stats.pnl || 0} USDT
                  </StatValue>
                  <StatLabel>Total PnL</StatLabel>
                </StatCard>
                
                <StatCard>
                  <StatIcon $color="#8b5cf6">
                    <Activity size={18} />
                  </StatIcon>
                  <StatValue>{profile?.stats.totalBets || 0}</StatValue>
                  <StatLabel>Total Bets</StatLabel>
                </StatCard>
                
                <StatCard>
                  <StatIcon $color="#f59e0b">
                    <Flame size={18} />
                  </StatIcon>
                  <StatValue>{profile?.streak.current || 0}</StatValue>
                  <StatLabel>Current Streak</StatLabel>
                </StatCard>
              </StatsGrid>

              {/* Recent Positions */}
              <Section>
                <SectionTitle>
                  <Trophy />
                  Recent Positions
                </SectionTitle>
                
                {positions.length === 0 ? (
                  <EmptyState>
                    <Trophy />
                    <h3>No positions yet</h3>
                    <p>Place your first bet to start trading</p>
                  </EmptyState>
                ) : (
                  <PositionsList>
                    {positions.slice(0, 5).map(position => (
                      <PositionCard 
                        key={position._id} 
                        $status={position.status}
                        onClick={() => router.push(`/arena/${position.marketId}`)}
                        data-testid={`position-${position._id}`}
                      >
                        <PositionInfo>
                          <PositionTitle>{position.outcomeLabel}</PositionTitle>
                          <PositionMeta>
                            <MetaTag $variant={position.side?.toLowerCase()}>{position.side}</MetaTag>
                            <MetaTag $variant={position.status}>{position.status.toUpperCase()}</MetaTag>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>
                              <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                              {formatDate(position.createdAt)}
                            </span>
                          </PositionMeta>
                        </PositionInfo>
                        
                        <PositionStats>
                          <PositionStat>
                            <div className="label">Stake</div>
                            <div className="value">${position.stake}</div>
                          </PositionStat>
                          <PositionStat>
                            <div className="label">Potential</div>
                            <div className="value" style={{ color: '#05A584' }}>
                              ${position.potentialReturn?.toFixed(2) || position.stake * 2}
                            </div>
                          </PositionStat>
                        </PositionStats>
                        
                        <ArrowRight size={16} color="#9ca3af" />
                      </PositionCard>
                    ))}
                  </PositionsList>
                )}
              </Section>
            </>
          )}

          {/* POSITIONS TAB */}
          {activeTab === 'positions' && (
            <Section>
              <SectionTitle>
                <Trophy />
                All Positions ({positions.length})
              </SectionTitle>
              
              {/* Position filters summary */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <MetaTag $variant="open">Active: {positionsByStatus.active}</MetaTag>
                <MetaTag $variant="won">Won: {positionsByStatus.won}</MetaTag>
                <MetaTag $variant="lost">Lost: {positionsByStatus.lost}</MetaTag>
              </div>
              
              {positions.length === 0 ? (
                <EmptyState>
                  <Trophy />
                  <h3>No positions yet</h3>
                  <p>Start trading to see your positions here</p>
                </EmptyState>
              ) : (
                <PositionsList>
                  {positions.map(position => (
                    <PositionCard 
                      key={position._id} 
                      $status={position.status}
                      onClick={() => router.push(`/arena/${position.marketId}`)}
                      data-testid={`position-${position._id}`}
                    >
                      <PositionInfo>
                        <PositionTitle>{position.outcomeLabel}</PositionTitle>
                        <PositionMeta>
                          <MetaTag $variant={position.side?.toLowerCase()}>{position.side}</MetaTag>
                          <MetaTag $variant={position.status}>{position.status.toUpperCase()}</MetaTag>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {formatDate(position.createdAt)}
                          </span>
                        </PositionMeta>
                      </PositionInfo>
                      
                      <PositionStats>
                        <PositionStat>
                          <div className="label">Stake</div>
                          <div className="value">${position.stake}</div>
                        </PositionStat>
                        <PositionStat>
                          <div className="label">Odds</div>
                          <div className="value">{position.odds?.toFixed(2)}x</div>
                        </PositionStat>
                        <PositionStat>
                          <div className="label">{position.status === 'won' ? 'Payout' : 'Potential'}</div>
                          <div className="value" style={{ color: '#05A584' }}>
                            ${(position.payout || position.potentialReturn)?.toFixed(2)}
                          </div>
                        </PositionStat>
                      </PositionStats>
                      
                      {position.status === 'won' && (
                        <ActionButton $variant="primary" onClick={(e) => e.stopPropagation()}>
                          Claim
                        </ActionButton>
                      )}
                      
                      <ArrowRight size={16} color="#9ca3af" />
                    </PositionCard>
                  ))}
                </PositionsList>
              )}
            </Section>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <Section>
              <SectionTitle>
                <Crown />
                Top Traders
              </SectionTitle>
              
              {leaderboard.length === 0 ? (
                <EmptyState>
                  <Crown />
                  <h3>No leaderboard data</h3>
                  <p>Be the first to make it to the top!</p>
                </EmptyState>
              ) : (
                <LeaderboardList>
                  {leaderboard.map(entry => (
                    <LeaderboardItem key={entry.wallet} $rank={entry.rank} data-testid={`leader-${entry.rank}`}>
                      <RankBadge $rank={entry.rank}>
                        {entry.rank <= 3 ? (
                          entry.rank === 1 ? <Crown size={18} /> : 
                          entry.rank === 2 ? <Medal size={18} /> : 
                          <Star size={18} />
                        ) : entry.rank}
                      </RankBadge>
                      
                      <LeaderAvatar $url={entry.avatar}>
                        {!entry.avatar && entry.wallet.slice(2, 4).toUpperCase()}
                      </LeaderAvatar>
                      
                      <LeaderInfo>
                        <LeaderName>{entry.username}</LeaderName>
                        <LeaderStats>
                          {entry.totalBets} bets • {entry.winrate}% win rate
                        </LeaderStats>
                      </LeaderInfo>
                      
                      <LeaderPnL $positive={entry.pnl >= 0}>
                        {entry.pnl >= 0 ? '+' : ''}{entry.pnl} USDT
                      </LeaderPnL>
                    </LeaderboardItem>
                  ))}
                </LeaderboardList>
              )}
            </Section>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <Section>
              <SectionTitle>
                <Bell />
                Notifications
              </SectionTitle>
              
              {notifications.length === 0 ? (
                <EmptyState>
                  <Bell />
                  <h3>No notifications</h3>
                  <p>You're all caught up!</p>
                </EmptyState>
              ) : (
                <>
                  {notifications.map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      $unread={!notification.read}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <NotificationHeader>
                        <NotificationIcon 
                          $variant={
                            notification.type.includes('won') ? 'success' : 
                            notification.type.includes('lost') ? 'danger' : 
                            'info'
                          }
                        >
                          {notification.type.includes('won') ? <Check size={18} /> :
                           notification.type.includes('lost') ? <AlertCircle size={18} /> :
                           <Bell size={18} />}
                        </NotificationIcon>
                        <NotificationContent>
                          <NotificationTitle>{notification.title}</NotificationTitle>
                          <NotificationDesc>{notification.message}</NotificationDesc>
                        </NotificationContent>
                        <NotificationTime>{timeAgo(notification.createdAt)}</NotificationTime>
                      </NotificationHeader>
                    </NotificationItem>
                  ))}
                </>
              )}
            </Section>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <>
              {saveSuccess && (
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#D1FAE5', 
                  borderRadius: 10, 
                  color: '#059669',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Check size={18} />
                  Settings saved successfully
                </div>
              )}
              
              <Section>
                <SectionTitle>
                  <User />
                  Profile Settings
                </SectionTitle>
                
                <FormGroup>
                  <Label>Email (for notifications)</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="your@email.com"
                    data-testid="settings-email"
                  />
                </FormGroup>
              </Section>

              <Section>
                <SectionTitle>
                  <Bell />
                  Notification Preferences
                </SectionTitle>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Email Notifications</ToggleTitle>
                    <ToggleDesc>Receive important updates via email</ToggleDesc>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.email}
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: !settings.notifications.email }
                    })}
                    data-testid="toggle-email"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Push Notifications</ToggleTitle>
                    <ToggleDesc>Get instant alerts in your browser</ToggleDesc>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.push}
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: !settings.notifications.push }
                    })}
                    data-testid="toggle-push"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Trade Alerts</ToggleTitle>
                    <ToggleDesc>Notifications about your positions</ToggleDesc>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.trades}
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, trades: !settings.notifications.trades }
                    })}
                    data-testid="toggle-trades"
                  />
                </ToggleRow>
              </Section>

              <Section>
                <SectionTitle>
                  <Eye />
                  Privacy
                </SectionTitle>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Show Balance</ToggleTitle>
                    <ToggleDesc>Display your portfolio value publicly</ToggleDesc>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.privacy.showBalance}
                    onClick={() => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showBalance: !settings.privacy.showBalance }
                    })}
                    data-testid="toggle-balance"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Show Activity</ToggleTitle>
                    <ToggleDesc>Let others see your recent activity</ToggleDesc>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.privacy.showActivity}
                    onClick={() => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showActivity: !settings.privacy.showActivity }
                    })}
                    data-testid="toggle-activity"
                  />
                </ToggleRow>
              </Section>

              <SaveButton onClick={saveSettings} disabled={saving} data-testid="save-settings-btn">
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save Changes
                  </>
                )}
              </SaveButton>
            </>
          )}
        </TabContent>
      </ContentWrapper>

      {/* Username Edit Modal */}
      {showUsernameModal && (
        <ModalOverlay onClick={() => setShowUsernameModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Edit Username</ModalTitle>
            <FormGroup>
              <Label>Username</Label>
              <Input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={20}
                data-testid="username-input"
              />
            </FormGroup>
            <ModalButtons>
              <CancelButton onClick={() => setShowUsernameModal(false)}>Cancel</CancelButton>
              <ConfirmButton onClick={handleSaveUsername} disabled={!editUsername.trim()}>
                Save
              </ConfirmButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default function CabinetPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <CabinetPageContent />
    </Suspense>
  );
}
