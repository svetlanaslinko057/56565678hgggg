'use client';

import styled from "styled-components";

export const HoverCardWrapper = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
  pointer-events: auto;
`;

export const HoverCardContent = styled.div`
  position: fixed;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #eef1f5;
  z-index: 1000;
  min-width: 260px;
  animation: slideUp 0.2s ease;
  background: #f0f2f5;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eef1f5;
  background: #ffffff;
  border-radius: 8px;
`;

export const UserAvatar = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
`;

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const UserName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
`;

export const UserBadge = styled.div`
  font-size: 12px;
  color: #738094;
  font-weight: 500;
`;

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatValue = styled.div<{ profitLoss?: boolean }>`
  font-size: 20px;
  font-weight: 600;
  color: ${({ profitLoss }) => (profitLoss ? "#05a584" : "#0f172a")};
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #738094;
`;
