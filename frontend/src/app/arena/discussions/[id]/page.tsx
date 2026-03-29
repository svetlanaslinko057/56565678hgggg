'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wagmi';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Eye, MessageSquare, Share2,
  MoreHorizontal, ChevronDown, Award, Zap, RefreshCw, Info
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
  grid-template-columns: 1fr 380px;
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

// Back Button
const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 24px;
  
  &:hover {
    color: #0f172a;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

// Topic Header Card
const TopicCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 32px;
  margin-bottom: 24px;
`;

const TopicTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  margin: 0 0 20px 0;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const AuthorAvatar = styled.div<{ $url?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  border: 2px solid #05A584;
  flex-shrink: 0;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

const AuthorMeta = styled.div`
  font-size: 13px;
  color: #05A584;
`;

const PublishDate = styled.div`
  font-size: 13px;
  color: #94a3b8;
  margin-left: auto;
`;

const TopicContent = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 24px;
  
  p {
    margin: 0 0 16px 0;
  }
  
  ul, ol {
    margin: 0 0 16px 0;
    padding-left: 24px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const TopicStats = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
`;

const StatButton = styled.button<{ $active?: boolean }>`
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
  
  svg { width: 18px; height: 18px; }
`;

const ViewsCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #94a3b8;
  margin-left: auto;
  
  svg { width: 16px; height: 16px; }
`;

const TagsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const Tag = styled.span<{ $color?: string }>`
  padding: 4px 8px;
  background: transparent;
  color: ${({ $color }) => $color || '#64748b'};
  font-size: 13px;
  font-weight: 500;
`;

// Comments Section
const CommentsSection = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
`;

const CommentInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 20px;
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #0f172a;
    
    &::placeholder { color: #94a3b8; }
    &:focus { outline: none; }
  }
  
  button {
    padding: 8px 16px;
    background: #05A584;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    
    &:hover { background: #048a6e; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
`;

const SortRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const SortDropdown = styled.div`
  position: relative;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  cursor: pointer;
  
  &:hover { background: #f8fafc; }
  
  svg { width: 14px; height: 14px; color: #64748b; }
`;

const SortMenu = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
  display: ${props => props.$visible ? 'block' : 'none'};
  min-width: 160px;
`;

const SortOption = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: ${props => props.$active ? '#f3f4f6' : 'transparent'};
  border: none;
  font-size: 14px;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover { background: #f3f4f6; }
  
  .check {
    color: #05A584;
    display: ${props => props.$active ? 'block' : 'none'};
  }
`;

// Comment Item
const CommentItem = styled.div<{ $isReply?: boolean; $depth?: number }>`
  padding: ${props => props.$isReply ? '16px 0 16px 0' : '20px 0'};
  margin-left: ${props => props.$depth ? `${props.$depth * 32}px` : '0'};
  border-bottom: ${props => props.$isReply ? 'none' : '1px solid #f1f5f9'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const CommentAvatar = styled.div<{ $url?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  flex-shrink: 0;
  position: relative;
`;

const LevelBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
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

const CommentUserInfo = styled.div`
  flex: 1;
`;

const CommentUsername = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const CommentDate = styled.span`
  font-size: 13px;
  color: #94a3b8;
  margin-left: 10px;
`;

const CommentBody = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 12px;
  padding-left: 52px;
`;

const CommentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 52px;
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
  
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  svg { width: 16px; height: 16px; }
`;

const RepliesToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin-left: 52px;
  margin-top: 8px;
  background: transparent;
  border: none;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  
  &:hover { color: #0f172a; }
  
  .line {
    width: 24px;
    height: 1px;
    background: #d1d5db;
  }
`;

const ReplyInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 52px;
  margin-top: 12px;
  
  input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    font-size: 13px;
    
    &:focus { outline: none; border-color: #05A584; }
  }
  
  button {
    padding: 10px 20px;
    background: #05A584;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    
    &:hover { background: #048a6e; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
`;

// Sidebar Components
const SidebarCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 20px;
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: #94a3b8;
  }
  
  .refresh {
    margin-left: auto;
    cursor: pointer;
    color: #64748b;
    &:hover { color: #05A584; }
  }
`;

// AI Summary
const AISummarySection = styled.div`
  margin-bottom: 20px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 13px;
    line-height: 1.6;
    color: #64748b;
    margin: 0;
  }
`;

const KeyTakeaways = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #166534;
    margin: 0 0 12px 0;
  }
  
  ul {
    margin: 0;
    padding-left: 16px;
    
    li {
      font-size: 13px;
      line-height: 1.5;
      color: #166534;
      margin-bottom: 8px;
      
      &:last-child { margin-bottom: 0; }
    }
  }
`;

// Community Pulse
const CommunityPulse = styled.div`
  margin-bottom: 20px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const SentimentBar = styled.div`
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const SentimentSegment = styled.div<{ $color: string; $width: number }>`
  width: ${props => props.$width}%;
  background: ${props => props.$color};
`;

const SentimentLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 12px;
  
  .negative { color: #ef4444; }
  .neutral { color: #f59e0b; }
  .positive { color: #05A584; }
`;

const SentimentValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: #05A584;
`;

const PulseDescription = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
  margin: 12px 0 0 0;
`;

// Top Contributors
const ContributorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 10px;
  
  &:last-child { margin-bottom: 0; }
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
`;

const ContributorHandle = styled.div`
  font-size: 12px;
  color: #05A584;
`;

const ContributorBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
`;

const Badge = styled.span<{ $variant?: 'primary' | 'secondary' | 'accent' }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return 'background: #05A58420; color: #05A584;';
      case 'accent': return 'background: #F9731620; color: #F97316;';
      default: return 'background: #e2e8f0; color: #64748b;';
    }
  }}
  
  svg { width: 10px; height: 10px; }
`;

const ContributorTier = styled.div`
  text-align: right;
  
  .tier {
    font-size: 12px;
    color: #64748b;
  }
  
  .xp {
    font-size: 11px;
    color: #94a3b8;
  }
`;

// AI Suggestion Button
const AISuggestionBtn = styled.button`
  width: 100%;
  padding: 14px;
  background: #fef9c3;
  border: 1px solid #fde047;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #854d0e;
  cursor: pointer;
  
  &:hover {
    background: #fef08a;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    margin: 0;
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

interface Comment {
  id: string;
  discussionId: string;
  wallet: string;
  username: string;
  avatar: string;
  content: string;
  parentId: string | null;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  repliesCount: number;
  createdAt: string;
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

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }) + '  ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();
};

// ===================== MAIN COMPONENT =====================

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, walletAddress } = useWallet();
  const discussionId = params?.id as string;

  // State
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular' | 'most_replied' | 'verified' | 'controversial'>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});

  // Fetch discussion
  const fetchDiscussion = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/${discussionId}`);
      const data = await res.json();
      if (data.success) {
        setDiscussion(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch discussion:', err);
    }
  }, [discussionId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/${discussionId}/comments?sort=${sort}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }, [discussionId, sort]);

  // Fetch top contributors
  const fetchContributors = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/contributors/top?limit=5`);
      const data = await res.json();
      if (data.success) {
        setContributors(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contributors:', err);
    }
  }, []);

  // Load replies for a comment
  const loadReplies = async (commentId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/discussions/comments/${commentId}/replies`);
      const data = await res.json();
      if (data.success) {
        setRepliesMap(prev => ({ ...prev, [commentId]: data.data }));
      }
    } catch (err) {
      console.error('Failed to load replies:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDiscussion(),
        fetchComments(),
        fetchContributors(),
      ]);
      setLoading(false);
    };
    if (discussionId) loadData();
  }, [discussionId, fetchDiscussion, fetchComments, fetchContributors]);

  // Refetch comments when sort changes
  useEffect(() => {
    if (!loading) fetchComments();
  }, [sort]);

  // Vote on discussion
  const handleVote = async (type: 'up' | 'down') => {
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
      fetchDiscussion();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !walletAddress) return;
    try {
      await fetch(`${API_URL}/api/discussions/${discussionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ content: newComment }),
      });
      setNewComment('');
      fetchComments();
      fetchDiscussion();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Submit reply
  const handleSubmitReply = async (parentId: string) => {
    const content = replyInputs[parentId];
    if (!content?.trim() || !walletAddress) return;
    try {
      await fetch(`${API_URL}/api/discussions/${discussionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ content, parentId }),
      });
      setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
      setShowReplyInput(null);
      loadReplies(parentId);
      fetchComments();
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  // Like/dislike comment
  const handleCommentLike = async (commentId: string) => {
    if (!walletAddress) return;
    try {
      await fetch(`${API_URL}/api/discussions/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'x-wallet-address': walletAddress },
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleCommentDislike = async (commentId: string) => {
    if (!walletAddress) return;
    try {
      await fetch(`${API_URL}/api/discussions/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: { 'x-wallet-address': walletAddress },
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to dislike:', err);
    }
  };

  // Toggle replies
  const toggleReplies = (commentId: string) => {
    const newSet = new Set(expandedReplies);
    if (newSet.has(commentId)) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
      if (!repliesMap[commentId]) {
        loadReplies(commentId);
      }
    }
    setExpandedReplies(newSet);
  };

  const sortOptions = [
    { value: 'newest', label: 'Top (Default)' },
    { value: 'oldest', label: 'Newest' },
    { value: 'popular', label: 'Oldest' },
    { value: 'most_replied', label: 'Most Replied' },
    { value: 'verified', label: 'Verified Only' },
    { value: 'controversial', label: 'Controversial' },
  ];

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <EmptyState>
            <h3>Loading discussion...</h3>
          </EmptyState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (!discussion) {
    return (
      <PageContainer>
        <ContentWrapper>
          <EmptyState>
            <h3>Discussion not found</h3>
            <p>The topic you're looking for doesn't exist or has been removed.</p>
          </EmptyState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const hasUpvoted = walletAddress && discussion.upvotedBy?.includes(walletAddress.toLowerCase());
  const hasDownvoted = walletAddress && discussion.downvotedBy?.includes(walletAddress.toLowerCase());

  return (
    <PageContainer>
      <ContentWrapper>
        <MainContent>
          {/* Back Button */}
          <BackButton onClick={() => router.push('/arena/discussions')} data-testid="back-btn">
            <ArrowLeft />
            Back to Discussions
          </BackButton>

          {/* Topic Header */}
          <TopicCard data-testid="topic-card">
            <TopicTitle data-testid="topic-title">{discussion.title}</TopicTitle>
            
            <AuthorRow>
              <AuthorAvatar $url={discussion.avatar} />
              <AuthorInfo>
                <AuthorName>{discussion.username}</AuthorName>
                <AuthorMeta>@{discussion.username.toLowerCase().replace(/\s+/g, '')}</AuthorMeta>
              </AuthorInfo>
              <PublishDate>{formatDate(discussion.createdAt)}</PublishDate>
            </AuthorRow>

            {discussion.content && (
              <TopicContent>
                {discussion.content.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </TopicContent>
            )}

            <TopicStats>
              <StatButton 
                $active={hasUpvoted}
                onClick={() => handleVote('up')}
                data-testid="upvote-btn"
              >
                <span style={{ fontSize: '16px' }}>👍</span>
                {discussion.upvotedBy?.length || 0}
              </StatButton>
              <StatButton 
                $active={hasDownvoted}
                onClick={() => handleVote('down')}
                data-testid="downvote-btn"
              >
                <span style={{ fontSize: '16px' }}>👎</span>
                {discussion.downvotedBy?.length || 0}
              </StatButton>
              <ViewsCount>
                <Eye />
                {discussion.views}
              </ViewsCount>
              <StatButton>
                <Share2 />
              </StatButton>
            </TopicStats>

            {discussion.tags.length > 0 && (
              <TagsRow>
                {discussion.tags.map(tag => (
                  <Tag key={tag} $color={TAG_COLORS[tag]}>{tag}</Tag>
                ))}
              </TagsRow>
            )}
          </TopicCard>

          {/* Comments Section */}
          <CommentsSection data-testid="comments-section">
            <CommentInput>
              <input
                placeholder="Join the discussion..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                data-testid="comment-input"
              />
              <button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || !isConnected}
                data-testid="submit-comment-btn"
              >
                Post
              </button>
            </CommentInput>

            <SortRow>
              <span style={{ fontSize: 14, color: '#64748b' }}>
                {comments.length} comments
              </span>
              <SortDropdown>
                <SortButton onClick={() => setShowSortMenu(!showSortMenu)} data-testid="sort-btn">
                  Sort by: {sortOptions.find(o => o.value === sort)?.label}
                  <ChevronDown />
                </SortButton>
                <SortMenu $visible={showSortMenu}>
                  {sortOptions.map(option => (
                    <SortOption
                      key={option.value}
                      $active={sort === option.value}
                      onClick={() => {
                        setSort(option.value as any);
                        setShowSortMenu(false);
                      }}
                    >
                      {option.label}
                      <span className="check">✓</span>
                    </SortOption>
                  ))}
                </SortMenu>
              </SortDropdown>
            </SortRow>

            {/* Comments List */}
            {comments.length === 0 ? (
              <EmptyState>
                <h3>No comments yet</h3>
                <p>Be the first to share your thoughts!</p>
              </EmptyState>
            ) : (
              comments.map(comment => (
                <div key={comment.id}>
                  <CommentItem data-testid={`comment-${comment.id}`}>
                    <CommentHeader>
                      <CommentAvatar $url={comment.avatar}>
                        <LevelBadge>%</LevelBadge>
                      </CommentAvatar>
                      <CommentUserInfo>
                        <CommentUsername>{comment.username}</CommentUsername>
                        <CommentDate>{formatShortDate(comment.createdAt)}</CommentDate>
                      </CommentUserInfo>
                    </CommentHeader>

                    <CommentBody>{comment.content}</CommentBody>

                    <CommentActions>
                      <ActionBtn onClick={() => handleCommentLike(comment.id)} data-testid={`like-${comment.id}`}>
                        <span>👍</span>
                        {comment.likes}
                      </ActionBtn>
                      <ActionBtn onClick={() => handleCommentDislike(comment.id)} data-testid={`dislike-${comment.id}`}>
                        <span>👎</span>
                        {comment.dislikes}
                      </ActionBtn>
                      <ActionBtn onClick={() => setShowReplyInput(showReplyInput === comment.id ? null : comment.id)}>
                        Reply
                      </ActionBtn>
                      <ActionBtn>
                        <Share2 />
                      </ActionBtn>
                      <ActionBtn>
                        <MoreHorizontal />
                      </ActionBtn>
                    </CommentActions>

                    {showReplyInput === comment.id && (
                      <ReplyInputWrapper>
                        <input
                          placeholder="Write a reply..."
                          value={replyInputs[comment.id] || ''}
                          onChange={e => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleSubmitReply(comment.id)}
                          data-testid={`reply-input-${comment.id}`}
                        />
                        <button 
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyInputs[comment.id]?.trim()}
                          data-testid={`submit-reply-${comment.id}`}
                        >
                          Reply
                        </button>
                      </ReplyInputWrapper>
                    )}

                    {comment.repliesCount > 0 && (
                      <RepliesToggle onClick={() => toggleReplies(comment.id)} data-testid={`toggle-replies-${comment.id}`}>
                        <span className="line" />
                        {expandedReplies.has(comment.id) ? 'Hide replies' : `View ${comment.repliesCount} replies`}
                      </RepliesToggle>
                    )}
                  </CommentItem>

                  {/* Nested Replies */}
                  {expandedReplies.has(comment.id) && repliesMap[comment.id]?.map(reply => (
                    <CommentItem key={reply.id} $isReply $depth={1} data-testid={`reply-${reply.id}`}>
                      <CommentHeader>
                        <CommentAvatar $url={reply.avatar}>
                          <LevelBadge>%</LevelBadge>
                        </CommentAvatar>
                        <CommentUserInfo>
                          <CommentUsername>{reply.username}</CommentUsername>
                          <CommentDate>{formatShortDate(reply.createdAt)}</CommentDate>
                        </CommentUserInfo>
                      </CommentHeader>

                      <CommentBody>{reply.content}</CommentBody>

                      <CommentActions>
                        <ActionBtn onClick={() => handleCommentLike(reply.id)}>
                          <span>👍</span>
                          {reply.likes}
                        </ActionBtn>
                        <ActionBtn onClick={() => handleCommentDislike(reply.id)}>
                          <span>👎</span>
                          {reply.dislikes}
                        </ActionBtn>
                        <ActionBtn onClick={() => setShowReplyInput(showReplyInput === reply.id ? null : reply.id)}>
                          Reply
                        </ActionBtn>
                        <ActionBtn>
                          <Share2 />
                        </ActionBtn>
                        <ActionBtn>
                          <MoreHorizontal />
                        </ActionBtn>
                      </CommentActions>

                      {showReplyInput === reply.id && (
                        <ReplyInputWrapper>
                          <input
                            placeholder="Write a reply..."
                            value={replyInputs[reply.id] || ''}
                            onChange={e => setReplyInputs(prev => ({ ...prev, [reply.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleSubmitReply(comment.id)}
                          />
                          <button 
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyInputs[reply.id]?.trim()}
                          >
                            Reply
                          </button>
                        </ReplyInputWrapper>
                      )}
                    </CommentItem>
                  ))}
                </div>
              ))
            )}
          </CommentsSection>
        </MainContent>

        {/* Sidebar */}
        <Sidebar>
          {/* AI Summary */}
          <SidebarCard>
            <SidebarTitle>
              <h3>AI Summary</h3>
              <Info />
              <RefreshCw className="refresh" />
            </SidebarTitle>

            <AISummarySection>
              <h4>Post overview</h4>
              <p>
                This post introduces a discussion topic related to {discussion.tags[0] || 'crypto'} and {discussion.tags[1] || 'blockchain'}. 
                The author shares insights and invites community participation.
              </p>
            </AISummarySection>

            <KeyTakeaways>
              <h4>Key takeaways</h4>
              <ul>
                <li>Community finds the topic valuable for real-time insights</li>
                <li>Several users compared perspectives and shared experiences</li>
                <li>The main discussion centers around practical applications</li>
              </ul>
            </KeyTakeaways>

            <CommunityPulse>
              <h4>
                Community pulse
                <Info size={14} />
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Sentiment</span>
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
              <PulseDescription>
                Most participants have significant experience, indicating they're <strong>engaged community members</strong> with a focus on quality discussions.
              </PulseDescription>
            </CommunityPulse>
          </SidebarCard>

          {/* Top Contributors */}
          <SidebarCard>
            <SidebarTitle>
              <h3>Top Contributors</h3>
            </SidebarTitle>
            
            {contributors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                <Award size={32} style={{ marginBottom: 8, color: '#cbd5e1' }} />
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
                      <Badge $variant="primary">
                        👍 {contributor.upvotes || 0} likes
                      </Badge>
                      <Badge>
                        💬 {contributor.comments || 0} comments
                      </Badge>
                    </ContributorBadges>
                  </ContributorInfo>
                </ContributorItem>
              ))
            )}
          </SidebarCard>

          {/* AI Suggestion */}
          <AISuggestionBtn data-testid="ai-suggestion-btn">
            Generate AI Comment Suggestion
          </AISuggestionBtn>
        </Sidebar>
      </ContentWrapper>
    </PageContainer>
  );
}
