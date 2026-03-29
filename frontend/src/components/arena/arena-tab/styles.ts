'use client';

import styled from "styled-components";

export const SortBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  margin-bottom: -20px;
`;

export const SortLabel = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`;

export const SortButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => $active ? '#05A584' : '#e2e8f0'};
  background: ${({ $active }) => $active ? 'rgba(5, 165, 132, 0.1)' : '#fff'};
  color: ${({ $active }) => $active ? '#05A584' : '#64748b'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: #05A584;
    color: #05A584;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const PredictionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 40px;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoBlock = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 40px;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

export const LiveBetsSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1.6;
`;

export const LiveBetsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #0f172a;

    span {
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 8px;
      background: #ff5857;
      border-radius: 50%;
      border: 4px solid #fef1f2;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  }

  .bet-filter-dropdown {
    width: 120px;

    .selected {
      border-color: #f0f2f5;

      svg {
        color: #000;
      }
    }
  }
`;

export const LiveBetsFilter = styled.button`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
`;

export const LiveBetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const LiveBetCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f5fbfd;
  border-radius: 6px;
  padding: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const LiveBetLeft = styled.div`
  display: flex;
  gap: 10px;

  .image {
    width: 48px;
    height: 48px;
    border-radius: 50%;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    @media (max-width: 768px) {
      display: none;
    }
  }

  .user {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;

    & > p {
      font-size: 14px;
      font-weight: 600;
    }
  }
`;

export const LiveBetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
`;

export const LiveBetTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

export const LiveBetSubtitle = styled.div`
  font-size: 14px;
  color: #728094;
`;

export const LiveBetUserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const LiveBetUser = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0f5ff, #dbeafe);
  color: #0f172a;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LiveBetText = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const LiveBetOdds = styled.span<{ accent: "green" | "red" }>`
  font-weight: 600;
  color: ${({ accent }) => (accent === "green" ? "#05A584" : "#ff5858")};
`;

export const LiveBetRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 64px;
  color: #738094;
  font-size: 14px;

  .time {
    white-space: nowrap;
  }
`;

export const LiveBetsFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  color: #728094;
  font-size: 12px;
  flex-wrap: wrap;
  gap: 10px;
`;

export const LiveBetsPagination = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  .ellipsis {
    color: #728094;
    font-weight: 600;
  }
`;

export const PageNumber = styled.button<{ active?: boolean }>`
  min-width: 28px;
  height: 28px;
  padding: 4px 6px;
  border-radius: 8px;
  border: 1px solid ${({ active }) => (active ? "#05A584" : "#dbe2ea")};
  background: ${({ active }) => (active ? "#e8f9f1" : "#ffffff")};
  color: ${({ active }) => (active ? "#05A584" : "#0f172a")};
  font-size: 12px;
  font-weight: 600;
`;

export const LeaderboardSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  .row {
    margin-top: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding-bottom: 16px;
    border-bottom: 1px solid #e3e8ef;

    p {
      color: #728094;
      font-weight: 600;
      font-size: 14px;
    }
  }
`;

export const SnapshotHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const HowItWorks = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 6px;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  background: #f9f9f9;
  padding: 4px 8px;
`;

export const RankBadge = styled.div`
  background: #ffffff;
  border: 1px solid #05a584;
  border-radius: 6px;
  padding: 20px 12px;
  text-align: center;
  background: #f5fbfd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  .rank {
    font-size: 32px;
    font-weight: 600;
    color: #05a584;
  }

  .label {
    font-size: 14px;
    color: #728094;
  }

  .tier {
    font-size: 12px;
    padding: 4px 8px;
    background: #e9f8f8;
    border-radius: 6px;
  }
`;

export const SnapshotStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SnapshotStat = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 8px;

  .label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .value {
    font-weight: 600;
    font-size: 14px;
    color: #0f172a;
  }
`;

export const Note = styled.div`
  border-top: 1px solid #e3e8ef;
  padding-top: 20px;
  font-size: 14px;
  color: #728094;
  line-height: 1.4;
`;

export const QuickTipsSection = styled.div`
  padding: 20px;
  border: 1px solid #f0f2f5;
  background: #f9f9f9;
  border-radius: 6px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  ul {
    margin: 0;
    padding-left: 9px;
    list-style: disc;

    li {
      font-size: 14px;
      color: #738094;
      margin-bottom: 12px;

      &::before {
        content: "";
        display: inline-block;
        width: 2px;
        height: 2px;
        background: #728094;
        border-radius: 50%;
        margin-right: 8px;
        vertical-align: middle;
      }
    }
  }
`;

export const LeaderboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const LeaderboardTabs = styled.div`
  display: flex;
  gap: 6px;
`;

export const LeaderboardTabButton = styled.button<{ active?: boolean }>`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${({ active }) => (active ? "#05A584" : "#dbe2ea")};
  background: ${({ active }) => (active ? "#e8f9f1" : "#ffffff")};
  color: ${({ active }) => (active ? "#05A584" : "#0f172a")};
  font-size: 12px;
  font-weight: 600;
`;

export const LeaderboardSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;

  input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 14px;
    color: #738094;

    &::placeholder {
      color: #728094;
    }
  }
`;

export const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const LeaderboardRow = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  padding: 15px 10px;
  border-bottom: 1px solid #e3e8ef;

  &:first-child {
    border-top: 1px solid #e3e8ef;
  }
`;

export const LeaderboardRank = styled.div`
  color: #0f172a;
  font-size: 14px;
`;

export const LeaderboardUser = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const LeaderboardAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #22c55e 20%, #0f172a 50%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;

  .score {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #06b6d4;
    color: #ffffff;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

export const LeaderboardName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const LeaderboardProfit = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

export const LeaderboardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  .caption {
    color: #728094;
    font-size: 12px;
  }
`;

// Empty State Components
export const EmptyStateContainer = styled.div<{ $small?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ $small }) => $small ? '40px 20px' : '60px 20px'};
  min-height: ${({ $small }) => $small ? '200px' : '280px'};
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 6px;
  text-align: center;
`;

export const EmptyStateIcon = styled.div<{ $small?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $small }) => $small ? '72px' : '96px'};
  height: ${({ $small }) => $small ? '72px' : '96px'};
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  margin-bottom: ${({ $small }) => $small ? '16px' : '24px'};
  
  svg {
    color: #64748b;
  }
`;

export const EmptyStateTitle = styled.h3<{ $small?: boolean }>`
  font-size: ${({ $small }) => $small ? '16px' : '20px'};
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 ${({ $small }) => $small ? '8px' : '12px'} 0;
`;

export const EmptyStateText = styled.p<{ $small?: boolean }>`
  font-size: ${({ $small }) => $small ? '13px' : '14px'};
  color: #64748b;
  margin: 0 0 ${({ $small }) => $small ? '16px' : '24px'} 0;
  line-height: 1.6;
  max-width: 320px;
`;

export const EmptyStateButton = styled.button`
  padding: 12px 24px;
  background: #05A584;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #048a6e;
    transform: translateY(-1px);
  }
`;

export const EmptyPredictionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  min-height: 400px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 6px;
  text-align: center;
  margin-top: 40px;
  border: 2px dashed #e2e8f0;
`;

