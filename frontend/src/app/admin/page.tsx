'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Target, 
  Swords, 
  Trophy,
  Activity,
  Settings,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Lock,
  Check,
  X,
  RefreshCw,
  FileText,
  DollarSign,
  Flame,
} from 'lucide-react';
import { 
  AdminStatsAPI, 
  AdminMarketsAPI, 
  AdminUsersAPI,
  AdminPositionsAPI,
  AdminDuelsAPI,
  AdminSeasonsAPI,
  AdminActivityAPI,
  AdminRiskAPI,
} from '@/lib/api/adminApi';

// ==================== Styled Components ====================

const PageWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f9fafb;
`;

const Sidebar = styled.aside`
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 20px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
`;

const Logo = styled.div`
  padding: 0 24px 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  span {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavSection = styled.nav`
  padding: 0 12px;
`;

const NavItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active }) => $active ? '#6366f1' : '#64748b'};
  background: ${({ $active }) => $active ? 'rgba(99, 102, 241, 0.08)' : 'transparent'};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  &:hover {
    background: ${({ $active }) => $active ? 'rgba(99, 102, 241, 0.12)' : '#f1f5f9'};
    color: ${({ $active }) => $active ? '#6366f1' : '#0f172a'};
  }
  
  svg {
    flex-shrink: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 260px;
  padding: 24px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #0f172a;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f8fafc;
    border-color: #6366f1;
    color: #6366f1;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div<{ $color?: string }>`
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  
  .label {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 28px;
    font-weight: 700;
    color: ${({ $color }) => $color || '#0f172a'};
  }
  
  .change {
    font-size: 12px;
    color: #10b981;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const TableCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 24px;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 12px 20px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }
  
  td {
    padding: 14px 20px;
    font-size: 14px;
    color: #0f172a;
    border-bottom: 1px solid #f1f5f9;
  }
  
  tr:hover {
    background: #f8fafc;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  ${({ $status }) => {
    switch ($status) {
      case 'published':
      case 'active':
        return `background: #dcfce7; color: #16a34a;`;
      case 'locked':
        return `background: #fef3c7; color: #d97706;`;
      case 'resolved':
        return `background: #dbeafe; color: #2563eb;`;
      case 'pending':
      case 'draft':
        return `background: #f3f4f6; color: #6b7280;`;
      case 'canceled':
        return `background: #fee2e2; color: #dc2626;`;
      default:
        return `background: #f3f4f6; color: #6b7280;`;
    }
  }}
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `background: #6366f1; color: white; border: none;
          &:hover { background: #4f46e5; }`;
      case 'danger':
        return `background: #fee2e2; color: #dc2626; border: none;
          &:hover { background: #fecaca; }`;
      case 'warning':
        return `background: #fef3c7; color: #d97706; border: none;
          &:hover { background: #fde68a; }`;
      default:
        return `background: #f3f4f6; color: #374151; border: none;
          &:hover { background: #e5e7eb; }`;
    }
  }}
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const RiskBadge = styled.span<{ $level: string }>`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  ${({ $level }) => {
    switch ($level) {
      case 'HIGH':
        return `background: #fee2e2; color: #dc2626;`;
      case 'MEDIUM':
        return `background: #fef3c7; color: #d97706;`;
      default:
        return `background: #dcfce7; color: #16a34a;`;
    }
  }}
`;

// ==================== Components ====================

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'markets', label: 'Markets', icon: BarChart3 },
  { id: 'resolution', label: 'Resolution', icon: CheckCircle },
  { id: 'voting', label: 'Voting Control', icon: Users },
  { id: 'drafts', label: 'Market Drafts', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'positions', label: 'Positions', icon: Target },
  { id: 'duels', label: 'Duels', icon: Swords },
  { id: 'seasons', label: 'Seasons', icon: Trophy },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'risk', label: 'Risk Monitor', icon: AlertTriangle },
  { id: 'ticker', label: 'Ticker Settings', icon: TrendingUp, href: '/admin/ticker' },
];

// ==================== Main Component ====================

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [duels, setDuels] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [resolutionMarkets, setResolutionMarkets] = useState<any[]>([]);
  const [whales, setWhales] = useState<any[]>([]);
  const [skewedMarkets, setSkewedMarkets] = useState<any[]>([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState<any[]>([]);
  const [disputedMarkets, setDisputedMarkets] = useState<any[]>([]);
  const [votingStats, setVotingStats] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, marketsRes, usersRes, positionsRes, duelsRes, seasonsRes, activityRes, riskRes, draftsRes, resolutionRes, whalesRes, skewedRes, suspiciousRes, disputedRes, votingStatsRes] = await Promise.all([
        AdminStatsAPI.getStats(),
        AdminMarketsAPI.getMarkets({ limit: 20 }),
        AdminUsersAPI.getUsers({ limit: 20 }),
        AdminPositionsAPI.getPositions({ limit: 20 }),
        AdminDuelsAPI.getDuels({ limit: 20 }),
        AdminSeasonsAPI.getSeasons(),
        AdminActivityAPI.getActivity(30),
        AdminRiskAPI.getRiskMonitor(),
        fetchPendingDrafts(),
        fetchResolutionMarkets(),
        fetchWhales(),
        fetchSkewedMarkets(),
        fetchSuspiciousUsers(),
        fetchDisputedMarkets(),
        fetchVotingStats(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (marketsRes.success) setMarkets(marketsRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (positionsRes.success) setPositions(positionsRes.data || []);
      if (duelsRes.success) setDuels(duelsRes.data || []);
      if (seasonsRes.success) setSeasons(seasonsRes.data || []);
      if (activityRes.success) setActivity(activityRes.data || []);
      if (riskRes.success) setRiskData(riskRes.data || []);
      setDrafts(draftsRes || []);
      setResolutionMarkets(resolutionRes || []);
      setWhales(whalesRes || []);
      setSkewedMarkets(skewedRes || []);
      setSuspiciousUsers(suspiciousRes || []);
      setDisputedMarkets(disputedRes || []);
      setVotingStats(votingStatsRes || {});
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchResolutionMarkets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/resolution/pending`, {
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch { return []; }
  };

  const fetchWhales = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/risk/whales`, {
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch { return []; }
  };

  const fetchSkewedMarkets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/risk/skewed`, {
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch { return []; }
  };

  const fetchSuspiciousUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/risk/suspicious`, {
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch { return []; }
  };

  const fetchDisputedMarkets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/markets?status=disputed`, {
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      return data.success ? (data.data || []) : [];
    } catch { return []; }
  };

  const fetchVotingStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/voting/stats`);
      const data = await res.json();
      return data.success ? data.data : {};
    } catch { return {}; }
  };

  const handleStartVoting = async (marketId: string, hours: number = 24) => {
    if (!confirm(`Start voting for this market? Duration: ${hours} hours`)) return;
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/${marketId}/start-voting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
        body: JSON.stringify({ durationHours: hours }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Voting started successfully!');
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalizeVoting = async (marketId: string) => {
    if (!confirm('Finalize voting now? This will resolve the market based on vote results.')) return;
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/${marketId}/finalize-voting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      if (data.success) {
        alert(`Voting finalized! Result: ${data.data?.result?.toUpperCase()}\nYES: ${data.data?.votes?.yes}, NO: ${data.data?.votes?.no}`);
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelVoting = async (marketId: string) => {
    if (!confirm('Cancel voting? All votes will be discarded.')) return;
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/${marketId}/cancel-voting`, {
        method: 'POST',
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      if (data.success) {
        alert('Voting canceled');
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const fetchPendingDrafts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/drafts/pending`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  };

  const handleApproveDraft = async (draftId: string) => {
    if (!confirm('Approve this market? Stake will be returned to creator.')) return;
    setActionLoading(draftId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/drafts/${draftId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      if (data.success) {
        alert(`Market approved! Published market ID: ${data.data?.marketId}`);
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDraft = async (draftId: string, burnStake: boolean) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setActionLoading(draftId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/drafts/${draftId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
        body: JSON.stringify({ reason, burnStake }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Draft rejected. Stake ${burnStake ? 'burned' : 'returned'}.`);
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLockMarket = async (id: string) => {
    if (!confirm('Lock this market? Betting will be disabled.')) return;
    const res = await AdminMarketsAPI.lockMarket(id);
    if (res.success) fetchData();
  };

  const handleResolveMarket = async (id: string, market: any) => {
    const outcome = prompt(`Enter winning outcome (${market.outcomes?.map((o: any) => o.id).join(', ')}):`);
    if (!outcome) return;
    const res = await AdminMarketsAPI.resolveMarket(id, outcome);
    if (res.success) fetchData();
  };

  // Resolution Center actions
  const handleSimulate = async (marketId: string, outcomeId: string) => {
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/markets/${marketId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
        body: JSON.stringify({ outcomeId }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
      } else {
        alert(`Simulation failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmOracle = async (marketId: string, outcomeId: string) => {
    if (!confirm(`Confirm outcome "${outcomeId}" as oracle result?`)) return;
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/markets/${marketId}/confirm-oracle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
        body: JSON.stringify({ outcomeId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Oracle result confirmed. You can now finalize.');
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleOverride = async (marketId: string) => {
    const market = resolutionMarkets.find(m => m.id === marketId);
    const outcomeId = prompt(`Override to which outcome? (${market?.outcomes?.map((o: any) => o.id).join(', ')}):`);
    if (!outcomeId) return;
    const reason = prompt('Enter override reason:');
    if (!reason) return;

    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/markets/${marketId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
        body: JSON.stringify({ outcomeId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Outcome overridden. You can now finalize.');
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalize = async (marketId: string) => {
    if (!confirm('Finalize resolution? This will trigger all payouts and cannot be undone.')) return;
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/markets/${marketId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      if (data.success) {
        alert(`Resolution finalized!\nWinners: ${data.data?.resolution?.winnersCount}\nLosers: ${data.data?.resolution?.losersCount}\nPayout: $${data.data?.resolution?.payoutTotal?.toFixed(2)}`);
        setSimulationResult(null);
        fetchData();
      } else {
        alert(`Failed: ${data.message || data.error}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseMarket = async (marketId: string) => {
    if (!confirm('Pause this market? Betting will be disabled immediately.')) return;
    setActionLoading(marketId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/markets/${marketId}/pause`, {
        method: 'POST',
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      if (data.success) fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleFreezeUser = async (wallet: string) => {
    if (!confirm(`Freeze user ${wallet}?`)) return;
    setActionLoading(wallet);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${wallet}/freeze`, {
        method: 'POST',
        headers: { 'X-Admin-Wallet': 'admin' },
      });
      const data = await res.json();
      if (data.success) {
        alert('User frozen');
        fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatWallet = (wallet: string) => {
    if (!wallet || wallet.length < 10) return wallet || 'N/A';
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num}`;
  };

  return (
    <PageWrapper>
      <Sidebar>
        <Logo>
          <h1>
            <LayoutDashboard size={24} />
            <span>FOMO</span> Admin
          </h1>
        </Logo>
        <NavSection>
          {navItems.map((item) => (
            item.href ? (
              <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                <NavItem
                  $active={false}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavItem>
              </Link>
            ) : (
              <NavItem
                key={item.id}
                $active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                data-testid={`nav-${item.id}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavItem>
            )
          ))}
        </NavSection>
      </Sidebar>

      <MainContent>
        <Header>
          <h2>{navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}</h2>
          <RefreshButton onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </RefreshButton>
        </Header>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            <StatsGrid>
              <StatCard $color="#6366f1">
                <div className="label">Total Users</div>
                <div className="value" data-testid="stat-users">{stats?.totalUsers || 0}</div>
              </StatCard>
              <StatCard $color="#10b981">
                <div className="label">Active Markets</div>
                <div className="value" data-testid="stat-markets">{stats?.activeMarkets || 0}</div>
              </StatCard>
              <StatCard $color="#f59e0b">
                <div className="label">Total Volume</div>
                <div className="value" data-testid="stat-volume">{formatNumber(stats?.totalVolume || 0)}</div>
              </StatCard>
              <StatCard $color="#ef4444">
                <div className="label">Active Duels</div>
                <div className="value" data-testid="stat-duels">{stats?.activeDuels || 0}</div>
              </StatCard>
              <StatCard $color="#8b5cf6">
                <div className="label">Open Positions</div>
                <div className="value" data-testid="stat-positions">{stats?.openPositions || 0}</div>
              </StatCard>
              <StatCard $color="#06b6d4">
                <div className="label">24h Activity</div>
                <div className="value" data-testid="stat-activity">{stats?.recentActivity || 0}</div>
              </StatCard>
            </StatsGrid>

            <TableCard>
              <TableHeader>
                <h3>Recent Markets</h3>
              </TableHeader>
              <Table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Category</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th>Close Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.slice(0, 5).map((market) => (
                    <tr key={market._id || market.id}>
                      <td style={{ maxWidth: 250 }}>{market.question?.slice(0, 40)}...</td>
                      <td>{market.category}</td>
                      <td>{formatNumber(market.totalVolume || 0)}</td>
                      <td><StatusBadge $status={market.status}>{market.status}</StatusBadge></td>
                      <td>{formatDate(market.closeTime)}</td>
                      <td>
                        <ActionGroup>
                          <ActionButton><Eye size={14} /></ActionButton>
                          {market.status === 'published' && (
                            <ActionButton $variant="warning" onClick={() => handleLockMarket(market._id || market.id)}>
                              <Lock size={14} />
                            </ActionButton>
                          )}
                        </ActionGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableCard>
          </>
        )}

        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <TableCard>
            <TableHeader>
              <h3>All Markets ({markets.length})</h3>
            </TableHeader>
            <Table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Volume</th>
                  <th>Bets</th>
                  <th>Status</th>
                  <th>Close Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((market) => (
                  <tr key={market._id || market.id}>
                    <td style={{ maxWidth: 200 }}>{market.question?.slice(0, 35)}...</td>
                    <td>{market.type}</td>
                    <td>{market.category}</td>
                    <td>{formatNumber(market.totalVolume || 0)}</td>
                    <td>{market.totalBets || 0}</td>
                    <td><StatusBadge $status={market.status}>{market.status}</StatusBadge></td>
                    <td>{formatDate(market.closeTime)}</td>
                    <td>
                      <ActionGroup>
                        {market.status === 'published' && (
                          <ActionButton $variant="warning" onClick={() => handleLockMarket(market._id || market.id)}>
                            <Lock size={14} /> Lock
                          </ActionButton>
                        )}
                        {market.status === 'locked' && (
                          <ActionButton $variant="primary" onClick={() => handleResolveMarket(market._id || market.id, market)}>
                            <Check size={14} /> Resolve
                          </ActionButton>
                        )}
                      </ActionGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* Market Drafts Tab */}
        {activeTab === 'drafts' && (
          <>
            <StatsGrid>
              <StatCard $color="#f59e0b">
                <div className="label">Pending Review</div>
                <div className="value">{drafts.filter(d => d.status === 'review').length}</div>
              </StatCard>
              <StatCard $color="#10b981">
                <div className="label">Total Drafts</div>
                <div className="value">{drafts.length}</div>
              </StatCard>
              <StatCard $color="#6366f1">
                <div className="label">Total Stake Locked</div>
                <div className="value">{formatNumber(drafts.reduce((sum, d) => sum + (d.stakeAmount || 0), 0))}</div>
              </StatCard>
            </StatsGrid>
            
            <TableCard>
              <TableHeader>
                <h3>Market Drafts for Moderation</h3>
              </TableHeader>
              <Table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Creator</th>
                    <th>Type</th>
                    <th>Stake</th>
                    <th>Resolution</th>
                    <th>Close Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
                        No pending drafts to review
                      </td>
                    </tr>
                  ) : (
                    drafts.map((draft) => (
                      <tr key={draft._id}>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ fontWeight: 500 }}>{draft.title?.slice(0, 40)}...</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {draft.outcomes?.length || 2} outcomes
                          </div>
                        </td>
                        <td>{formatWallet(draft.creatorWallet)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{draft.type || 'single'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <DollarSign size={14} color="#f59e0b" />
                            ${draft.stakeAmount || 100}
                          </div>
                          <StatusBadge $status={draft.stakeStatus === 'locked' ? 'pending' : draft.stakeStatus}>
                            {draft.stakeStatus}
                          </StatusBadge>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {draft.resolutionType || 'manual'}
                          {draft.oracleConfig && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {draft.oracleConfig.asset} {draft.oracleConfig.operator} {draft.oracleConfig.value}
                            </div>
                          )}
                        </td>
                        <td>{formatDate(draft.closeTime)}</td>
                        <td>
                          <StatusBadge $status={draft.status === 'review' ? 'pending' : draft.status}>
                            {draft.status}
                          </StatusBadge>
                        </td>
                        <td>
                          <ActionGroup>
                            {draft.status === 'review' && (
                              <>
                                <ActionButton 
                                  $variant="primary" 
                                  onClick={() => handleApproveDraft(draft._id)}
                                  disabled={actionLoading === draft._id}
                                >
                                  <Check size={14} />
                                  {actionLoading === draft._id ? '...' : 'Approve'}
                                </ActionButton>
                                <ActionButton 
                                  onClick={() => handleRejectDraft(draft._id, false)}
                                  disabled={actionLoading === draft._id}
                                >
                                  <X size={14} />
                                  Reject
                                </ActionButton>
                                <ActionButton 
                                  $variant="danger" 
                                  onClick={() => handleRejectDraft(draft._id, true)}
                                  disabled={actionLoading === draft._id}
                                  title="Reject and burn stake (for spam)"
                                >
                                  <Flame size={14} />
                                  Burn
                                </ActionButton>
                              </>
                            )}
                          </ActionGroup>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          </>
        )}

        {/* Resolution Center Tab */}
        {activeTab === 'resolution' && (
          <>
            <StatsGrid>
              <StatCard $color="#f59e0b">
                <div className="label">Awaiting Admin Confirmation</div>
                <div className="value" data-testid="resolution-pending">{resolutionMarkets.length}</div>
              </StatCard>
              <StatCard $color="#ef4444">
                <div className="label">Overdue (&gt;24h)</div>
                <div className="value">{resolutionMarkets.filter(m => m.isOverdue).length}</div>
              </StatCard>
              <StatCard $color="#6366f1">
                <div className="label">Total Stake at Risk</div>
                <div className="value">{formatNumber(resolutionMarkets.reduce((sum, m) => sum + (m.totalStake || 0), 0))}</div>
              </StatCard>
            </StatsGrid>

            {/* Info Banner */}
            <div style={{ 
              background: '#dbeafe', 
              border: '1px solid #3b82f6', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 20,
              color: '#1e40af'
            }}>
              <strong>Resolution Flow:</strong> Markets auto-lock when event date passes → Admin confirms winning outcome → Smart contract executes payouts
            </div>

            {/* Simulation Result Modal */}
            {simulationResult && (
              <TableCard style={{ marginBottom: 20, background: '#fef3c7', border: '1px solid #f59e0b' }}>
                <TableHeader style={{ background: '#fef3c7' }}>
                  <h3>Simulation Result: {simulationResult.marketTitle?.slice(0, 40)}...</h3>
                  <ActionButton onClick={() => setSimulationResult(null)}>Close</ActionButton>
                </TableHeader>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Simulated Outcome</div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{simulationResult.simulatedOutcome?.label}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Total Pool</div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>${simulationResult.summary?.totalStake?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Winners Payout</div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: '#059669' }}>${simulationResult.summary?.payoutTotal?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Platform Fee</div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>${simulationResult.summary?.fees?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: '#d1fae5', padding: '8px 16px', borderRadius: 8 }}>
                      <span style={{ fontWeight: 600, color: '#059669' }}>{simulationResult.winningPositions}</span> winners
                    </div>
                    <div style={{ background: '#fee2e2', padding: '8px 16px', borderRadius: 8 }}>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>{simulationResult.losingPositions}</span> losers
                    </div>
                    {simulationResult.warnings?.length > 0 && (
                      <div style={{ background: '#fef3c7', padding: '8px 16px', borderRadius: 8, color: '#92400e' }}>
                        {simulationResult.warnings[0]}
                      </div>
                    )}
                  </div>
                </div>
              </TableCard>
            )}
            
            <TableCard>
              <TableHeader>
                <h3>Markets Awaiting Admin Confirmation</h3>
              </TableHeader>
              <Table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Event Date</th>
                    <th>Positions</th>
                    <th>Total Stake</th>
                    <th>Outcomes</th>
                    <th>Confirmed Result</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resolutionMarkets.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
                        No markets pending resolution
                      </td>
                    </tr>
                  ) : (
                    resolutionMarkets.map((market) => (
                      <tr key={market.id} style={market.isOverdue ? { background: '#fef2f2' } : {}}>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ fontWeight: 500 }}>{market.title?.slice(0, 35)}...</div>
                          {market.isOverdue && (
                            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>OVERDUE</span>
                          )}
                        </td>
                        <td>{formatDate(market.closeTime)}</td>
                        <td>{market.positionsCount}</td>
                        <td>${market.totalStake?.toFixed(0)}</td>
                        <td>
                          {market.outcomes?.map((o: any) => (
                            <span key={o.id} style={{ 
                              display: 'inline-block', 
                              margin: '2px 4px 2px 0', 
                              padding: '2px 8px', 
                              background: market.confirmedOutcome === o.id ? '#d1fae5' : '#f3f4f6',
                              borderRadius: 4,
                              fontSize: 12
                            }}>
                              {o.label || o.id}
                            </span>
                          ))}
                        </td>
                        <td>
                          {market.confirmedOutcome ? (
                            <StatusBadge $status="resolved">✓ {market.confirmedOutcome}</StatusBadge>
                          ) : market.oracleResult ? (
                            <StatusBadge $status="pending">Oracle: {market.oracleResult}</StatusBadge>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Awaiting</span>
                          )}
                        </td>
                        <td><StatusBadge $status={market.status}>{market.status}</StatusBadge></td>
                        <td>
                          <ActionGroup style={{ flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {market.outcomes?.map((o: any) => (
                                <ActionButton 
                                  key={o.id}
                                  onClick={() => handleSimulate(market.id, o.id)}
                                  disabled={actionLoading === market.id}
                                  title={`Simulate ${o.label}`}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                  Sim {o.label?.slice(0, 3)}
                                </ActionButton>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {!market.confirmedOutcome && market.outcomes?.map((o: any) => (
                                <ActionButton 
                                  key={o.id}
                                  $variant="primary"
                                  onClick={() => handleConfirmOracle(market.id, o.id)}
                                  disabled={actionLoading === market.id}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                  ✓ {o.label?.slice(0, 3)}
                                </ActionButton>
                              ))}
                              <ActionButton 
                                onClick={() => handleOverride(market.id)}
                                disabled={actionLoading === market.id}
                                style={{ fontSize: 11, padding: '4px 8px' }}
                              >
                                Override
                              </ActionButton>
                            </div>
                            {market.confirmedOutcome && (
                              <ActionButton 
                                $variant="primary"
                                onClick={() => handleFinalize(market.id)}
                                disabled={actionLoading === market.id}
                                style={{ background: '#059669' }}
                              >
                                {actionLoading === market.id ? '...' : 'FINALIZE'}
                              </ActionButton>
                            )}
                          </ActionGroup>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          </>
        )}

        {/* Voting Control Tab */}
        {activeTab === 'voting' && (
          <>
            <StatsGrid>
              <StatCard $color="#f59e0b">
                <div className="label">Active Votings</div>
                <div className="value" data-testid="voting-active">{votingStats?.activeVotings || 0}</div>
              </StatCard>
              <StatCard $color="#6366f1">
                <div className="label">Total Votes Cast</div>
                <div className="value">{votingStats?.totalVotesCast || 0}</div>
              </StatCard>
              <StatCard $color="#10b981">
                <div className="label">Finalized by Voting</div>
                <div className="value">{votingStats?.marketsFinalizedByVoting || 0}</div>
              </StatCard>
              <StatCard $color="#ef4444">
                <div className="label">Disputed Markets</div>
                <div className="value">{disputedMarkets.length}</div>
              </StatCard>
            </StatsGrid>

            {/* Info Banner */}
            <div style={{ 
              background: '#dbeafe', 
              border: '1px solid #3b82f6', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 20,
              color: '#1e40af'
            }}>
              <strong>Voting System V2:</strong> Disputed markets can be resolved by community voting. 
              NFT holders can vote YES/NO. Voting period is configurable (default 24h).
              After voting ends, market resolves based on majority vote.
            </div>

            <TableCard>
              <TableHeader>
                <h3>Disputed Markets - Voting Control</h3>
              </TableHeader>
              <Table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Status</th>
                    <th>Dispute Reason</th>
                    <th>Voting Status</th>
                    <th>YES / NO</th>
                    <th>Ends At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputedMarkets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
                        No disputed markets
                      </td>
                    </tr>
                  ) : (
                    disputedMarkets.map((market) => (
                      <tr key={market._id || market.id}>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ fontWeight: 500 }}>{market.question?.slice(0, 35)}...</div>
                        </td>
                        <td><StatusBadge $status={market.status}>{market.status}</StatusBadge></td>
                        <td style={{ maxWidth: 150, fontSize: 12 }}>
                          {market.disputeReason?.slice(0, 50) || 'No reason provided'}...
                        </td>
                        <td>
                          <StatusBadge $status={market.voting?.status === 'active' ? 'published' : market.voting?.status || 'pending'}>
                            {market.voting?.status || 'Not started'}
                          </StatusBadge>
                        </td>
                        <td>
                          {market.voting?.status === 'active' || market.voting?.status === 'finished' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{ color: '#059669', fontWeight: 600 }}>
                                YES: {market.voting?.yesVotes || 0}
                              </span>
                              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                NO: {market.voting?.noVotes || 0}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td>
                          {market.voting?.endsAt ? (
                            <div style={{ fontSize: 12 }}>
                              {new Date(market.voting.endsAt).toLocaleString()}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td>
                          <ActionGroup style={{ flexDirection: 'column', gap: 4 }}>
                            {!market.voting?.status || market.voting?.status === 'idle' ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <ActionButton 
                                  $variant="primary"
                                  onClick={() => handleStartVoting(market._id || market.id, 24)}
                                  disabled={actionLoading === (market._id || market.id)}
                                >
                                  Start 24h
                                </ActionButton>
                                <ActionButton 
                                  onClick={() => handleStartVoting(market._id || market.id, 48)}
                                  disabled={actionLoading === (market._id || market.id)}
                                >
                                  Start 48h
                                </ActionButton>
                              </div>
                            ) : market.voting?.status === 'active' ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <ActionButton 
                                  $variant="primary"
                                  onClick={() => handleFinalizeVoting(market._id || market.id)}
                                  disabled={actionLoading === (market._id || market.id)}
                                  style={{ background: '#059669' }}
                                >
                                  Finalize Now
                                </ActionButton>
                                <ActionButton 
                                  $variant="danger"
                                  onClick={() => handleCancelVoting(market._id || market.id)}
                                  disabled={actionLoading === (market._id || market.id)}
                                >
                                  Cancel
                                </ActionButton>
                              </div>
                            ) : market.voting?.status === 'finished' ? (
                              <StatusBadge $status="resolved">
                                Result: {market.voting?.result?.toUpperCase()}
                              </StatusBadge>
                            ) : null}
                          </ActionGroup>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <TableCard>
            <TableHeader>
              <h3>All Users ({users.length})</h3>
            </TableHeader>
            <Table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Username</th>
                  <th>XP</th>
                  <th>Tier</th>
                  <th>Predictions</th>
                  <th>Win Rate</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user._id || user.wallet || i}>
                    <td>{formatWallet(user.wallet)}</td>
                    <td>{user.username || 'Anonymous'}</td>
                    <td>{user.xp || 0}</td>
                    <td style={{ textTransform: 'capitalize' }}>{user.tier || 'bronze'}</td>
                    <td>{user.stats?.totalPredictions || 0}</td>
                    <td>{user.performance?.accuracy?.toFixed(1) || 0}%</td>
                    <td>{user.verified ? <CheckCircle size={16} color="#10b981" /> : <X size={16} color="#94a3b8" />}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <TableCard>
            <TableHeader>
              <h3>All Positions ({positions.length})</h3>
            </TableHeader>
            <Table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Market</th>
                  <th>Outcome</th>
                  <th>Stake</th>
                  <th>Odds</th>
                  <th>Potential</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, i) => (
                  <tr key={pos._id || i}>
                    <td>{formatWallet(pos.wallet)}</td>
                    <td>{pos.marketId?.slice(0, 8)}...</td>
                    <td>{pos.outcomeLabel || pos.outcomeId}</td>
                    <td>${pos.stake || 0}</td>
                    <td>{(pos.odds || 2).toFixed(2)}x</td>
                    <td>${(pos.potentialReturn || pos.stake * 2).toFixed(0)}</td>
                    <td><StatusBadge $status={pos.status || 'open'}>{pos.status || 'open'}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* Duels Tab */}
        {activeTab === 'duels' && (
          <TableCard>
            <TableHeader>
              <h3>All Duels ({duels.length})</h3>
            </TableHeader>
            <Table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Opponent</th>
                  <th>Stake</th>
                  <th>Total Pot</th>
                  <th>Status</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {duels.map((duel, i) => (
                  <tr key={duel._id || i}>
                    <td>{formatWallet(duel.creatorWallet)}</td>
                    <td>{formatWallet(duel.opponentWallet) || 'Waiting...'}</td>
                    <td>${duel.stakeAmount || 0}</td>
                    <td>${duel.totalPot || duel.stakeAmount * 2 || 0}</td>
                    <td><StatusBadge $status={duel.status}>{duel.status}</StatusBadge></td>
                    <td>{duel.winnerWallet ? formatWallet(duel.winnerWallet) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* Seasons Tab */}
        {activeTab === 'seasons' && (
          <TableCard>
            <TableHeader>
              <h3>All Seasons ({seasons.length})</h3>
            </TableHeader>
            <Table>
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Participants</th>
                  <th>Volume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((season, i) => (
                  <tr key={season._id || season.seasonId || i}>
                    <td>{season.seasonId}</td>
                    <td>{season.name}</td>
                    <td>{formatDate(season.startDate)}</td>
                    <td>{formatDate(season.endDate)}</td>
                    <td>{season.totalParticipants || 0}</td>
                    <td>{formatNumber(season.totalVolume || 0)}</td>
                    <td><StatusBadge $status={season.status}>{season.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <TableCard>
            <TableHeader>
              <h3>Live Activity ({activity.length})</h3>
            </TableHeader>
            <Table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Market</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((event, i) => (
                  <tr key={event._id || i}>
                    <td>{event.eventName || event.type || 'event'}</td>
                    <td>{event.username || formatWallet(event.user)}</td>
                    <td>{event.marketTitle?.slice(0, 30) || event.marketId?.slice(0, 8)}...</td>
                    <td>${event.amount || event.stake || 0}</td>
                    <td>{new Date(event.timestamp || event.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* Risk Monitor Tab */}
        {activeTab === 'risk' && (
          <>
            <StatsGrid>
              <StatCard $color="#ef4444">
                <div className="label">Whale Bets (&gt;20%)</div>
                <div className="value" data-testid="whale-count">{whales.length}</div>
              </StatCard>
              <StatCard $color="#f59e0b">
                <div className="label">Skewed Markets (&gt;85%)</div>
                <div className="value">{skewedMarkets.length}</div>
              </StatCard>
              <StatCard $color="#8b5cf6">
                <div className="label">Suspicious Users</div>
                <div className="value">{suspiciousUsers.length}</div>
              </StatCard>
              <StatCard $color="#6366f1">
                <div className="label">High Risk Markets</div>
                <div className="value">{riskData.filter(r => r.riskLevel === 'HIGH').length}</div>
              </StatCard>
            </StatsGrid>

            {/* Whale Bets */}
            {whales.length > 0 && (
              <TableCard style={{ marginBottom: 20 }}>
                <TableHeader>
                  <h3 style={{ color: '#ef4444' }}>Whale Bets (&gt;20% of market liquidity)</h3>
                </TableHeader>
                <Table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Market</th>
                      <th>Stake</th>
                      <th>Market Liquidity</th>
                      <th>% of Liquidity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whales.map((whale, i) => (
                      <tr key={whale.positionId || i}>
                        <td>{formatWallet(whale.wallet)}</td>
                        <td>{whale.marketTitle?.slice(0, 30)}...</td>
                        <td style={{ fontWeight: 600 }}>${whale.stake}</td>
                        <td>${whale.totalLiquidity?.toFixed(0)}</td>
                        <td><RiskBadge $level="HIGH">{whale.percentage}%</RiskBadge></td>
                        <td>
                          <ActionGroup>
                            <ActionButton onClick={() => handlePauseMarket(whale.marketId)}>
                              Pause Market
                            </ActionButton>
                            <ActionButton $variant="danger" onClick={() => handleFreezeUser(whale.wallet)}>
                              Freeze User
                            </ActionButton>
                          </ActionGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>
            )}

            {/* Skewed Markets */}
            {skewedMarkets.length > 0 && (
              <TableCard style={{ marginBottom: 20 }}>
                <TableHeader>
                  <h3 style={{ color: '#f59e0b' }}>Skewed Markets (&gt;85% on one side)</h3>
                </TableHeader>
                <Table>
                  <thead>
                    <tr>
                      <th>Market</th>
                      <th>Status</th>
                      <th>Total Stake</th>
                      <th>Dominant Outcome</th>
                      <th>Skew %</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skewedMarkets.map((market, i) => (
                      <tr key={market.marketId || i}>
                        <td>{market.title?.slice(0, 35)}...</td>
                        <td><StatusBadge $status={market.status}>{market.status}</StatusBadge></td>
                        <td>${market.totalStake?.toFixed(0)}</td>
                        <td style={{ fontWeight: 600 }}>{market.dominantOutcome}</td>
                        <td><RiskBadge $level={parseFloat(market.skewPercentage) > 95 ? 'HIGH' : 'MEDIUM'}>{market.skewPercentage}%</RiskBadge></td>
                        <td>
                          <ActionButton onClick={() => handlePauseMarket(market.marketId)}>
                            Pause
                          </ActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>
            )}

            {/* Suspicious Users */}
            {suspiciousUsers.length > 0 && (
              <TableCard style={{ marginBottom: 20 }}>
                <TableHeader>
                  <h3 style={{ color: '#8b5cf6' }}>Suspicious Users</h3>
                </TableHeader>
                <Table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Total Bets</th>
                      <th>Wins/Losses</th>
                      <th>Win Rate</th>
                      <th>Total Volume</th>
                      <th>Flags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspiciousUsers.map((user, i) => (
                      <tr key={user.wallet || i}>
                        <td>
                          <div>{user.username || 'Anonymous'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{formatWallet(user.wallet)}</div>
                        </td>
                        <td>{user.totalBets}</td>
                        <td>{user.wins} / {user.losses}</td>
                        <td><RiskBadge $level={parseFloat(user.winRate) > 90 ? 'HIGH' : 'MEDIUM'}>{user.winRate}%</RiskBadge></td>
                        <td>${user.totalVolume?.toFixed(0)}</td>
                        <td>
                          {user.flags?.map((flag: string, fi: number) => (
                            <span key={fi} style={{ 
                              background: '#fef3c7', 
                              color: '#92400e', 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontSize: 11,
                              marginRight: 4 
                            }}>
                              {flag}
                            </span>
                          ))}
                        </td>
                        <td>
                          <ActionButton $variant="danger" onClick={() => handleFreezeUser(user.wallet)}>
                            Freeze
                          </ActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>
            )}

            {/* General Risk Overview */}
            <TableCard>
              <TableHeader>
                <h3>Market Risk Overview ({riskData.length} markets)</h3>
              </TableHeader>
              <Table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Total Stake</th>
                    <th>Positions</th>
                    <th>Max Position</th>
                    <th>Concentration</th>
                    <th>Risk Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.map((item, i) => (
                    <tr key={item.marketId || i}>
                      <td>{item.title?.slice(0, 35) || item.marketId}...</td>
                      <td>{formatNumber(item.totalStake || 0)}</td>
                      <td>{item.positionsCount}</td>
                      <td>{formatNumber(item.maxPosition || 0)}</td>
                      <td>{item.concentration}%</td>
                      <td><RiskBadge $level={item.riskLevel}>{item.riskLevel}</RiskBadge></td>
                      <td>
                        <ActionButton onClick={() => handlePauseMarket(item.marketId)}>
                          Pause
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableCard>
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            Loading...
          </div>
        )}
      </MainContent>
    </PageWrapper>
  );
}
