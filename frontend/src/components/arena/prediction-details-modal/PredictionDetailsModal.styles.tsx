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
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
`;

export const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #738094;
  margin: 0;
`;

export const StatusBadge = styled.div<{ $status: "won" | "lost" }>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ $status }) => ($status === "won" ? "#E9F8F8" : "#FEF1F2")};
  color: ${({ $status }) => ($status === "won" ? "#05A584" : "#f43f5e")};
  border: ${({ $status }) =>
    $status === "won" ? "1px solid #E9F8F8" : "1px solid #FEF1F2"};
  white-space: nowrap;
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

export const MessageBox = styled.div<{ $status: "won" | "lost" }>`
  background: ${({ $status }) => ($status === "won" ? "#f9f9f9" : "#f9f9f9")};
  border-radius: 12px;
  padding: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  border: ${({ $status }) =>
    $status === "won" ? "1px solid #e9f8f8" : "1px solid #FEF1F2"};
  margin-bottom: 20px;
`;

export const Section = styled.div`
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

export const DetailsCard = styled.div`
  background: #ffffff;
  border: 2px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const DetailRow = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $highlight }) => ($highlight ? "12px 0 0" : "0")};
  border-top: ${({ $highlight }) =>
    $highlight ? "1px solid #f0f2f5" : "none"};
`;

export const DetailLabel = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const DetailValue = styled.div<{
  $variant?: "success" | "danger" | "default" | "large";
}>`
  font-size: ${({ $variant }) =>
    $variant === "large" || $variant === "danger" ? "24px" : "14px"};
  font-weight: 600;
  color: ${({ $variant }) => {
    switch ($variant) {
      case "success":
        return "#05a584";
      case "danger":
        return "#ff5858";
      case "large":
        return "#05a584";
      default:
        return "#0f172a";
    }
  }};
`;

export const StatsGrid = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const StatRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-template-columns: repeat(2, 1fr);
  border: 2px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  width: calc(50% - 10px);
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const StatValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const VoteRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 2px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  width: calc(50% - 10px);
`;

export const VoteLabel = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const VoteValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

export const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoLabel = styled.div`
  font-size: 14px;
  color: #738094;
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
  line-height: 1.5;
`;

export const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 0 40px 40px;
`;

export const CancelButton = styled.button`
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

export const TryAgainButton = styled.button`
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
