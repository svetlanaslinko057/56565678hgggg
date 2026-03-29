'use client';

import React from 'react';
import styled from 'styled-components';
import { useVoting } from '@/hooks/useVoting';
import { AlertTriangle, Clock, CheckCircle, XCircle, Users } from 'lucide-react';

interface VotingPanelProps {
  marketId: string;
  outcomes: Array<{ id: string; label: string }>;
  walletAddress?: string;
  onVoteSuccess?: () => void;
}

const VotingContainer = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
`;

const VotingHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const WarningIcon = styled.span`
  font-size: 24px;
`;

const Title = styled.h3`
  margin: 0;
  color: #92400e;
  font-weight: 700;
  font-size: 18px;
`;

const DisputeReason = styled.p`
  color: #a16207;
  margin-bottom: 16px;
  font-size: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
`;

const VotingLabel = styled.div`
  font-size: 14px;
  color: #92400e;
  margin-bottom: 12px;
  font-weight: 600;
`;

const VoteButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const VoteButton = styled.button<{ $isVoted?: boolean; $disabled?: boolean }>`
  flex: 1 1 auto;
  min-width: 140px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 2px solid ${props => props.$isVoted ? '#059669' : '#d97706'};
  background: ${props => props.$isVoted ? '#d1fae5' : '#fff'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled && !props.$isVoted ? 0.6 : 1};
  transition: all 0.2s ease;
  text-align: center;

  &:hover:not(:disabled) {
    transform: ${props => !props.$disabled ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => !props.$disabled ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
  }
`;

const VoteLabel = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 4px;
`;

const VotePercentage = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #f59e0b;
  margin: 8px 0;
`;

const VoteCount = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const YourVoteBadge = styled.div`
  margin-top: 8px;
  color: #059669;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const ProgressContainer = styled.div`
  margin-bottom: 20px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #92400e;
  margin-bottom: 6px;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #fef3c7;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
`;

const ProgressFill = styled.div<{ $percentage: number; $color: string }>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: ${props => props.$color};
  transition: width 0.3s ease;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
`;

const StatBlock = styled.div<{ $alignRight?: boolean }>`
  text-align: ${props => props.$alignRight ? 'right' : 'left'};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #92400e;
`;

const StatValue = styled.div<{ $highlight?: boolean }>`
  font-weight: 700;
  color: ${props => props.$highlight ? '#dc2626' : '#1f2937'};
`;

const TimerDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: #dc2626;
`;

const VotingClosedBanner = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #dcfce7;
  border-radius: 8px;
  text-align: center;
  color: #059669;
  font-weight: 600;
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: #fee2e2;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 12px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px;
  color: #f59e0b;
`;

const ConnectWalletMessage = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  text-align: center;
  color: #92400e;
  font-weight: 500;
`;

export const VotingPanel: React.FC<VotingPanelProps> = ({
  marketId,
  outcomes,
  walletAddress,
  onVoteSuccess,
}) => {
  const {
    votingStatus,
    loading,
    error,
    castVote,
    timeLeft,
    yesPercentage,
    noPercentage,
  } = useVoting(marketId, walletAddress);

  const [voting, setVoting] = React.useState(false);
  const [voteError, setVoteError] = React.useState<string | null>(null);

  const handleVote = async (choice: 'yes' | 'no') => {
    setVoting(true);
    setVoteError(null);

    try {
      const success = await castVote(choice);
      if (success) {
        onVoteSuccess?.();
      }
    } catch (e: any) {
      setVoteError(e.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <VotingContainer>
        <LoadingSpinner>Loading voting status...</LoadingSpinner>
      </VotingContainer>
    );
  }

  const isVotingActive = votingStatus?.isVotingOpen;
  const hasVoted = votingStatus?.user?.hasVoted;
  const userVote = votingStatus?.user?.vote;
  const totalVotes = votingStatus?.totalVotes || 0;
  const yesVotes = votingStatus?.voteCounts?.yes || 0;
  const noVotes = votingStatus?.voteCounts?.no || 0;
  const hasNFT = votingStatus?.user?.hasNFT;
  const nftBalance = (votingStatus?.user as any)?.nftBalance || 0;
  const canVote = votingStatus?.user?.canVote;

  return (
    <VotingContainer data-testid="voting-panel">
      <VotingHeader>
        <WarningIcon>⚠️</WarningIcon>
        <Title>Market Under Dispute</Title>
      </VotingHeader>

      {votingStatus?.disputeReason && (
        <DisputeReason>
          <strong>Dispute Reason:</strong> {votingStatus.disputeReason}
        </DisputeReason>
      )}

      {(error || voteError) && (
        <ErrorMessage>
          <XCircle size={14} style={{ marginRight: 6 }} />
          {error || voteError}
        </ErrorMessage>
      )}

      {!walletAddress && (
        <ConnectWalletMessage>
          Connect your wallet to participate in voting
        </ConnectWalletMessage>
      )}

      {walletAddress && !hasNFT && (
        <div style={{
          padding: '16px',
          background: '#fef3c7',
          borderRadius: '10px',
          border: '1px solid #f59e0b',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
          <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
            NFT Required to Vote
          </div>
          <div style={{ fontSize: '12px', color: '#a16207' }}>
            Get a position on any market to participate in community voting.
            Your voice matters - only NFT holders can decide dispute outcomes.
          </div>
        </div>
      )}

      {walletAddress && hasNFT && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: '#dcfce7',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '12px',
          color: '#059669',
        }}>
          <CheckCircle size={14} />
          <span>NFT Verified ({nftBalance} position{nftBalance !== 1 ? 's' : ''})</span>
        </div>
      )}

      {isVotingActive && walletAddress && hasNFT && (
        <>
          <VotingLabel>Vote for the correct outcome:</VotingLabel>
          <VoteButtonsContainer>
            <VoteButton
              onClick={() => handleVote('yes')}
              disabled={voting || hasVoted || !isVotingActive}
              $isVoted={userVote === 'yes'}
              $disabled={voting || hasVoted}
              data-testid="vote-yes-btn"
            >
              <VoteLabel>YES</VoteLabel>
              <VotePercentage>{yesPercentage.toFixed(0)}%</VotePercentage>
              <VoteCount>{yesVotes} votes</VoteCount>
              {userVote === 'yes' && (
                <YourVoteBadge>
                  <CheckCircle size={14} /> Your vote
                </YourVoteBadge>
              )}
            </VoteButton>

            <VoteButton
              onClick={() => handleVote('no')}
              disabled={voting || hasVoted || !isVotingActive || !canVote}
              $isVoted={userVote === 'no'}
              $disabled={voting || hasVoted || !canVote}
              data-testid="vote-no-btn"
            >
              <VoteLabel>NO</VoteLabel>
              <VotePercentage>{noPercentage.toFixed(0)}%</VotePercentage>
              <VoteCount>{noVotes} votes</VoteCount>
              {userVote === 'no' && (
                <YourVoteBadge>
                  <CheckCircle size={14} /> Your vote
                </YourVoteBadge>
              )}
            </VoteButton>
          </VoteButtonsContainer>
        </>
      )}

      <ProgressContainer>
        <ProgressLabel>
          <span>YES ({yesPercentage.toFixed(1)}%)</span>
          <span>NO ({noPercentage.toFixed(1)}%)</span>
        </ProgressLabel>
        <ProgressBar>
          <ProgressFill $percentage={yesPercentage} $color="#059669" />
          <ProgressFill $percentage={noPercentage} $color="#dc2626" />
        </ProgressBar>
      </ProgressContainer>

      <StatsContainer>
        <StatBlock>
          <StatLabel>
            <Users size={12} style={{ marginRight: 4 }} />
            Total Votes
          </StatLabel>
          <StatValue>{totalVotes}</StatValue>
        </StatBlock>

        <StatBlock $alignRight>
          <StatLabel>
            <Clock size={12} style={{ marginRight: 4 }} />
            {isVotingActive ? 'Voting ends in' : 'Voting ended'}
          </StatLabel>
          {isVotingActive && !timeLeft.expired ? (
            <TimerDisplay>
              {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </TimerDisplay>
          ) : (
            <StatValue>
              {votingStatus?.votingDeadline
                ? new Date(votingStatus.votingDeadline).toLocaleString()
                : 'Ended'}
            </StatValue>
          )}
        </StatBlock>
      </StatsContainer>

      {!isVotingActive && votingStatus?.voting?.status === 'finished' && (
        <VotingClosedBanner>
          <CheckCircle size={16} style={{ marginRight: 6 }} />
          Voting closed. Final outcome: {votingStatus.voting.result?.toUpperCase() || 'Determined'}
        </VotingClosedBanner>
      )}

      {hasVoted && isVotingActive && (
        <VotingClosedBanner style={{ background: '#dbeafe', color: '#1d4ed8' }}>
          <CheckCircle size={16} style={{ marginRight: 6 }} />
          Your vote has been recorded. Results will be finalized when voting ends.
        </VotingClosedBanner>
      )}
    </VotingContainer>
  );
};

export default VotingPanel;
