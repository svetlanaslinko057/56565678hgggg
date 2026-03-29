'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface CommentType {
  id: string;
  marketId: string;
  wallet: string;
  username: string;
  avatar: string;
  content: string;
  parentId: string | null;
  likes: number;
  dislikes: number;
  repliesCount: number;
  createdAt: string;
}

interface CommentsBlockProps {
  marketId: string;
}

// Styled Components - точно по дизайну
const CommentsWrapper = styled.div`
  margin-top: 40px;
  padding: 40px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #EEF1F5;
`;

const CommentsHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
`;

const CommentsTitle = styled.h3`
  font-size: 28px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0;
`;

const CommentsSubtitle = styled.span`
  font-size: 14px;
  color: #9CA3AF;
  margin-left: 8px;
`;

const ThreadLink = styled.a`
  font-size: 14px;
  color: #05A584;
  text-decoration: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const CommentsCount = styled.span`
  font-size: 28px;
  font-weight: 400;
  color: #9CA3AF;
`;

const InputWrapper = styled.div`
  margin-bottom: 24px;
`;

const CommentInputBox = styled.div`
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  background: #fff;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #10B981;
  }
`;

const CommentInput = styled.input`
  flex: 1;
  border: none;
  font-size: 14px;
  color: #0F172A;
  background: transparent;

  &::placeholder {
    color: #9CA3AF;
  }

  &:focus {
    outline: none;
  }
`;

const SendIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #10B981;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CountAndFilter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CommentCountText = styled.span`
  font-size: 14px;
  color: #64748B;
`;

const FilterDropdown = styled.div`
  position: relative;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 14px;
  color: #64748B;
  cursor: pointer;
  padding: 4px 8px;

  &:hover {
    color: #0F172A;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FilterMenu = styled.div<{ $visible: boolean }>`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: ${props => props.$visible ? 'block' : 'none'};
  min-width: 100px;
`;

const FilterOption = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: ${props => props.$active ? '#F3F4F6' : 'none'};
  border: none;
  font-size: 14px;
  color: #0F172A;
  cursor: pointer;

  &:hover {
    background: #F3F4F6;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #EEF1F5;
  margin-bottom: 24px;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const CommentItem = styled.div<{ $isReply?: boolean }>`
  padding: ${props => props.$isReply ? '20px 0 20px 40px' : '28px 0'};
  border-bottom: 1px solid #EEF1F5;

  &:last-child {
    border-bottom: none;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid #14B8A6;
  object-fit: cover;
  background: #fff;
`;

const BadgeIcon = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #F472B6 0%, #EC4899 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: white;
  border: 2px solid white;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Username = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
`;

const CommentDate = styled.span`
  font-size: 13px;
  color: #9CA3AF;
`;

const CommentContent = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  margin: 0 0 16px 0;
  padding-left: 60px;
`;

const CommentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding-left: 60px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 14px;
  color: #64748B;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;

  &:hover {
    color: #0F172A;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ReplyText = styled.span`
  font-size: 14px;
  color: #64748B;
  cursor: pointer;

  &:hover {
    color: #0F172A;
  }
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;

  &:hover {
    color: #64748B;
  }
`;

const ViewRepliesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 60px;
  margin-top: 12px;
`;

const RepliesLine = styled.div`
  width: 24px;
  height: 1px;
  background: #D1D5DB;
`;

const ViewRepliesButton = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: #64748B;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #0F172A;
  }
`;

const RepliesWrapper = styled.div`
  margin-left: 60px;
  border-left: 2px solid #E5E7EB;
  margin-top: 16px;
`;

const ReplyInputWrapper = styled.div`
  margin-left: 60px;
  margin-top: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ReplyInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  font-size: 13px;
  color: #0F172A;

  &::placeholder {
    color: #9CA3AF;
  }

  &:focus {
    outline: none;
    border-color: #10B981;
  }
`;

const ReplyButton = styled.button`
  padding: 10px 20px;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #9CA3AF;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #64748B;
  font-size: 14px;
`;

// Icons as SVG components
const ThumbUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const ThumbDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const SendIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

// Format date like "Jan 07, 2025 03:32 pm"
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  const hourStr = String(hour12).padStart(2, '0');
  
  return `${month} ${day}, ${year} ${hourStr}:${minutes} ${ampm}`;
};

// Comment Component
const Comment: React.FC<{
  comment: CommentType;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onReply: (id: string, content: string) => void;
  isReply?: boolean;
  wallet?: string;
}> = ({ comment, onLike, onDislike, onReply, isReply = false, wallet }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentType[]>([]);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);

  const loadReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const res = await fetch(`${API_BASE}/api/comments/${comment.id}/replies`);
      const data = await res.json();
      if (data.success) {
        setReplies(data.data);
      }
    } catch (err) {
      console.error('Failed to load replies:', err);
    }
    setLoadingReplies(false);
  };

  const handleViewReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
    setTimeout(loadReplies, 500);
  };

  return (
    <CommentItem $isReply={isReply} data-testid={`comment-${comment.id}`}>
      <CommentHeader>
        <AvatarWrapper>
          <Avatar src={comment.avatar} alt={comment.username} />
          <BadgeIcon>%</BadgeIcon>
        </AvatarWrapper>
        <UserInfo>
          <Username>{comment.username}</Username>
          <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
        </UserInfo>
      </CommentHeader>

      <CommentContent>{comment.content}</CommentContent>

      <CommentActions>
        <ActionButton onClick={() => onLike(comment.id)} data-testid={`like-btn-${comment.id}`}>
          <ThumbUpIcon />
          {comment.likes}
        </ActionButton>
        <ActionButton onClick={() => onDislike(comment.id)} data-testid={`dislike-btn-${comment.id}`}>
          <ThumbDownIcon />
          {comment.dislikes}
        </ActionButton>
        <ReplyText onClick={() => setShowReplyInput(!showReplyInput)} data-testid={`reply-btn-${comment.id}`}>
          Reply
        </ReplyText>
        <MoreButton>
          <MoreIcon />
        </MoreButton>
      </CommentActions>

      {showReplyInput && (
        <ReplyInputWrapper>
          <ReplyInput
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            data-testid={`reply-input-${comment.id}`}
          />
          <ReplyButton onClick={handleReply} disabled={!replyContent.trim()} data-testid={`submit-reply-${comment.id}`}>
            Reply
          </ReplyButton>
        </ReplyInputWrapper>
      )}

      {!isReply && comment.repliesCount > 0 && (
        <ViewRepliesWrapper>
          <RepliesLine />
          <ViewRepliesButton onClick={handleViewReplies} data-testid={`view-replies-${comment.id}`}>
            {showReplies ? 'Hide replies' : `View replies (${comment.repliesCount})`}
          </ViewRepliesButton>
        </ViewRepliesWrapper>
      )}

      {showReplies && replies.length > 0 && (
        <RepliesWrapper>
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onDislike={onDislike}
              onReply={onReply}
              isReply
              wallet={wallet}
            />
          ))}
        </RepliesWrapper>
      )}
    </CommentItem>
  );
};

// Main Component
const CommentsBlock: React.FC<CommentsBlockProps> = ({ marketId }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [userWallet, setUserWallet] = useState<string>('');

  // Generate or get guest wallet for commenting
  useEffect(() => {
    // Try to get connected wallet first
    const connectedWallet = localStorage.getItem('arenaWallet');
    if (connectedWallet) {
      setUserWallet(connectedWallet);
      return;
    }
    
    // Otherwise use guest ID
    let guestId = localStorage.getItem('guestCommentId');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('guestCommentId', guestId);
    }
    setUserWallet(guestId);
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/market/${marketId}?sort=${sort}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
    setLoading(false);
  }, [marketId, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !userWallet) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/comments/market/${marketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': userWallet,
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!userWallet) return;
    try {
      await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'x-wallet-address': userWallet },
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!userWallet) return;
    try {
      await fetch(`${API_BASE}/api/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: { 'x-wallet-address': userWallet },
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to dislike:', err);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!userWallet || !content.trim()) return;
    try {
      await fetch(`${API_BASE}/api/comments/market/${marketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': userWallet,
        },
        body: JSON.stringify({ content, parentId }),
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const sortLabels: Record<string, string> = {
    newest: 'All',
    oldest: 'Oldest',
    popular: 'Popular',
  };

  return (
    <CommentsWrapper data-testid="comments-block">
      <CommentsHeader>
        <CommentsTitle>Comments</CommentsTitle>
        <CommentsCount>{total}</CommentsCount>
      </CommentsHeader>

      <InputWrapper>
        <CommentInputBox>
          <CommentInput
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            data-testid="comment-input"
          />
          <SendIcon 
            onClick={handleSubmitComment} 
            disabled={!newComment.trim()}
            data-testid="submit-comment-btn"
          >
            <SendIconSvg />
          </SendIcon>
        </CommentInputBox>
      </InputWrapper>

      <CountAndFilter>
        <CommentCountText>{total} comments</CommentCountText>
        <FilterDropdown>
          <FilterButton onClick={() => setShowFilterMenu(!showFilterMenu)} data-testid="filter-btn">
            {sortLabels[sort]}
            <ChevronDownIcon />
          </FilterButton>
          <FilterMenu $visible={showFilterMenu}>
            <FilterOption
              $active={sort === 'newest'}
              onClick={() => { setSort('newest'); setShowFilterMenu(false); }}
            >
              All
            </FilterOption>
            <FilterOption
              $active={sort === 'oldest'}
              onClick={() => { setSort('oldest'); setShowFilterMenu(false); }}
            >
              Oldest
            </FilterOption>
            <FilterOption
              $active={sort === 'popular'}
              onClick={() => { setSort('popular'); setShowFilterMenu(false); }}
            >
              Popular
            </FilterOption>
          </FilterMenu>
        </FilterDropdown>
      </CountAndFilter>

      <Divider />

      <CommentsList>
        {loading ? (
          <EmptyState>Loading comments...</EmptyState>
        ) : comments.length === 0 ? (
          <EmptyState>No comments yet. Be the first to comment!</EmptyState>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onLike={handleLike}
              onDislike={handleDislike}
              onReply={handleReply}
              wallet={userWallet}
            />
          ))
        )}
      </CommentsList>
    </CommentsWrapper>
  );
};

export default CommentsBlock;
