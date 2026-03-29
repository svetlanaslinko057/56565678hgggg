'use client';

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { WinCard } from './WinCard';

interface WinCardData {
  positionId: string;
  title: string;
  market: string;
  side: string;
  entry: number;
  payout: number;
  profit: number;
  roi: string;
  rival?: string;
  rivalDefeated?: boolean;
  streak?: number;
  isTopTen?: boolean;
  badge?: string;
  refLink: string;
  telegramShareUrl: string;
  shareText: string;
}

interface ShareWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  winData: WinCardData | null;
  onShareTracked?: () => void;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: #0B0F1A;
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 { color: #52c41a; font-size: 20px; margin: 0; }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #718096;
  font-size: 24px;
  cursor: pointer;
  &:hover { color: #fff; }
`;

export function ShareWinModal({ isOpen, onClose, winData, onShareTracked }: ShareWinModalProps) {
  const [hasShared, setHasShared] = useState(false);

  const handleShare = useCallback(() => {
    setHasShared(true);
    if (onShareTracked) onShareTracked();
  }, [onShareTracked]);

  if (!isOpen || !winData) return null;

  return (
    <Overlay $isOpen={isOpen} onClick={onClose} data-testid="share-win-modal">
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>&#127881; Congratulations!</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>
        <WinCard data={winData} onShare={handleShare} />
        {hasShared && (
          <div style={{ textAlign: 'center', marginTop: 16, color: '#52c41a', fontSize: 14 }}>
            +5 XP for sharing!
          </div>
        )}
      </ModalContent>
    </Overlay>
  );
}

export default ShareWinModal;
