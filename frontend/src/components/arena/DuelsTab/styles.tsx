'use client';

import styled from "styled-components";

export const DuelsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const DuelsListWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  > :last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
`;

export const DuelCard = styled.div`
  background: #ffffff;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 0.2s;

  &:hover {
    border-color: #05a584;
    box-shadow: 0 4px 12px rgba(5, 165, 132, 0.1);
  }
`;

export const DuelCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const DuelSideBadge = styled.div<{ $side: "yes" | "no" }>`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $side }) => ($side === "yes" ? "#e8f9f1" : "#fef2f2")};
  color: ${({ $side }) => ($side === "yes" ? "#05a584" : "#ff5858")};
`;

export const DuelStakesBadge = styled.div`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #fef3c7;
  color: #f59e0b;
`;

export const DuelTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
  line-height: 1.4;
`;

export const DuelHost = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

export const HostName = styled.span`
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
`;

export const HostLabel = styled.span`
  font-size: 12px;
  color: #738094;
`;

export const DuelStakes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fbfc;
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const StakeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: 14px;
    color: #738094;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const DuelFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const DuelTimer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #738094;

  svg {
    color: #738094;
  }
`;

export const DuelStatusBadge = styled.div<{
  $variant?: "warning" | "success" | "danger";
}>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $variant }) => {
    if ($variant === "warning") return "#fef3c7";
    if ($variant === "success") return "#e8f9f1";
    if ($variant === "danger") return "#fef2f2";
    return "#f0f2f5";
  }};
  color: ${({ $variant }) => {
    if ($variant === "warning") return "#f59e0b";
    if ($variant === "success") return "#05a584";
    if ($variant === "danger") return "#ff5858";
    return "#738094";
  }};
`;

export const DuelActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

export const DuelActionButton = styled.button<{
  $variant?: "success" | "danger";
}>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: ${({ $variant }) => {
    if ($variant === "success") return "#e8f9f1";
    if ($variant === "danger") return "#fef2f2";
    return "#f9fbfc";
  }};
  color: ${({ $variant }) => {
    if ($variant === "success") return "#05a584";
    if ($variant === "danger") return "#ff5858";
    return "#0f172a";
  }};

  &:hover {
    background: ${({ $variant }) => {
      if ($variant === "success") return "#05a584";
      if ($variant === "danger") return "#ff5858";
      return "#f0f2f5";
    }};
    color: #ffffff;
  }

  &:active {
    transform: scale(0.98);
  }
`;

// Duels Summary Sidebar
export const DuelsSummaryCard = styled.div`
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
  margin-bottom: 40px;
`;

export const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  svg {
    color: #05a584;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
`;

export const ActiveDuelsCard = styled.div`
  background: transparent;
  border: 1px solid #05a584;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  background: #f5fbfd;
`;

export const ActiveDuelsNumber = styled.div`
  font-size: 32px;
  font-weight: 600;
  color: #05a584;
  line-height: 1;
  margin-bottom: 12px;
`;

export const ActiveDuelsLabel = styled.div`
  font-size: 14px;
  color: #738094;
  font-weight: 500;
  margin-top: 12px;
`;

export const ActiveDuelsStatus = styled.div`
  font-size: 12px;
  color: #0f172a;
  margin-top: 12px;
  padding: 4px 8px;
  background: #e9f8f8;
  width: fit-content;
  border-radius: 6px;
  margin-left: auto;
  margin-right: auto;
`;

export const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
`;

export const StatItem = styled.div`
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #f0f2f5;

  .value {
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .label {
    font-size: 14px;
    opacity: 1;
    color: #738094;
    font-weight: 400;
  }

  &.red {
    border-color: #FEF1F2;

    .value {
      color: #ff5858;
    }
  }
};`;

export const LossesStatItem = styled(StatItem)`
  .value {
    color: #ff5858;
  }
`;

export const SummarySection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;

  svg {
    color: #05a584;
  }
`;

export const RivalsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

export const RivalItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const RivalInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const RivalName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
`;

export const RivalStats = styled.div`
  display: flex;
  gap: 8px;
  font-size: 12px;
`;

export const RivalStat = styled.span<{ $variant?: "success" | "danger" }>`
  font-weight: 600;
  color: ${({ $variant }) => {
    if ($variant === "success") return "#05a584";
    if ($variant === "danger") return "#ff5858";
    return "#738094";
  }};
`;

export const WinRateSection = styled.div`
  margin-bottom: 20px;
  border-top: 1px solid #eef1f5;
  border-bottom: 1px solid #eef1f5;
  padding: 20px 0;
`;

export const WinRateLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .label {
    font-size: 14px;
    color: #0f172a;
    opacity: 1;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
  }
`;

export const WinRateBar = styled.div`
  width: 100%;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
`;

export const WinRateFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, #05a584 0%, #06d6a0 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
`;

export const QuickTipsSection = styled.div`
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 12px 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  li {
    font-size: 14px;
    color: #738094;
    padding-left: 16px;
    position: relative;
    line-height: 1.5;

    &::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #05a584;
      font-weight: bold;
    }
  }
};`;

export const DuelsNote = styled.p`
  font-size: 14px;
  color: #738094;
  line-height: 1.6;
  margin: 16px 0 0 0;
  padding: 0;
`;

export const DuelsHistorySection = styled.div`
  margin-top: 40px;
`;

export const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
`;

export const HistoryTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 8px;
`;

export const HistoryTab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $active }) => ($active ? "#FFFFFF" : "transparent")};
  color: ${({ $active }) => ($active ? "#05a584" : "#738094")};
    box-shadow: ${({ $active }) =>
      $active ? "0 4px 12px rgba(0, 5, 48, 0.1)" : "none"};

  &:hover {
    background: ${({ $active }) => ($active ? "#FFFFFF" : "#f9fbfc")};
    box-shadow: 0 4px 12px rgba(0, 5, 48, 0.1);
`;

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const HistoryItem = styled.div`
  background: #ffffff;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 5, 48, 0.1);
    cursor: pointer;
  }
`;

export const HistoryStatusBadge = styled.div<{
  $status: "won" | "lost" | "active" | "pending" | "declined" | "cancelled";
}>`
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
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

export const HistoryContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const HistoryTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
`;

export const HistoryDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #738094;

  .divider {
    width: 3px;
    height: 3px;
    background: #728094;
    border-radius: 50%;
  }
`;

export const HistorySide = styled.span<{ $side: "yes" | "no" }>`
  font-weight: 500;
  color: ${({ $side }) => ($side === "yes" ? "#05a584" : "#ff5858")};
`;

export const HistoryOpponent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const HistoryResult = styled.div<{ $isPositive?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $isPositive }) => ($isPositive ? "#05a584" : "#ff5858")};
  min-width: 120px;
  text-align: right;

  @media (max-width: 768px) {
    position: absolute;
    top: 20px;
    right: 20px;
  }
`;

export const HistoryStatus = styled.div`
  font-size: 14px;
  color: #05a584;
  text-align: right;
  font-weight: 600;
  min-width: 120px;
`;
