'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useWallet } from '@/lib/wagmi';
import {
  MessageSquare, ThumbsUp, ThumbsDown, Eye, 
  ChevronRight, Award, Plus, Users, ArrowLeft,
  Share2, ChevronDown, MoreHorizontal, RefreshCw, Info
} from 'lucide-react';
import CreateDiscussionModal from './modals/CreateDiscussionModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ===================== STYLED COMPONENTS =====================

const Container = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-top: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TotalCount = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: #94a3b8;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ViewAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f8fafc;
    color: #0f172a;
    border-color: #cbd5e1;
  }
  
  svg { width: 14px; height: 14px; }
`;

const CreateTopicBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #05A584;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { background: #048a6e; }
  
  svg { width: 14px; height: 14px; }
`;

const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  padding: 0;
`;

const Sidebar = styled.div`
  border-left: 1px solid #e2e8f0;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

// Topic Item
const TopicItem = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover { background: #f8fafc; }
  &:last-child { border-bottom: none; }
`;

const TopicAvatar = styled.div<{ $url?: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  flex-shrink: 0;
`;

const TopicContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopicMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const AuthorName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const Followers = styled.span`
  font-size: 12px;
  color: #05A584;
`;

const TimeAgo = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

const TopicTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TopicStats = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
  
  svg { width: 14px; height: 14px; }
  
  .emoji { font-size: 14px; }
`;

const TopicTags = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
`;

const Tag = styled.span<{ $color?: string }>`
  padding: 4px 8px;
  background: transparent;
  color: ${({ $color }) => $color || '#64748b'};
  font-size: 12px;
  font-weight: 500;
`;

// Sidebar Components
const SidebarSection = styled.div`
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child { border-bottom: none; }
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg { width: 16px; height: 16px; color: #05A584; }
`;

// Topics List in Sidebar
const TopicCategory = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover { background: #f8fafc; }
`;

const CategoryName = styled.span`
  font-size: 14px;
  color: #0f172a;
`;

const CategoryStats = styled.div`
  text-align: right;
  
  .posts {
    font-size: 12px;
    font-weight: 500;
    color: #0f172a;
  }
  
  .comments {
    font-size: 11px;
    color: #94a3b8;
  }
`;

// Top Contributors
const ContributorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
  
  &:last-child { margin-bottom: 0; }
`;

const ContributorAvatar = styled.div<{ $url?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  flex-shrink: 0;
`;

const ContributorInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContributorName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
`;

const ContributorStats = styled.div`
  font-size: 11px;
  color: #64748b;
`;

const EmptyState = styled.div<{ $large?: boolean }>`
  text-align: center;
  padding: ${({ $large }) => $large ? '80px 40px' : '40px 20px'};
  min-height: ${({ $large }) => $large ? '300px' : 'auto'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ $large }) => $large ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : 'transparent'};
  border-radius: ${({ $large }) => $large ? '12px' : '0'};
  
  svg { 
    width: ${({ $large }) => $large ? '64px' : '40px'}; 
    height: ${({ $large }) => $large ? '64px' : '40px'}; 
    color: #cbd5e1;
    margin-bottom: ${({ $large }) => $large ? '24px' : '12px'};
  }
  
  h4 {
    font-size: ${({ $large }) => $large ? '20px' : '14px'};
    font-weight: 600;
    color: #64748b;
    margin: 0 0 ${({ $large }) => $large ? '12px' : '4px'} 0;
  }
  
  p {
    font-size: ${({ $large }) => $large ? '14px' : '13px'};
    margin: 0;
    color: #94a3b8;
    max-width: 300px;
    line-height: 1.5;
  }
`;

const EmptyStateButton = styled.button`
  margin-top: 20px;
  padding: 12px 24px;
  background: #05A584;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #048a6e;
    transform: translateY(-1px);
  }
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
  upvotedBy: string[];
  downvotedBy: string[];
  commentsCount: number;
  views: number;
  createdAt: string;
}

interface Topic {
  id: string;
  name: string;
  color: string;
  postsCount: number;
  commentsCount: number;
}

interface Contributor {
  wallet: string;
  username: string;
  avatar: string;
  totalLikes: number;
  totalComments: number;
}

interface Comment {
  id: string;
  wallet: string;
  username: string;
  avatar: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
}

// ===================== HELPERS =====================

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

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }) + '  ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();
};

// ===================== DETAIL VIEW STYLED COMPONENTS =====================

const DetailView = styled.div`
  padding: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const DetailCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
`;

const DetailTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px 0;
  line-height: 1.3;
`;

const DetailAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const DetailAvatar = styled.div<{ $url?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  border: 2px solid #05A584;
`;

const DetailAuthorInfo = styled.div``;

const DetailAuthorName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

const DetailAuthorHandle = styled.div`
  font-size: 13px;
  color: #05A584;
`;

const DetailDate = styled.div`
  font-size: 13px;
  color: #94a3b8;
  margin-left: auto;
`;

const DetailContent = styled.div`
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 20px;
  white-space: pre-wrap;
`;

const DetailStats = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const DetailStatButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active }) => $active ? `
    background: #05A58420;
    color: #05A584;
  ` : `
    background: #f1f5f9;
    color: #64748b;
    &:hover { background: #e2e8f0; color: #0f172a; }
  `}
`;

const DetailTagsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const DetailTag = styled.span<{ $color?: string }>`
  padding: 4px 10px;
  background: ${({ $color }) => $color ? `${$color}15` : '#f1f5f9'};
  color: ${({ $color }) => $color || '#64748b'};
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
`;

// Comments section for detail view
const CommentsCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
`;

const CommentInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const CommentInputField = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const PostCommentBtn = styled.button`
  padding: 12px 20px;
  background: #05A584;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: #048a6e;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentsSortRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
`;

const CommentsCountText = styled.span`
  font-size: 14px;
  color: #64748b;
`;

const SortDropdown = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #0f172a;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
`;

const CommentsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const CommentItemStyled = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const CommentAvatarStyled = styled.div<{ $url?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
`;

const CommentUsername = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const CommentDate = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

const CommentBody = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  margin: 0 0 10px 46px;
`;

const CommentActions = styled.div`
  display: flex;
  gap: 12px;
  margin-left: 46px;
`;

const CommentActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`;

const EmptyComments = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  
  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
    margin: 0 0 4px 0;
  }
  
  p {
    font-size: 13px;
    margin: 0;
  }
`;

// Two-column layout for detail view
const DetailLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DetailMainColumn = styled.div`
  min-width: 0;
`;

// Sidebar for detail view
const DetailSidebar = styled.div`
  position: sticky;
  top: 24px;
  height: fit-content;
`;

const SidebarCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  margin-left: auto;
  
  &:hover {
    background: #f8fafc;
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: #64748b;
  }
`;

const PostOverview = styled.div`
  margin-bottom: 16px;
  
  h5 {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 10px 0;
  }
  
  p {
    font-size: 13px;
    line-height: 1.6;
    color: #64748b;
    margin: 0;
  }
`;

const TopContributorCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 10px;
  
  &:last-child { margin-bottom: 0; }
`;

const ContributorBadge = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #05A584;
  background: #05A58415;
  padding: 2px 8px;
  border-radius: 4px;
`;

const ContributorXP = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  margin-left: auto;
`;

const ContributorEngagement = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  color: #64748b;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
  
  svg {
    width: 14px;
    height: 14px;
    color: #94a3b8;
  }
`;

const AISummaryText = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 12px 0;
`;

const KeyTakeawaysBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 14px;
  
  h5 {
    font-size: 13px;
    font-weight: 600;
    color: #166534;
    margin: 0 0 10px 0;
  }
  
  ul {
    margin: 0;
    padding-left: 16px;
    
    li {
      font-size: 12px;
      line-height: 1.5;
      color: #166534;
      margin-bottom: 6px;
      
      &:last-child { margin-bottom: 0; }
    }
  }
`;

const SentimentSection = styled.div`
  margin-top: 16px;
`;

const SentimentBar = styled.div`
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
`;

const SentimentSegment = styled.div<{ $color: string; $width: number }>`
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
`;

const SentimentLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  
  .negative { color: #ef4444; }
  .neutral { color: #f59e0b; }
  .positive { color: #05A584; }
`;

const SentimentValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #05A584;
  margin-left: 8px;
`;

// ===================== MAIN COMPONENT =====================

interface DiscussionsBlockProps {
  marketId?: string;
}

const DiscussionsBlock: React.FC<DiscussionsBlockProps> = ({ marketId }) => {
  const { isConnected, walletAddress } = useWallet();
  
  // State
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewDiscussionId, setViewDiscussionId] = useState<string | null>(null);
  
  // Detail view state
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSort, setCommentSort] = useState('newest');

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [discussionsRes, topicsRes, contributorsRes] = await Promise.all([
        fetch(`${API_URL}/api/discussions?page=1&limit=5&sort=newest`),
        fetch(`${API_URL}/api/discussions/topics/list`),
        fetch(`${API_URL}/api/discussions/contributors/top?limit=5`),
      ]);
      
      const [discussionsData, topicsData, contributorsData] = await Promise.all([
        discussionsRes.json(),
        topicsRes.json(),
        contributorsRes.json(),
      ]);
      
      if (discussionsData.success) {
        setDiscussions(discussionsData.data);
        setTotal(discussionsData.total || discussionsData.data.length);
      }
      if (topicsData.success) setTopics(topicsData.data);
      if (contributorsData.success) setContributors(contributorsData.data);
    } catch (err) {
      console.error('Failed to fetch discussions data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle like
  const handleLike = async (e: React.MouseEvent, discussionId: string) => {
    e.stopPropagation();
    if (!walletAddress) return;
    
    try {
      await fetch(`${API_URL}/api/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ type: 'up' }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  // Handle dislike
  const handleDislike = async (e: React.MouseEvent, discussionId: string) => {
    e.stopPropagation();
    if (!walletAddress) return;
    
    try {
      await fetch(`${API_URL}/api/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ type: 'down' }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to dislike:', err);
    }
  };

  const handleTopicClick = (discussionId: string) => {
    // Find discussion in current list or fetch it
    const found = discussions.find(d => d.id === discussionId);
    if (found) {
      setSelectedDiscussion(found);
      setViewDiscussionId(discussionId);
      fetchComments(discussionId);
    }
  };

  const handleBackToList = () => {
    setViewDiscussionId(null);
    setSelectedDiscussion(null);
    setComments([]);
    setNewComment('');
    fetchData(); // Refresh after viewing
  };

  // Fetch comments for a discussion
  const fetchComments = async (discussionId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/discussions/${discussionId}/comments?sort=${commentSort}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
    setCommentsLoading(false);
  };

  // Post a comment
  const handlePostComment = async () => {
    if (!newComment.trim() || !walletAddress || !viewDiscussionId) return;
    
    try {
      await fetch(`${API_URL}/api/discussions/${viewDiscussionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ content: newComment }),
      });
      setNewComment('');
      fetchComments(viewDiscussionId);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Vote on detail view
  const handleDetailVote = async (type: 'up' | 'down') => {
    if (!walletAddress || !viewDiscussionId) return;
    
    try {
      await fetch(`${API_URL}/api/discussions/${viewDiscussionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ type }),
      });
      // Refresh the discussion
      const res = await fetch(`${API_URL}/api/discussions/${viewDiscussionId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDiscussion(data.data);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleViewAll = () => {
    // Could show all discussions in a panel or just scroll
    // For now, we show the first one as an example
  };

  const handleCreateTopic = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchData(); // Refresh discussions after creating new one
  };

  // If viewing a specific discussion, show detail view with 2-column layout
  if (viewDiscussionId && selectedDiscussion) {
    const hasUpvoted = walletAddress && selectedDiscussion.upvotedBy?.includes(walletAddress.toLowerCase());
    const hasDownvoted = walletAddress && selectedDiscussion.downvotedBy?.includes(walletAddress.toLowerCase());
    
    // Mock top contributors for this discussion
    const topContributors = [
      { wallet: '0x1234', username: 'Ethan Cross', handle: '@iamethannn', badge: 'Astral Sage', xp: 816, upvotes: 54, comments: 6, engagement: 3.2 },
      { wallet: '0x5678', username: 'Julian Hayes', handle: '@julhay', badge: 'Cosmic Explorer', xp: 364, upvotes: 54, comments: 6, engagement: 3.2 },
      { wallet: '0x9abc', username: 'Ava Sterling', handle: '@doubleava', badge: 'Stellar Awakening', xp: 23, upvotes: 12, comments: 2, engagement: 1.8 },
    ];
    
    return (
      <Container data-testid="discussions-block">
        <DetailView>
          <BackButton onClick={handleBackToList} data-testid="back-to-list-btn">
            <ArrowLeft />
          </BackButton>
          
          <DetailLayout>
            {/* LEFT COLUMN - Main content (2/3 width) */}
            <DetailMainColumn>
              {/* Discussion Detail Card */}
              <DetailCard data-testid="discussion-detail-card">
                <DetailTitle>{selectedDiscussion.title}</DetailTitle>
                
                <DetailAuthorRow>
                  <DetailAvatar $url={selectedDiscussion.avatar} />
                  <DetailAuthorInfo>
                    <DetailAuthorName>{selectedDiscussion.username}</DetailAuthorName>
                    <DetailAuthorHandle>@{selectedDiscussion.username.toLowerCase().replace(/\s+/g, '_')}</DetailAuthorHandle>
                  </DetailAuthorInfo>
                  <DetailDate>{formatDate(selectedDiscussion.createdAt)}</DetailDate>
                </DetailAuthorRow>
                
                {selectedDiscussion.content && (
                  <DetailContent>{selectedDiscussion.content}</DetailContent>
                )}
                
                <DetailStats>
                  <DetailStatButton 
                    $active={hasUpvoted}
                    onClick={() => handleDetailVote('up')}
                    data-testid="detail-upvote-btn"
                  >
                    <ThumbsUp size={16} />
                    {selectedDiscussion.upvotedBy?.length || 0}
                  </DetailStatButton>
                  <DetailStatButton 
                    $active={hasDownvoted}
                    onClick={() => handleDetailVote('down')}
                    data-testid="detail-downvote-btn"
                  >
                    <ThumbsDown size={16} />
                    {selectedDiscussion.downvotedBy?.length || 0}
                  </DetailStatButton>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 14 }}>
                    <Eye size={16} />
                    {selectedDiscussion.views}
                  </div>
                  <DetailStatButton style={{ marginLeft: 'auto' }}>
                    <Share2 size={16} />
                  </DetailStatButton>
                </DetailStats>
                
                {selectedDiscussion.tags && selectedDiscussion.tags.length > 0 && (
                  <DetailTagsRow>
                    {selectedDiscussion.tags.map(tag => (
                      <DetailTag key={tag} $color={TAG_COLORS[tag]}>{tag}</DetailTag>
                    ))}
                  </DetailTagsRow>
                )}
              </DetailCard>
              
              {/* Comments Section */}
              <CommentsCard data-testid="comments-section">
                <CommentInputWrapper>
                  <CommentInputField
                    placeholder="Join the discussion..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    data-testid="comment-input"
                  />
                  <PostCommentBtn 
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || !isConnected}
                    data-testid="post-comment-btn"
                  >
                    Post
                  </PostCommentBtn>
                </CommentInputWrapper>
                
                <CommentsSortRow>
                  <CommentsCountText>{comments.length} comments</CommentsCountText>
                  <SortDropdown 
                    value={commentSort} 
                    onChange={e => {
                      setCommentSort(e.target.value);
                      fetchComments(viewDiscussionId);
                    }}
                    data-testid="comments-sort"
                  >
                    <option value="newest">Sort by: Top (Default)</option>
                    <option value="oldest">Oldest first</option>
                    <option value="most_replied">Most Replied</option>
                    <option value="verified">Verified Only</option>
                    <option value="controversial">Controversial</option>
                  </SortDropdown>
                </CommentsSortRow>
                
                <CommentsList>
                  {commentsLoading ? (
                    <EmptyComments>
                      <h4>Loading comments...</h4>
                    </EmptyComments>
                  ) : comments.length === 0 ? (
                    <EmptyComments>
                      <h4>No comments yet</h4>
                      <p>Be the first to share your thoughts!</p>
                    </EmptyComments>
                  ) : (
                    comments.map(comment => (
                      <CommentItemStyled key={comment.id} data-testid={`comment-${comment.id}`}>
                        <CommentHeader>
                          <CommentAvatarStyled $url={comment.avatar} />
                          <CommentUsername>{comment.username}</CommentUsername>
                          <CommentDate>{formatTimeAgo(comment.createdAt)}</CommentDate>
                        </CommentHeader>
                        <CommentBody>{comment.content}</CommentBody>
                        <CommentActions>
                          <CommentActionBtn>
                            <ThumbsUp size={12} /> {comment.likes || 0}
                          </CommentActionBtn>
                          <CommentActionBtn>
                            <ThumbsDown size={12} /> {comment.dislikes || 0}
                          </CommentActionBtn>
                          <CommentActionBtn>Reply</CommentActionBtn>
                          <CommentActionBtn><Share2 size={12} /></CommentActionBtn>
                          <CommentActionBtn><MoreHorizontal size={12} /></CommentActionBtn>
                        </CommentActions>
                      </CommentItemStyled>
                    ))
                  )}
                </CommentsList>
              </CommentsCard>
            </DetailMainColumn>
            
            {/* RIGHT COLUMN - Sidebar (1/3 width) */}
            <DetailSidebar>
              {/* AI Summary Card */}
              <SidebarCard>
                <SidebarTitle>
                  <h4>AI Summary</h4>
                  <Info size={14} />
                  <RefreshButton title="Refresh AI Summary">
                    <RefreshCw size={14} />
                  </RefreshButton>
                </SidebarTitle>
                
                <PostOverview>
                  <h5>Post overview</h5>
                  <p>
                    This post introduces a discussion topic related to {selectedDiscussion.tags?.[0] || 'blockchain'} and {selectedDiscussion.tags?.[1] || 'analytics'}. 
                    The author highlights key insights and invites community participation.
                  </p>
                </PostOverview>
                
                <KeyTakeawaysBox>
                  <h5>Key takeaways</h5>
                  <ul>
                    <li>Community finds the <strong>{selectedDiscussion.tags?.[0] || 'topic'}</strong> feature highly valuable for real-time dashboards and integrations.</li>
                    <li>Several users compared this tool to <strong>Dune</strong> and <strong>Flipside</strong>, agreeing it performs faster for live queries.</li>
                    <li>The main technical debate centers around <strong>scalability</strong> once more data sources are connected.</li>
                    <li>Some developers suggested <strong>open-sourcing</strong> the schema for broader community adoption.</li>
                  </ul>
                </KeyTakeawaysBox>
              </SidebarCard>
              
              {/* Community Pulse */}
              <SidebarCard>
                <SidebarTitle>
                  <h4>Community pulse</h4>
                </SidebarTitle>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Sentiment</span>
                  <SentimentValue>83%</SentimentValue>
                </div>
                <SentimentBar>
                  <SentimentSegment $color="#ef4444" $width={10} />
                  <SentimentSegment $color="#f59e0b" $width={7} />
                  <SentimentSegment $color="#05A584" $width={83} />
                </SentimentBar>
                <SentimentLabels>
                  <span className="negative">Negative</span>
                  <span className="neutral">Neutral</span>
                  <span className="positive">Positive</span>
                </SentimentLabels>
                
                <div style={{ marginTop: 16, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  Most participants have over <strong style={{ color: '#0f172a' }}>400 XP</strong>, indicating they're <strong style={{ color: '#0f172a' }}>experienced analysts</strong> and <strong style={{ color: '#0f172a' }}>crypto-native users</strong> with a focus on blockchain data tooling and OSINT workflows.
                </div>
                
                <div style={{ marginTop: 12, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  The discussion tone remains technical and data-driven, with users exchanging real performance benchmarks and debating infrastructure scalability across chains.
                </div>
              </SidebarCard>
              
              {/* Top Contributors */}
              <SidebarCard>
                <SidebarTitle>
                  <h4>Top Contributors</h4>
                </SidebarTitle>
                
                {topContributors.map((contributor, idx) => (
                  <TopContributorCard key={contributor.wallet}>
                    <ContributorAvatar $url={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.username}`} />
                    <ContributorInfo>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ContributorName>{contributor.username}</ContributorName>
                        <ContributorBadge>{contributor.badge}</ContributorBadge>
                      </div>
                      <div style={{ fontSize: 12, color: '#05A584' }}>{contributor.handle}</div>
                      <ContributorEngagement>
                        <span><ThumbsUp size={11} /> {contributor.upvotes} upvotes</span>
                        <span><MessageSquare size={11} /> {contributor.comments} comments</span>
                        <span style={{ color: '#05A584' }}>⚡ {contributor.engagement}x Engagement</span>
                      </ContributorEngagement>
                    </ContributorInfo>
                    <ContributorXP>{contributor.xp} XP</ContributorXP>
                  </TopContributorCard>
                ))}
              </SidebarCard>
            </DetailSidebar>
          </DetailLayout>
        </DetailView>
        
        {/* Create Discussion Modal */}
        <CreateDiscussionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </Container>
    );
  }

  // Default: Show discussion list
  return (
    <Container data-testid="discussions-block">
      {/* Simple Header */}
      <Header>
        <Title>
          <MessageSquare size={20} />
          Discussions
          {total > 0 && <TotalCount>{total}</TotalCount>}
        </Title>
        
        <HeaderActions>
          <ViewAllButton onClick={handleViewAll} data-testid="view-all-btn">
            View All
            <ChevronRight />
          </ViewAllButton>
          <CreateTopicBtn onClick={handleCreateTopic} data-testid="create-topic-btn">
            <Plus />
            Create Topic
          </CreateTopicBtn>
        </HeaderActions>
      </Header>

      <ContentWrapper>
        {/* Main Content - Discussion List */}
        <MainContent>
          {loading ? (
            <EmptyState $large>
              <MessageSquare />
              <h4>Loading discussions...</h4>
            </EmptyState>
          ) : discussions.length === 0 ? (
            <EmptyState $large data-testid="discussions-empty">
              <MessageSquare />
              <h4>No Discussions Yet</h4>
              <p>
                Start the conversation! Share your insights, predictions, and analysis with the community.
              </p>
              <EmptyStateButton onClick={handleCreateTopic}>
                + Start First Discussion
              </EmptyStateButton>
            </EmptyState>
          ) : (
            discussions.map(discussion => {
              const likesCount = discussion.upvotedBy?.length || 0;
              const dislikesCount = discussion.downvotedBy?.length || 0;
              const hasLiked = walletAddress && discussion.upvotedBy?.includes(walletAddress.toLowerCase());
              const hasDisliked = walletAddress && discussion.downvotedBy?.includes(walletAddress.toLowerCase());
              
              return (
                <TopicItem 
                  key={discussion.id} 
                  onClick={() => handleTopicClick(discussion.id)}
                  data-testid={`topic-${discussion.id}`}
                >
                  <TopicAvatar $url={discussion.avatar} />
                  
                  <TopicContent>
                    <TopicMeta>
                      <AuthorName>{discussion.username}</AuthorName>
                      <Followers>{discussion.followers} Followers</Followers>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <TimeAgo>{formatTimeAgo(discussion.createdAt)}</TimeAgo>
                    </TopicMeta>
                    
                    <TopicTitle>{discussion.title}</TopicTitle>
                    
                    <TopicStats>
                      <Stat 
                        onClick={(e) => handleLike(e, discussion.id)}
                        style={{ 
                          cursor: 'pointer',
                          color: hasLiked ? '#05A584' : '#64748b'
                        }}
                        data-testid={`like-${discussion.id}`}
                      >
                        <span className="emoji">👍</span>
                        {likesCount}
                      </Stat>
                      <Stat 
                        onClick={(e) => handleDislike(e, discussion.id)}
                        style={{ 
                          cursor: 'pointer',
                          color: hasDisliked ? '#ef4444' : '#64748b'
                        }}
                        data-testid={`dislike-${discussion.id}`}
                      >
                        <span className="emoji">👎</span>
                        {dislikesCount}
                      </Stat>
                      <Stat>
                        <MessageSquare />
                        {discussion.commentsCount}
                      </Stat>
                      <Stat>
                        <Eye />
                        {discussion.views}
                      </Stat>
                    </TopicStats>
                  </TopicContent>
                  
                  <TopicTags>
                    {discussion.tags.slice(0, 2).map(tag => (
                      <Tag key={tag} $color={TAG_COLORS[tag]}>{tag}</Tag>
                    ))}
                  </TopicTags>
                </TopicItem>
              );
            })
          )}
        </MainContent>

        {/* Sidebar */}
        <Sidebar>
          {/* Topics Categories */}
          <SidebarSection>
            <SectionTitle>
              <MessageSquare />
              Topics
            </SectionTitle>
            {topics.length === 0 ? (
              <EmptyState style={{ padding: '20px 0' }}>
                <p>No topics yet</p>
              </EmptyState>
            ) : (
              topics.slice(0, 6).map(topic => (
                <TopicCategory key={topic.id}>
                  <CategoryName>{topic.name}</CategoryName>
                  <CategoryStats>
                    <div className="posts">{topic.postsCount} posts</div>
                    <div className="comments">{topic.commentsCount} comments</div>
                  </CategoryStats>
                </TopicCategory>
              ))
            )}
          </SidebarSection>

          {/* Top Contributors */}
          <SidebarSection>
            <SectionTitle>
              <Award />
              Top Contributors
            </SectionTitle>
            {contributors.length === 0 ? (
              <EmptyState style={{ padding: '20px 0' }}>
                <Users />
                <h4>No contributors yet</h4>
                <p>Be active to appear here!</p>
              </EmptyState>
            ) : (
              contributors.slice(0, 3).map(contributor => (
                <ContributorItem key={contributor.wallet}>
                  <ContributorAvatar $url={contributor.avatar} />
                  <ContributorInfo>
                    <ContributorName>{contributor.username}</ContributorName>
                    <ContributorStats>
                      👍 {contributor.totalLikes || 0} • 💬 {contributor.totalComments || 0}
                    </ContributorStats>
                  </ContributorInfo>
                </ContributorItem>
              ))
            )}
          </SidebarSection>
        </Sidebar>
      </ContentWrapper>
      
      {/* Create Discussion Modal */}
      <CreateDiscussionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </Container>
  );
};

export default DiscussionsBlock;
