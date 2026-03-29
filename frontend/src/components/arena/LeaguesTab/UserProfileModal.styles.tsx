'use client';

import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
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
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

export const ModalHeader = styled.div`
  padding: 40px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

export const UserHeaderInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex: 1;
`;

export const UserAvatarWrapper = styled.div`
  position: relative;
`;

export const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const UserName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const UserRankInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const RankText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #738094;
`;

export const TopPercentBadge = styled.span`
  padding: 4px 8px;
  background: #e8f9f1;
  color: #05a584;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
`;

export const PointsBadge = styled.span`
  padding: 4px 8px;
  background: #f0f2f5;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #738094;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;

export const ModalBody = styled.div`
  padding: 0px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

export const StatCard = styled.div`
  padding: 10px;
  background: #f9f9f9;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const StatIcon = styled.div`
  color: #05a584;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #738094;
  text-align: center;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: #05a584;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const ROICard = styled.div`
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #eef1f5;
`;

export const ROIValue = styled.div`
  font-size: 24px;
  color: #728094;
  margin-bottom: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  strong {
    color: #000;
    font-weight: 600;
  }
`;

export const ROIDescription = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const PredictionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
`;

export const PredictionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PredictionText = styled.div`
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
`;

export const PredictionROI = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #000;
`;

export const ModalFooter = styled.div`
  padding: 0 40px 40px;
  display: flex;
  gap: 12px;
`;

export const FooterButton = styled.button<{
  $variant?: "primary" | "secondary";
}>`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${({ $variant }) =>
    $variant === "primary"
      ? `
    background: #05a584;
    color: #ffffff;

    &:hover {
      background: #038a6a;
    }
  `
      : `
    color: #0f172a;
    font-weight: 600;

    &:hover {
      background: #f0f2f5;
    }
  `}

  &:active {
    transform: scale(0.98);
  }
`;
