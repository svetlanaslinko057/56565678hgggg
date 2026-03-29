'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { X, ThumbsUp, ThumbsDown, Eye, Share2, MessageSquare, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/wagmi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ===================== STYLED COMPONENTS =====================

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  justify-content: flex-end;
  z-index: 1000;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 720px;
  height: 100%;
  background: #f8fafc;
  overflow-y: auto;
  box-shadow: -4px 0 30px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderSpacer = styled.div`
  flex: 1;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: #64748b;
  }
`;

const Content = styled.div`
  padding: 24px;
`;

const DiscussionCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px 0;
  line-height: 1.3;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const Avatar = styled.div<{ $url?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
  flex-shrink: 0;
`;

const AuthorInfo = styled.div`
  flex: 1;
`;

const AuthorName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

const AuthorHandle = styled.div`
  font-size: 13px;
  color: #05A584;
`;

const DateText = styled.div`
  font-size: 13px;
  color: #94a3b8;
`;

const ContentText = styled.div`
  font-size: 15px;
  color: #334155;
  line-height: 1.7;
  margin-bottom: 20px;
  white-space: pre-wrap;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
`;

const StatButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatButton = styled.button<{ $active?: boolean; $type?: 'like' | 'dislike' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid ${({ $active, $type }) => 
    $active ? ($type === 'like' ? '#05A584' : '#ef4444') : '#e2e8f0'};
  background: ${({ $active, $type }) => 
    $active ? ($type === 'like' ? 'rgba(5, 165, 132, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'white'};
  color: ${({ $active, $type }) => 
    $active ? ($type === 'like' ? '#05A584' : '#ef4444') : '#64748b'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ $type }) => $type === 'like' ? '#05A584' : '#ef4444'};
    color: ${({ $type }) => $type === 'like' ? '#05A584' : '#ef4444'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ViewsAndShare = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: #94a3b8;
  font-size: 13px;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ViewCount = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #64748b;
  }
`;

const TagsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const Tag = styled.span<{ $color?: string }>`
  padding: 6px 12px;
  background: ${({ $color }) => $color ? `${$color}15` : '#f1f5f9'};
  color: ${({ $color }) => $color || '#64748b'};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
`;

// Comments Section
const CommentsSection = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const CommentInputWrapper = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const CommentInputRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const CommentInput = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  min-height: 60px;
  resize: none;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const PostButton = styled.button`
  padding: 12px 20px;
  background: #05A584;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #048a6e;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
`;

const CommentsCount = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const SortSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
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

const CommentItem = styled.div`
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
  margin-bottom: 8px;
`;

const CommentAvatar = styled.div<{ $url?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $url }) => $url ? `url(${$url}) center/cover` : '#e2e8f0'};
`;

const CommentAuthor = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const CommentTime = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

const CommentContent = styled.p`
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
  margin: 0;
`;

const CommentActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const CommentActionBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${({ $active }) => $active ? '#05A584' : '#94a3b8'};
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    color: #64748b;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyComments = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #64748b;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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
  wallet: string;
  username: string;
  avatar: string;
  content: string;
  likes: number;
  likedBy: string[];
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  return `${diffDays}d ago`;
};

// ===================== COMPONENT =====================

interface ViewDiscussionPanelProps {
  discussionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewDiscussionPanel: React.FC<ViewDiscussionPanelProps> = ({
  discussionId,
  isOpen,
  onClose,
}) => {
  const { walletAddress } = useWallet();
  
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [sortBy, setSortBy] = useState('top');

  // Fetch discussion
  const fetchDiscussion = useCallback(async () => {
    if (!discussionId) return;
    
    setLoading(true);
    try {
      const [discRes, commentsRes] = await Promise.all([
        fetch(`${API_URL}/api/discussions/${discussionId}`),
        fetch(`${API_URL}/api/discussions/${discussionId}/comments?sort=${sortBy}`),
      ]);
      
      const [discData, commentsData] = await Promise.all([
        discRes.json(),
        commentsRes.json(),
      ]);
      
      if (discData.success) {
        setDiscussion(discData.data);
      }
      if (commentsData.success) {
        setComments(commentsData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch discussion:', err);
    } finally {
      setLoading(false);
    }
  }, [discussionId, sortBy]);

  useEffect(() => {
    if (isOpen && discussionId) {
      fetchDiscussion();
    }
  }, [isOpen, discussionId, fetchDiscussion]);

  // Vote
  const handleVote = async (type: 'up' | 'down') => {
    if (!walletAddress || !discussionId) return;
    
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

  // Post comment
  const handlePostComment = async () => {
    if (!walletAddress || !commentText.trim() || !discussionId) return;
    
    setPostingComment(true);
    try {
      await fetch(`${API_URL}/api/discussions/${discussionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      setCommentText('');
      fetchDiscussion();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  // Like comment
  const handleLikeComment = async (commentId: string) => {
    if (!walletAddress) return;
    
    try {
      await fetch(`${API_URL}/api/discussions/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'x-wallet-address': walletAddress,
        },
      });
      fetchDiscussion();
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  if (!isOpen) return null;

  const hasLiked = discussion && walletAddress && discussion.upvotedBy?.includes(walletAddress.toLowerCase());
  const hasDisliked = discussion && walletAddress && discussion.downvotedBy?.includes(walletAddress.toLowerCase());
  const likesCount = discussion?.upvotedBy?.length || 0;
  const dislikesCount = discussion?.downvotedBy?.length || 0;

  return (
    <Overlay $isOpen={isOpen} onClick={onClose} data-testid="discussion-panel">
      <Panel onClick={e => e.stopPropagation()}>
        <Header>
          <BackButton onClick={onClose} data-testid="back-btn">
            <ArrowLeft />
            Back
          </BackButton>
          <HeaderSpacer />
          <CloseButton onClick={onClose} data-testid="close-panel-btn">
            <X />
          </CloseButton>
        </Header>

        <Content>
          {loading ? (
            <LoadingState>
              <Loader2 size={32} />
            </LoadingState>
          ) : discussion ? (
            <>
              <DiscussionCard>
                <Title>{discussion.title}</Title>
                
                <AuthorRow>
                  <Avatar $url={discussion.avatar} />
                  <AuthorInfo>
                    <AuthorName>{discussion.username}</AuthorName>
                    <AuthorHandle>@{discussion.username.toLowerCase().replace(/\s/g, '_')}</AuthorHandle>
                  </AuthorInfo>
                  <DateText>{formatDate(discussion.createdAt)}</DateText>
                </AuthorRow>
                
                {discussion.content && (
                  <ContentText>{discussion.content}</ContentText>
                )}
                
                <StatsRow>
                  <StatButtons>
                    <StatButton 
                      $active={hasLiked} 
                      $type="like"
                      onClick={() => handleVote('up')}
                      data-testid="like-btn"
                    >
                      <ThumbsUp /> {likesCount}
                    </StatButton>
                    <StatButton 
                      $active={hasDisliked} 
                      $type="dislike"
                      onClick={() => handleVote('down')}
                      data-testid="dislike-btn"
                    >
                      <ThumbsDown /> {dislikesCount}
                    </StatButton>
                  </StatButtons>
                  
                  <ViewsAndShare>
                    <ViewCount>
                      <Eye /> {discussion.views}
                    </ViewCount>
                    <ShareButton onClick={() => navigator.clipboard.writeText(window.location.href)}>
                      <Share2 />
                    </ShareButton>
                  </ViewsAndShare>
                </StatsRow>
                
                {discussion.tags && discussion.tags.length > 0 && (
                  <TagsRow>
                    {discussion.tags.map(tag => (
                      <Tag key={tag} $color={TAG_COLORS[tag]}>{tag}</Tag>
                    ))}
                  </TagsRow>
                )}
              </DiscussionCard>

              <CommentsSection>
                <CommentInputWrapper>
                  <CommentInputRow>
                    <CommentInput
                      placeholder="Join the discussion..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      data-testid="comment-input"
                    />
                    <PostButton 
                      onClick={handlePostComment}
                      disabled={!commentText.trim() || postingComment || !walletAddress}
                      data-testid="post-comment-btn"
                    >
                      {postingComment ? 'Posting...' : 'Post'}
                    </PostButton>
                  </CommentInputRow>
                </CommentInputWrapper>
                
                <CommentsHeader>
                  <CommentsCount>{comments.length} comments</CommentsCount>
                  <SortSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="top">Sort by: Top (Default)</option>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </SortSelect>
                </CommentsHeader>
                
                <CommentsList>
                  {comments.length === 0 ? (
                    <EmptyComments>
                      No comments yet. Be the first to share your thoughts!
                    </EmptyComments>
                  ) : (
                    comments.map(comment => {
                      const commentLiked = walletAddress && comment.likedBy?.includes(walletAddress.toLowerCase());
                      return (
                        <CommentItem key={comment.id}>
                          <CommentHeader>
                            <CommentAvatar $url={comment.avatar} />
                            <CommentAuthor>{comment.username}</CommentAuthor>
                            <CommentTime>{formatTimeAgo(comment.createdAt)}</CommentTime>
                          </CommentHeader>
                          <CommentContent>{comment.content}</CommentContent>
                          <CommentActions>
                            <CommentActionBtn 
                              $active={commentLiked}
                              onClick={() => handleLikeComment(comment.id)}
                            >
                              <ThumbsUp /> {comment.likes || 0}
                            </CommentActionBtn>
                            <CommentActionBtn>
                              <MessageSquare /> Reply
                            </CommentActionBtn>
                          </CommentActions>
                        </CommentItem>
                      );
                    })
                  )}
                </CommentsList>
              </CommentsSection>
            </>
          ) : (
            <EmptyComments>Discussion not found</EmptyComments>
          )}
        </Content>
      </Panel>
    </Overlay>
  );
};

export default ViewDiscussionPanel;
