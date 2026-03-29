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
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
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

export const DuelInfo = styled.p`
  font-size: 14px;
  color: #738094;
  margin: 0;
`;

export const StatusBadge = styled.div<{
  $status: "won" | "lost" | "active" | "pending" | "declined" | "cancelled";
}>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ $status }) => {
    switch ($status) {
      case "won":
        return "#E9F8F8";
      case "lost":
        return "#FEF1F2";
      case "active":
      case "cancelled":
      case "declined":
        return "#fff";
      case "pending":
        return "#f9fbfc";
      default:
        return "#E9F8F8";
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case "won":
        return "#05A584";
      case "lost":
        return "#f43f5e";
      case "active":
        return "#05A584";
      case "pending":
        return "#0f172a";
      case "declined":
        return "#0ea5e9";
      case "cancelled":
        return "#f43f5e";
      default:
        return "#738094";
    }
  }};
  border: ${({ $status }) => {
    switch ($status) {
      case "won":
        return "1px solid #E9F8F8";
      case "lost":
        return "1px solid #FEF1F2";
      case "active":
        return "1px solid #E9F8F8";
      case "pending":
        return "1px solid #f0f2f5";
      case "declined":
        return "1px solid #F7FEFF";
      case "cancelled":
        return "1px solid #FEF1F2";
      default:
        return "1px solid #f0f2f5";
    }
  }};
  box-shadow: 0 2px 4px rgba(0, 5, 48, 0.1);
`;

export const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #738094;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

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

export const CongratulationsBox = styled.div`
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  border: 1px solid #e9f8f8;
  margin-bottom: 20px;
`;

export const ParticipantsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const ParticipantCard = styled.div<{
  $isWinner?: boolean;
  $isLoser?: boolean;
}>`
  background: #ffffff;
  border: 2px solid
    ${({ $isWinner, $isLoser }) => {
      if ($isWinner) return "#05a584";
      if ($isLoser) return "#ff5858";
      return "#F0F2F5";
    }};
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
  border: 1px solid #f0f2f5;
`;

export const ParticipantDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.result {
    border-top: 1px solid #e0e0e0;
    padding-top: 12px;
  }
`;

export const DetailLabel = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const DetailValue = styled.div<{
  $isPositive?: boolean;
  $isYes?: boolean;
}>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $isPositive, $isYes }) => {
    if ($isPositive !== undefined) {
      return $isPositive ? "#05a584" : "#ff5858";
    }
    if ($isYes !== undefined) {
      return $isYes ? "#05a584" : "#ff5858";
    }
    return "#0f172a";
  }};
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px 0;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;

  & > div {
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
  color: #738094;

  svg {
    color: #738094;
  }
`;

export const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const ResolutionSection = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
`;

export const ResolutionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
`;

export const ResolutionText = styled.div`
  font-size: 14px;
  color: #738094;
  line-height: 1.6;
`;

export const ModalFooter = styled.div`
  padding: 0 40px 40px;
`;

export const CloseModalButton = styled.button`
  width: 100%;
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
