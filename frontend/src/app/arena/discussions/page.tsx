'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import styled from 'styled-components';
import { useWallet } from '@/lib/wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare, TrendingUp, Clock, ThumbsUp, ThumbsDown,
  Eye, ChevronLeft, ChevronRight, Plus, Grid, Flame,
  Send, MoreHorizontal, Share2, Award, Zap, Users
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ===================== STYLED COMPONENTS =====================

const PageContainer = styled.div`
  min-height: calc(100vh - 65px);
  background: #f8f9fc;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div``;

const Sidebar = styled.div`
  @media (max-width: 1024px) {
    display: none;
  }
`;

// Header with Tabs
const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const TabsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Tab = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${({ $active }) => $active ? `
    background: #0f172a;
    color: #fff;
  ` : `
    background: transparent;
    color: #64748b;
    &:hover { background: #f1f5f9; color: #0f172a; }
  `}

  svg { width: 16px; height: 16px; }
`;

const SortDropdown = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;

  select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 14px;
    cursor: pointer;
    &:focus { outline: none; border-color: #05A584; }
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #05A584;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { background: #048a6e; }
  svg { width: 16px; height: 16px; }
`;

// Pagination
const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const PageNumbers = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active }) => $active ? `
    background: #05A584;
    color: white;
  ` : `
    background: transparent;
    color: #64748b;
    &:hover { background: #f1f5f9; }
  `}
`;

const PageInfo = styled.span`
  font-size: 13px;
  color: #94a3b8;
`;

// Discussion Card
const DiscussionCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  margin-bottom: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorAvatar = styled.div<{ $url?: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  position: relative;
  flex-shrink: 0;
`;

const LevelBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #F472B6, #EC4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  color: white;
  border: 2px solid white;
`;

const AuthorDetails = styled.div``;

const AuthorName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const AuthorMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
`;

const FollowersCount = styled.span`
  color: #05A584;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TagsList = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Tag = styled.span<{ $color?: string }>`
  padding: 4px 8px;
  background: transparent;
  color: ${({ $color }) => $color || '#64748b'};
  font-size: 12px;
  font-weight: 500;
`;

const ActionIcon = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover { background: #f1f5f9; color: #64748b; }
  svg { width: 16px; height: 16px; }
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px 0;
  line-height: 1.4;
  cursor: pointer;
  
  &:hover { color: #05A584; }
`;

const CardStats = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  
  svg { width: 16px; height: 16px; }
`;

const VoteCount = styled.span<{ $positive?: boolean }>`
  font-weight: 600;
  color: ${({ $positive }) => $positive ? '#05A584' : '#64748b'};
`;

// Sidebar Components
const SidebarCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  margin-bottom: 16px;
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  button {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover { background: #f8fafc; }
    svg { width: 14px; height: 14px; }
  }
`;

const TopicsList = styled.div``;

const TopicItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  
  ${({ $active }) => $active ? `
    background: #05A58410;
    .topic-name { color: #05A584; font-weight: 600; }
  ` : `
    &:hover { background: #f8fafc; }
  `}
`;

const TopicName = styled.span`
  font-size: 14px;
  color: #0f172a;
`;

const TopicStats = styled.div`
  text-align: right;
  
  .posts { font-size: 12px; color: #64748b; }
  .comments { font-size: 11px; color: #94a3b8; }
`;

const SeeMoreBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  &:hover { color: #05A584; }
`;

// Top Contributors
const ContributorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
`;

const ContributorAvatar = styled.div<{ $url?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  flex-shrink: 0;
`;

const ContributorInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContributorName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContributorHandle = styled.div`
  font-size: 12px;
  color: #05A584;
`;

const ContributorTier = styled.div`
  text-align: right;
  
  .tier { font-size: 12px; color: #64748b; }
  .xp { font-size: 11px; color: #94a3b8; }
`;

const ContributorBadges = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
`;

const Badge = styled.span<{ $variant?: 'primary' | 'secondary' | 'accent' }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return 'background: #05A58420; color: #05A584;';
      case 'accent': return 'background: #F9731620; color: #F97316;';
      default: return 'background: #e2e8f0; color: #64748b;';
    }
  }}
`;

// Today Stats
const TodayStats = styled.div``;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child { border-bottom: none; }
  
  .label { font-size: 13px; color: #64748b; }
  .value { font-size: 13px; font-weight: 600; color: #0f172a; }
  .value.highlight { color: #05A584; }
`;

// Create Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h2 { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
  
  button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    &:hover { background: #e2e8f0; }
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

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
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  
  &:focus { outline: none; border-color: #05A584; }
  &::placeholder { color: #94a3b8; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  
  &:focus { outline: none; border-color: #05A584; }
  &::placeholder { color: #94a3b8; }
`;

const TagsInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  min-height: 48px;
`;

const SelectedTag = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #05A58420;
  color: #05A584;
  border-radius: 4px;
  font-size: 13px;
  
  button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    display: flex;
    &:hover { opacity: 0.7; }
  }
`;

const AvailableTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const TagOption = styled.button<{ $selected?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s;
  
  ${({ $selected }) => $selected ? `
    background: #05A584;
    border-color: #05A584;
    color: white;
  ` : `
    background: white;
    border-color: #e2e8f0;
    color: #64748b;
    &:hover { border-color: #05A584; color: #05A584; }
  `}
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const CancelBtn = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #f8fafc; }
`;

const SubmitBtn = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #05A584;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #048a6e; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  
  svg { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
  h3 { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
  p { font-size: 14px; }
`;

// ===================== TYPES =====================

interface Discussion {
  id: string;
  wallet: string;
  username: string;
  avatar: string;
  followers: number;
  title: string;
  content: string;
  tags: string[];
  votes: number;
  commentsCount: number;
  views: number;
  createdAt: string;
  upvotedBy?: string[];
  downvotedBy?: string[];
}

interface Topic {
  id: string;
  name: string;
  postsCount: number;
  commentsCount: number;
  color: string;
}

interface Contributor {
  wallet: string;
  username: string;
  avatar: string;
  tier: string;
  xp: number;
  upvotes: number;
  comments: number;
  engagement: number;
}

interface TodayStatsData {
  newTopics: number;
  newPosts: number;
  commentsPosted: number;
  upvotesGiven: number;
  activeUsers: number;
  mostActiveTag: string;
  topContributor: { username: string; xpEarned: number };
}

// ===================== HELPER FUNCTIONS =====================

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
};

const formatNumber = (num: number) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const TAG_COLORS: Record<string, string> = {
  'Blockchain': '#3B82F6',
  'NFTs': '#8B5CF6',
  'DeFi': '#10B981',
  'AI': '#F59E0B',
  'Analytics': '#06B6D4',
  'Strategy': '#EF4444',
  'Invests': '#84CC16',
  'Market': '#EC4899',
  'Airdrops': '#F97316',
  'Scam': '#DC2626',
};

// ===================== MAIN COMPONENT =====================

function DiscussionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, walletAddress } = useWallet();

  // State
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'new' | 'top_commented'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('Price');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Fetch discussions
  const fetchDiscussions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: activeTab === 'all' ? 'trending' : activeTab,
      });
      if (selectedTag) params.set('tag', selectedTag);

      const res = await fetch(`${API_URL}/api/discussions?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setDiscussions(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch discussions:', err);
    }
  }, [page, activeTab, selectedTag]);

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/topics/list`);
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  }, []);

  // Fetch contributors
  const fetchContributors = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/contributors/top?limit=5`);
      const data = await res.json();
      if (data.success) setContributors(data.data);
    } catch (err) {
      console.error('Failed to fetch contributors:', err);
    }
  }, []);

  // Fetch today stats
  const fetchTodayStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/stats/today`);
      const data = await res.json();
      if (data.success) setTodayStats(data.data);
    } catch (err) {
      console.error('Failed to fetch today stats:', err);
    }
  }, []);

  // Seed topics on first load
  const seedTopics = async () => {
    try {
      await fetch(`${API_URL}/api/discussions/seed`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to seed topics:', err);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await seedTopics();
      await Promise.all([
        fetchDiscussions(),
        fetchTopics(),
        fetchContributors(),
        fetchTodayStats(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchDiscussions, fetchTopics, fetchContributors, fetchTodayStats]);

  // Handle create discussion
  const handleCreate = async () => {
    if (!createTitle.trim() || !walletAddress) return;
    
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          title: createTitle,
          content: createContent,
          tags: createTags,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateTitle('');
        setCreateContent('');
        setCreateTags([]);
        fetchDiscussions();
        fetchTopics();
      }
    } catch (err) {
      console.error('Failed to create discussion:', err);
    }
    setCreating(false);
  };

  // Handle vote
  const handleVote = async (discussionId: string, type: 'up' | 'down') => {
    if (!walletAddress) return;
    
    try {
      await fetch(`${API_URL}/api/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ type }),
      });
      fetchDiscussions();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Pagination
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const toggleTag = (tag: string) => {
    setCreateTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <MainContent>
          {/* Header with Tabs */}
          <HeaderSection>
            <TabsRow>
              <Tab $active={activeTab === 'all'} onClick={() => { setActiveTab('all'); setPage(1); }} data-testid="tab-all">
                <Grid size={16} /> All
              </Tab>
              <Tab $active={activeTab === 'trending'} onClick={() => { setActiveTab('trending'); setPage(1); }} data-testid="tab-trending">
                <Flame size={16} /> Trending
              </Tab>
              <Tab $active={activeTab === 'new'} onClick={() => { setActiveTab('new'); setPage(1); }} data-testid="tab-new">
                <Clock size={16} /> New (7d)
              </Tab>
              <Tab $active={activeTab === 'top_commented'} onClick={() => { setActiveTab('top_commented'); setPage(1); }} data-testid="tab-top-commented">
                <MessageSquare size={16} /> Top Commented
              </Tab>
            </TabsRow>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <SortDropdown>
                Sort by:
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option>Price</option>
                  <option>Votes</option>
                  <option>Comments</option>
                </select>
              </SortDropdown>
              
              <CreateButton onClick={() => setShowCreateModal(true)} data-testid="create-feed-btn">
                <Plus size={16} /> Create Feed
              </CreateButton>
            </div>
          </HeaderSection>

          {/* Pagination */}
          <PaginationRow>
            <PageNumbers>
              <PageBtn onClick={() => page > 1 && setPage(page - 1)} disabled={page === 1}>
                <ChevronLeft size={16} />
              </PageBtn>
              {renderPagination().map((p, i) => (
                <PageBtn 
                  key={i} 
                  $active={p === page}
                  onClick={() => typeof p === 'number' && setPage(p)}
                  disabled={typeof p !== 'number'}
                >
                  {p}
                </PageBtn>
              ))}
              <PageBtn onClick={() => page < totalPages && setPage(page + 1)} disabled={page === totalPages}>
                <ChevronRight size={16} />
              </PageBtn>
            </PageNumbers>
            <PageInfo>Showing {(page - 1) * 10 + 1} – {Math.min(page * 10, total)} out of {total}</PageInfo>
          </PaginationRow>

          {/* Discussions List */}
          {loading ? (
            <EmptyState>
              <MessageSquare />
              <h3>Loading discussions...</h3>
            </EmptyState>
          ) : discussions.length === 0 ? (
            <EmptyState>
              <MessageSquare />
              <h3>No discussions yet</h3>
              <p>Be the first to start a conversation!</p>
            </EmptyState>
          ) : (
            discussions.map(discussion => (
              <DiscussionCard key={discussion.id} data-testid={`discussion-${discussion.id}`}>
                <CardHeader>
                  <AuthorInfo>
                    <AuthorAvatar $url={discussion.avatar}>
                      <LevelBadge>%</LevelBadge>
                    </AuthorAvatar>
                    <AuthorDetails>
                      <AuthorName>{discussion.username}</AuthorName>
                      <AuthorMeta>
                        <FollowersCount>{formatNumber(discussion.followers)} Followers</FollowersCount>
                        <span>•</span>
                        <span>{timeAgo(discussion.createdAt)}</span>
                      </AuthorMeta>
                    </AuthorDetails>
                  </AuthorInfo>
                  
                  <CardActions>
                    <TagsList>
                      {discussion.tags.map(tag => (
                        <Tag key={tag} $color={TAG_COLORS[tag]} onClick={() => setSelectedTag(tag)}>
                          {tag}
                        </Tag>
                      ))}
                    </TagsList>
                    <ActionIcon><Share2 /></ActionIcon>
                    <ActionIcon><MoreHorizontal /></ActionIcon>
                  </CardActions>
                </CardHeader>
                
                <CardTitle onClick={() => router.push(`/arena/discussions/${discussion.id}`)}>
                  {discussion.title}
                </CardTitle>
                
                <CardStats>
                  <StatItem 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleVote(discussion.id, 'up')}
                  >
                    <span style={{ fontSize: '14px' }}>👍</span>
                    <span style={{ color: discussion.upvotedBy?.includes(walletAddress?.toLowerCase() || '') ? '#05A584' : '#64748b' }}>
                      {discussion.upvotedBy?.length || 0}
                    </span>
                  </StatItem>
                  <StatItem 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleVote(discussion.id, 'down')}
                  >
                    <span style={{ fontSize: '14px' }}>👎</span>
                    <span style={{ color: discussion.downvotedBy?.includes(walletAddress?.toLowerCase() || '') ? '#ef4444' : '#64748b' }}>
                      {discussion.downvotedBy?.length || 0}
                    </span>
                  </StatItem>
                  <StatItem>
                    <MessageSquare />
                    {discussion.commentsCount}
                  </StatItem>
                  <StatItem>
                    <Eye />
                    {formatNumber(discussion.views)}
                  </StatItem>
                </CardStats>
              </DiscussionCard>
            ))
          )}
        </MainContent>

        {/* Sidebar */}
        <Sidebar>
          {/* Topics */}
          <SidebarCard>
            <SidebarTitle>
              <h3>Topics</h3>
              <button><Plus size={14} /></button>
            </SidebarTitle>
            <TopicsList>
              {topics.slice(0, 10).map(topic => (
                <TopicItem 
                  key={topic.id} 
                  $active={selectedTag === topic.name}
                  onClick={() => setSelectedTag(selectedTag === topic.name ? null : topic.name)}
                  data-testid={`topic-${topic.name.toLowerCase()}`}
                >
                  <TopicName className="topic-name">{topic.name}</TopicName>
                  <TopicStats>
                    <div className="posts">{formatNumber(topic.postsCount)} posts</div>
                    <div className="comments">{formatNumber(topic.commentsCount)} comments</div>
                  </TopicStats>
                </TopicItem>
              ))}
            </TopicsList>
            <SeeMoreBtn>See More ▾</SeeMoreBtn>
          </SidebarCard>

          {/* Top Contributors */}
          <SidebarCard>
            <SidebarTitle>
              <h3><Award size={16} /> Top Contributors</h3>
            </SidebarTitle>
            {contributors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                <Users size={32} style={{ marginBottom: 8, color: '#cbd5e1' }} />
                <p style={{ margin: 0, fontSize: 13 }}>No contributors yet</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>Be active to appear here!</p>
              </div>
            ) : (
              contributors.map(contributor => (
                <ContributorItem key={contributor.wallet} data-testid={`contributor-${contributor.wallet.slice(0, 8)}`}>
                  <ContributorAvatar $url={contributor.avatar} />
                  <ContributorInfo>
                    <ContributorName>{contributor.username}</ContributorName>
                    <ContributorHandle>@{contributor.username.toLowerCase().replace(/\s+/g, '')}</ContributorHandle>
                    <ContributorBadges>
                      <Badge $variant="primary">👍 {formatNumber(contributor.upvotes || 0)} likes</Badge>
                      <Badge $variant="secondary">💬 {contributor.comments || 0} comments</Badge>
                    </ContributorBadges>
                  </ContributorInfo>
                </ContributorItem>
              ))
            )}
          </SidebarCard>

          {/* Today Stats */}
          {todayStats && (
            <SidebarCard>
              <SidebarTitle>
                <h3><Flame size={16} /> Today in FOMO Chat</h3>
              </SidebarTitle>
              <TodayStats>
                <StatRow>
                  <span className="label">New Topics</span>
                  <span className="value">{todayStats.newTopics}</span>
                </StatRow>
                <StatRow>
                  <span className="label">New Posts</span>
                  <span className="value">{todayStats.newPosts}</span>
                </StatRow>
                <StatRow>
                  <span className="label">Comments Posted</span>
                  <span className="value">{todayStats.commentsPosted}</span>
                </StatRow>
                <StatRow>
                  <span className="label">Upvotes Given</span>
                  <span className="value">{todayStats.upvotesGiven}</span>
                </StatRow>
                <StatRow>
                  <span className="label">Active Users</span>
                  <span className="value">{todayStats.activeUsers}</span>
                </StatRow>
                <StatRow>
                  <span className="label">Most Active Tag</span>
                  <span className="value highlight">{todayStats.mostActiveTag}</span>
                </StatRow>
                <StatRow>
                  <span className="label">Top Contributor</span>
                  <span className="value highlight">{todayStats.topContributor.username} [+{todayStats.topContributor.xpEarned} XP]</span>
                </StatRow>
              </TodayStats>
            </SidebarCard>
          )}
        </Sidebar>
      </ContentWrapper>

      {/* Create Modal */}
      {showCreateModal && (
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>Create New Discussion</h2>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Title *</Label>
                <Input
                  placeholder="What would you like to discuss?"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  data-testid="discussion-title-input"
                />
              </FormGroup>
              <FormGroup>
                <Label>Content (optional)</Label>
                <Textarea
                  placeholder="Add more details to your discussion..."
                  value={createContent}
                  onChange={e => setCreateContent(e.target.value)}
                  data-testid="discussion-content-input"
                />
              </FormGroup>
              <FormGroup>
                <Label>Tags</Label>
                <TagsInput>
                  {createTags.map(tag => (
                    <SelectedTag key={tag}>
                      {tag}
                      <button onClick={() => toggleTag(tag)}>✕</button>
                    </SelectedTag>
                  ))}
                </TagsInput>
                <AvailableTags>
                  {topics.map(topic => (
                    <TagOption 
                      key={topic.id}
                      $selected={createTags.includes(topic.name)}
                      onClick={() => toggleTag(topic.name)}
                    >
                      {topic.name}
                    </TagOption>
                  ))}
                </AvailableTags>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setShowCreateModal(false)}>Cancel</CancelBtn>
              <SubmitBtn 
                onClick={handleCreate} 
                disabled={!createTitle.trim() || creating || !isConnected}
                data-testid="submit-discussion-btn"
              >
                {creating ? 'Creating...' : 'Create Discussion'}
              </SubmitBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <DiscussionsPageContent />
    </Suspense>
  );
}
