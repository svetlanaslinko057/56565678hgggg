'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface VotingStatus {
  marketId: string;
  marketStatus: string;
  voting: {
    status: 'idle' | 'active' | 'finished';
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    endsAt: string | null;
    result: string | null;
    startedAt: string | null;
  };
  user: {
    canVote: boolean;
    hasVoted: boolean;
    vote: string | null;
    hasNFT: boolean;
  };
  voteCounts: {
    yes: number;
    no: number;
  };
  votePercentages: {
    yes: number;
    no: number;
  };
  totalVotes: number;
  isVotingOpen: boolean;
  votingDeadline: string | null;
  disputeReason?: string;
}

export interface UseVotingReturn {
  votingStatus: VotingStatus | null;
  loading: boolean;
  error: string | null;
  castVote: (choice: 'yes' | 'no') => Promise<boolean>;
  refreshVoting: () => Promise<void>;
  timeLeft: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    expired: boolean;
  };
  yesPercentage: number;
  noPercentage: number;
}

export function useVoting(marketId: string, walletAddress?: string): UseVotingReturn {
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    expired: false,
  });

  // Fetch voting status
  const fetchVotingStatus = useCallback(async () => {
    if (!marketId) return;
    
    try {
      const walletParam = walletAddress ? `?wallet=${walletAddress}` : '';
      const res = await fetch(`${API_URL}/api/predictions/${marketId}/voting${walletParam}`);
      const data = await res.json();
      
      if (data.success) {
        setVotingStatus(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch voting status');
      }
    } catch (e) {
      console.error('Failed to fetch voting status:', e);
      setError('Failed to fetch voting status');
    } finally {
      setLoading(false);
    }
  }, [marketId, walletAddress]);

  // Initial fetch
  useEffect(() => {
    fetchVotingStatus();
  }, [fetchVotingStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!marketId || votingStatus?.voting?.status !== 'active') return;
    
    const interval = setInterval(fetchVotingStatus, 30000);
    return () => clearInterval(interval);
  }, [marketId, votingStatus?.voting?.status, fetchVotingStatus]);

  // Countdown timer
  useEffect(() => {
    if (!votingStatus?.votingDeadline) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, expired: true });
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(votingStatus.votingDeadline!).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, expired: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, totalSeconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [votingStatus?.votingDeadline]);

  // Cast vote
  const castVote = useCallback(async (choice: 'yes' | 'no'): Promise<boolean> => {
    if (!marketId || !walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/api/predictions/${marketId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          outcomeId: choice === 'yes' ? '1' : '2',
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        // Refresh voting status after vote
        await fetchVotingStatus();
        return true;
      } else {
        setError(data.message || 'Failed to cast vote');
        return false;
      }
    } catch (e) {
      console.error('Failed to cast vote:', e);
      setError('Failed to cast vote');
      return false;
    }
  }, [marketId, walletAddress, fetchVotingStatus]);

  // Calculate percentages
  const totalVotes = votingStatus?.totalVotes || 0;
  const yesPercentage = totalVotes > 0 
    ? (votingStatus?.voteCounts?.yes || 0) / totalVotes * 100 
    : 50;
  const noPercentage = totalVotes > 0 
    ? (votingStatus?.voteCounts?.no || 0) / totalVotes * 100 
    : 50;

  return {
    votingStatus,
    loading,
    error,
    castVote,
    refreshVoting: fetchVotingStatus,
    timeLeft,
    yesPercentage,
    noPercentage,
  };
}

export default useVoting;
