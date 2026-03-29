'use client';

import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 40px;
  gap: 20px;
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
`;

export const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #728094;
  margin: 0;
`;

export const StatusBadge = styled.div`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: #f9fbfc;
  color: #0f172a;
  border: 1px solid #f0f2f5;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 5, 48, 0.1);
`;

export const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #728094;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #f9fbfc;
    color: #0f172a;
  }
`;

export const ModalBody = styled.div`
  padding: 0 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const MarketSection = styled.div`
  background: #f9fbfc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

export const MarketLabel = styled.div`
  font-size: 14px;
  color: #728094;
  margin-bottom: 8px;
`;

export const MarketTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const ChallengeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;

  svg {
    color: #05a584;
  }
`;

export const ParticipantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const ParticipantCard = styled.div`
  background: #ffffff;
  border: 2px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ParticipantHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ParticipantName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

export const HostBadge = styled.div`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f9fbfc;
  color: #728094;
  border: 1px solid #f0f2f5;
`;

export const ParticipantDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const DetailLabel = styled.div`
  font-size: 14px;
  color: #728094;
`;

export const DetailValue = styled.div<{ $isYes?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $isYes }) => {
    if ($isYes !== undefined) {
      return $isYes ? "#05a584" : "#ff5858";
    }
    return "#0f172a";
  }};
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #e3e8ef;
  border-bottom: 1px solid #e3e8ef;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;

  .col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export const InfoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #728094;

  svg {
    color: #728094;
  }
`;

export const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const NoteSection = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 8px;
`;

export const NoteLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2082ea;
  flex-shrink: 0;
`;

export const NoteText = styled.div`
  font-size: 14px;
  color: #728094;
  line-height: 1.5;
`;

export const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 0 40px 40px;
`;

export const DeclineButton = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #f0f2f5;
  background: transparent;
  color: #0f172a;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fbfc;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const AcceptButton = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: none;
  background: #05a584;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #048f70;
  }

  &:active {
    transform: scale(0.98);
  }
`;
