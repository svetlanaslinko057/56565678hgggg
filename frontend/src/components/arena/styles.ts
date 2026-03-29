'use client';

import styled from "styled-components";

/* ============================================
   NEW CLEAN HEADER STRUCTURE v2
   Row 1: Logo | Search/Live/Filter | Create + Notifications + Season + Wallet
   Row 2: Arena | Duels | Analyst Leagues (segmented control)
   ============================================ */

export const HeaderContainer = styled.header`
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
  padding: 0 24px;
`;

export const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 24px;
  
  @media (max-width: 1024px) {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 0;
    gap: 12px;
  }
`;

export const LogoSection = styled.div`
  flex-shrink: 0;
  
  img {
    height: 32px;
    width: auto;
  }
`;

export const CenterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 500px;
  
  @media (max-width: 1024px) {
    order: 3;
    max-width: 100%;
    width: 100%;
  }
`;

export const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  background: #f5f7fa;
  border-radius: 10px;
  padding: 8px 14px;
  border: 1px solid transparent;
  transition: all 0.2s;
  
  &:focus-within {
    border-color: #05A584;
    background: #ffffff;
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    min-width: 120px;
    
    &::placeholder {
      color: #9CA3AF;
    }
  }
  
  svg {
    color: #9CA3AF;
    flex-shrink: 0;
  }
`;

export const ToolChip = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid #eef1f5;
  background: ${({ $active }) => $active ? '#e8f9f1' : '#ffffff'};
  color: ${({ $active }) => $active ? '#05A584' : '#738094'};
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    border-color: #05A584;
    color: #05A584;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

export const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: #05A584;
  color: #ffffff;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  
  &:hover {
    background: #048a6e;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

export const IconButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #eef1f5;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: #738094;
  }
  
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff5858;
    color: white;
    font-size: 10px;
    font-weight: 600;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }
`;

export const SeasonBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #e8f9f1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #05A584;
  white-space: nowrap;
  
  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff5857;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

export const WalletButton = styled.button<{ $connected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  
  ${({ $connected }) => $connected ? `
    background: #f5f7fa;
    color: #0f172a;
    border: 1px solid #eef1f5;
    
    &:hover {
      border-color: #d1d5db;
    }
    
    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #05A584, #3B82F6);
    }
  ` : `
    background: #0f172a;
    color: #ffffff;
    border: none;
    
    &:hover {
      background: #1e293b;
    }
  `}
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

/* Navigation Row - Segmented Control */
export const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  gap: 16px;
`;

export const SegmentedControl = styled.div`
  display: flex;
  gap: 2px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 12px;
`;

export const SegmentButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  ${({ $active }) => $active ? `
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  ` : `
    background: transparent;
    color: #738094;
    
    &:hover {
      color: #0f172a;
    }
  `}
  
  svg {
    width: 16px;
    height: 16px;
    ${({ $active }) => $active ? `
      color: #05A584;
    ` : `
      color: #9CA3AF;
    `}
  }
`;

export const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

/* Legacy exports for compatibility */
export const MainHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 0;
  gap: 24px;
`;

export const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  
  img {
    height: 32px;
    width: auto;
  }
`;

export const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
`;

export const FilterWrapper = styled.div`
  display: none;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const TabsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  width: 100%;
  flex-wrap: wrap;
  gap: 12px;
`;

export const TabsLeft = styled.div`
  display: flex;
  gap: 2px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 12px;
`;

export const TabButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active }) => $active ? `
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    
    svg, path {
      color: #05A584;
      fill: #05A584;
      stroke: #05A584;
    }
  ` : `
    background: transparent;
    color: #738094;
    
    &:hover {
      color: #0f172a;
    }
    
    svg, path {
      color: #9CA3AF;
      fill: #9CA3AF;
      stroke: #9CA3AF;
    }
  `}
`;

export const RightBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 10;

  .create-prediction {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #05A584;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid #05A584;
    background: transparent;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(5, 165, 132, 0.08);
    }

    svg {
      stroke: #05A584;
    }
  }
`;

export const SeasonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .label {
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
  }
`;

export const BellWrapper = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #eef1f5;
  cursor: pointer;

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff5858;
    color: white;
    font-size: 10px;
    font-weight: 600;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const StatusPill = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #e8f9f1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #05A584;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff5857;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

export const PredictionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 32px;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;


/* ========== LAYER 3: Market Controls ========== */
export const MarketControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

export const SearchWrapper = styled.div`
  flex: 1;
  max-width: 400px;
  
  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
  }
`;

/* ========== LAYER 4: Market Context ========== */
export const MarketContextBar = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 12px;
  }
`;

export const ContextStat = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 16px;
      height: 16px;
      color: #738094;
    }
  }
  
  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .label {
    font-size: 12px;
    color: #738094;
    font-weight: 500;
  }
  
  .value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const TrendingTopics = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  
  .label {
    font-size: 12px;
    color: #738094;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .topics {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
`;

export const TrendingTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #f0f9ff;
  color: #0369a1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    background: #e0f2fe;
  }
`;
