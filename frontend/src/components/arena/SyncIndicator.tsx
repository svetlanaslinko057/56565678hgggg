'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { OnchainStatsAPI, IndexerStatus } from '@/lib/api/onchainApi';

const StatusContainer = styled.div<{ $synced: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${props => props.$synced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
  border: 1px solid ${props => props.$synced ? '#10b981' : '#f59e0b'};
  border-radius: 8px;
  font-size: 12px;
  color: ${props => props.$synced ? '#10b981' : '#f59e0b'};
`;

const StatusDot = styled.div<{ $synced: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$synced ? '#10b981' : '#f59e0b'};
  animation: ${props => props.$synced ? 'none' : 'pulse 1.5s infinite'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const BlockNumber = styled.span`
  font-family: monospace;
  font-weight: 600;
`;

interface SyncIndicatorProps {
  className?: string;
  showBlock?: boolean;
}

export function SyncIndicator({ className, showBlock = true }: SyncIndicatorProps) {
  const [status, setStatus] = useState<IndexerStatus | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await OnchainStatsAPI.getIndexerStatus();
        setStatus(data);
        
        // Estimate current block (BSC ~3s per block)
        if (data.updatedAt) {
          const timeDiff = Date.now() - new Date(data.updatedAt).getTime();
          const estimatedBlocks = Math.floor(timeDiff / 3000);
          setCurrentBlock(data.lastSyncedBlock + estimatedBlocks);
        }
      } catch (error) {
        console.error('Failed to fetch indexer status:', error);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Update every 10s
    
    return () => clearInterval(interval);
  }, []);
  
  if (!status) return null;
  
  const isSynced = status.isRunning && status.lastSyncedBlock > 0;
  const blockLag = currentBlock - status.lastSyncedBlock;
  const isBehind = blockLag > 10;
  
  return (
    <StatusContainer $synced={isSynced && !isBehind} className={className}>
      <StatusDot $synced={isSynced && !isBehind} />
      {isBehind ? (
        <span>Syncing...</span>
      ) : isSynced ? (
        <>
          <span>Live</span>
          {showBlock && (
            <BlockNumber>#{status.lastSyncedBlock.toLocaleString()}</BlockNumber>
          )}
        </>
      ) : (
        <span>Offline</span>
      )}
    </StatusContainer>
  );
}

export default SyncIndicator;
