'use client';

import { Plus, Bell, Search, TrendingUp, Flame, Users, Award, ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { OnchainStatsAPI } from '@/lib/api/onchainApi';
import { TickerAPI, type TickerItem as TickerItemType } from '@/lib/api/tickerApi';
import ArenaSort, { ArenaSortType } from "./ArenaSort";
import ArenaFilter from "./ArenaFilter";
import { ArenaTab } from "./arena-tab";
import { LeaguesTab } from "./LeaguesTab";
import { DuelsTab } from "./DuelsTab";
import CustomDropdown from "@/UI/CustomDropdown";
import { NotificationsPanelComponent } from "./notification-panel/NotificationsPanel";
import { CreatePredictionModal } from "./create-prediction-modal/CreatePredictionModal";
import { CreateDuelModal } from "./create-duel-modal/CreateDuelModal";
import { ProfileDropdown } from "@/components/wallet/ProfileDropdown";
import { useArena } from "@/lib/api/ArenaContext";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";

type TickerItem = TickerItemType;

// ============== FOMO.CX STYLE - LIGHT THEME WITH TICKER ==============

const scrollTicker = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f9fafb;
`;

const ContentWrapper = styled.main`
  padding: 32px 40px;
  max-width: 1600px;
  margin: 0 auto;
`;

// ============ TICKER BAR - Running Line (Dark Style) ============
const TickerBar = styled.div`
  background: #0a0a0a;
  overflow: hidden;
  padding: 12px 0;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    z-index: 2;
    pointer-events: none;
  }
  
  &::before {
    left: 0;
    background: linear-gradient(90deg, #0a0a0a 0%, transparent 100%);
  }
  
  &::after {
    right: 0;
    background: linear-gradient(90deg, transparent 0%, #0a0a0a 100%);
  }
`;

const TickerContent = styled.div`
  display: flex;
  animation: ${scrollTicker} 35s linear infinite;
  white-space: nowrap;
  
  &:hover {
    animation-play-state: paused;
  }
`;

const TickerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 32px;
  font-size: 13px;
  font-weight: 500;
  
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .label {
    color: rgba(255, 255, 255, 0.45);
    font-weight: 400;
  }
  
  .value {
    font-weight: 600;
    color: #ffffff;
  }
  
  .change {
    font-size: 12px;
    font-weight: 600;
    margin-left: 4px;
    
    &.positive {
      color: #22c55e;
    }
    
    &.negative {
      color: #ef4444;
    }
  }
  
  .divider {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    margin-left: 24px;
  }
`;

// ============ TICKER SVG ICONS ============
const TickerIconFire = ({ color = '#f97316' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C16.4183 22 20 18.4183 20 14C20 11.5 19 9.5 17.5 8C17.5 9.5 16.5 11 15 11C15 8 13 5.5 12 4C11 6 10 8 10 10C8.5 9 8 7.5 8 6C5.5 8 4 11 4 14C4 18.4183 7.58172 22 12 22Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22C14.2091 22 16 20.2091 16 18C16 16.5 15.5 15.5 14.5 14.5C14.5 15.5 14 16.5 13 16.5C13 15 12 13.5 11.5 13C11 14 10.5 15 10.5 16C9.5 15.5 9 14.5 9 13.5C8 14.5 7.5 15.5 8 18C8 20.2091 9.79086 22 12 22Z" fill={color} fillOpacity="0.3"/>
  </svg>
);

const TickerIconVolume = ({ color = '#22c55e' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TickerIconTarget = ({ color = '#3b82f6' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

const TickerIconUsers = ({ color = '#a855f7' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TickerIconTrophy = ({ color = '#eab308' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9H4C3.46957 9 2.96086 8.78929 2.58579 8.41421C2.21071 8.03914 2 7.53043 2 7V6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 9H20C20.5304 9 21.0391 8.78929 21.4142 8.41421C21.7893 8.03914 22 7.53043 22 7V6C22 5.46957 21.7893 4.96086 21.4142 4.58579C21.0391 4.21071 20.5304 4 20 4H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 4H18V12C18 13.5913 17.3679 15.1174 16.2426 16.2426C15.1174 17.3679 13.5913 18 12 18C10.4087 18 8.88258 17.3679 7.75736 16.2426C6.63214 15.1174 6 13.5913 6 12V4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18V22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 22H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TickerIconChart = ({ color = '#06b6d4' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V21H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 16L12 11L15 14L21 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8H21V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TickerIconClock = ({ color = '#ec4899' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <path d="M12 6V12L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TickerIconStar = ({ color = '#f59e0b' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.2"/>
  </svg>
);

const TickerIconFlame = ({ color = '#10b981' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 14.5C8.5 16.433 10.067 18 12 18C13.933 18 15.5 16.433 15.5 14.5C15.5 12.567 12 8 12 8C12 8 8.5 12.567 8.5 14.5Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2V5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4.93 4.93L7.05 7.05" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 12H5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19.07 4.93L16.95 7.05" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 12H19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
  position: sticky;
  top: 0;
  z-index: 50;
`;

const LeftZone = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const NavTabs = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SubNavBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
`;

const HeaderSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #eef1f5;
  background: #f9fafb;
  transition: all 0.2s;
  min-width: 220px;
  
  &:focus-within {
    border-color: #05A584;
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(5, 165, 132, 0.1);
  }
  
  svg {
    color: #94a3b8;
    flex-shrink: 0;
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    color: #0f172a;
    font-size: 13px;
    outline: none;
    
    &::placeholder {
      color: #94a3b8;
    }
  }
`;

const NavTab = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  background: ${({ $active }) => $active ? 'rgba(5, 165, 132, 0.08)' : 'transparent'};
  color: ${({ $active }) => $active ? '#05A584' : '#64748b'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #0f172a;
    background: #f5f5f5;
  }
  
  svg path {
    stroke: ${({ $active }) => $active ? '#05A584' : '#64748b'};
  }
`;

const RightZone = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Q1Indicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(5, 165, 132, 0.2);
  background: rgba(5, 165, 132, 0.05);
  color: #05A584;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #05A584;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 0 2px rgba(5, 165, 132, 0.2);
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
  }
`;

const BellButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid #eef1f5;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
    border-color: #dbe2ea;
    color: #0f172a;
  }
  
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 6px;
    background: #FF5858;
    color: white;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
    border-color: #05A584;
    color: #05A584;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ConnectWalletButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: #0f172a;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #1e293b;
  }
`;

// ============ STATS BAR ============
const StatsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 12px 32px;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
`;

const FiltersZone = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatsZone = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 6px;
    background: #f1f5f9;
  }
  
  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .label {
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
  
  .value {
    font-size: 14px;
    color: #0f172a;
    font-weight: 600;
  }
`;

const TrendingZone = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .trending-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .tags {
    display: flex;
    gap: 6px;
  }
`;

const TrendingTag = styled.button`
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #eef1f5;
  background: #ffffff;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
    color: #0f172a;
    border-color: #05A584;
  }
`;

// ============ ICONS ============
const ArenaIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M17.0001 14.5001L19.2075 12.2928C19.3949 12.1053 19.5002 11.8509 19.5002 11.5858C19.5002 11.3206 19.3949 11.0663 19.2075 10.8788L17.8001 9.47479C17.6409 9.85244 17.3914 10.1852 17.0734 10.4437C16.7554 10.7023 16.3787 10.8787 15.9765 10.9573C15.5743 11.0361 15.1589 11.0147 14.7669 10.8951C14.3749 10.7755 14.0183 10.5614 13.7285 10.2717C13.4388 9.98187 13.2247 9.62528 13.1051 9.23328C12.9855 8.84128 12.9641 8.4259 13.0429 8.02371C13.1216 7.62151 13.298 7.24484 13.5565 6.92684C13.8151 6.60884 14.1478 6.35928 14.5255 6.20012L13.1215 4.79279C12.9339 4.60532 12.6796 4.5 12.4145 4.5C12.1493 4.5 11.8949 4.60532 11.7075 4.79279L9.50012 7.00012C9.50012 6.50567 9.35349 6.02232 9.07879 5.6112C8.80409 5.20007 8.41364 4.87964 7.95683 4.69042C7.50001 4.5012 6.99735 4.45169 6.51239 4.54816C6.02744 4.64462 5.58198 4.88272 5.23235 5.23236C4.88272 5.58198 4.64462 6.02744 4.54816 6.5124C4.45169 6.99735 4.5012 7.50002 4.69042 7.95683C4.87964 8.41364 5.20007 8.80409 5.61119 9.0788C6.02231 9.3535 6.50567 9.50012 7.00012 9.50012L4.79279 11.7075C4.60532 11.895 4.5 12.1493 4.5 12.4145C4.5 12.6796 4.60532 12.9339 4.79279 13.1215L6.20012 14.5255C6.35928 14.1478 6.60884 13.8151 6.92684 13.5565C7.24483 13.298 7.62151 13.1216 8.02371 13.0429C8.4259 12.9642 8.84128 12.9855 9.23328 13.1051C9.62527 13.2247 9.98187 13.4388 10.2717 13.7286C10.5614 14.0184 10.7755 14.375 10.8951 14.767C11.0147 15.1589 11.0361 15.5743 10.9573 15.9765C10.8786 16.3787 10.7022 16.7554 10.4437 17.0734C10.1852 17.3914 9.85245 17.641 9.47479 17.8001L10.8788 19.2048C11.0663 19.3923 11.3206 19.4976 11.5858 19.4976C11.8509 19.4976 12.1053 19.3923 12.2928 19.2048L14.5001 17.0001C14.5001 17.4946 14.6467 17.9779 14.9214 18.3891C15.1961 18.8002 15.5866 19.1206 16.0434 19.3098C16.5002 19.4991 17.0029 19.5485 17.4878 19.4521C17.9728 19.3556 18.4183 19.1175 18.7679 18.7679C19.1175 18.4183 19.3556 17.9728 19.4521 17.4879C19.5485 17.0029 19.499 16.5003 19.3098 16.0434C19.1206 15.5866 18.8001 15.1961 18.389 14.9215C17.9779 14.6467 17.4945 14.5001 17.0001 14.5001Z" 
      stroke={active ? "#05A584" : "currentColor"} 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const DuelsIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14.5 3L16 5.5L13.5 8L16.5 11L13 15L10 12L7.5 14.5L5 12L3.5 14.5L3 14L5 8.5L3 6.5L5.5 4L8.5 6L14.5 3Z" 
      stroke={active ? "#05A584" : "currentColor"} 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9.5 21L8 18.5L10.5 16L7.5 13L11 9L14 12L16.5 9.5L19 12L20.5 9.5L21 10L19 15.5L21 17.5L18.5 20L15.5 18L9.5 21Z" 
      stroke={active ? "#05A584" : "currentColor"} 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const LeaguesIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z" 
      stroke={active ? "#05A584" : "currentColor"} 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M8.5 21H15.5" stroke={active ? "#05A584" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V21" stroke={active ? "#05A584" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 5H21V8C21 9.5 20 10.5 19 11" stroke={active ? "#05A584" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5H3V8C3 9.5 4 10.5 5 11" stroke={active ? "#05A584" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Notification Bell
const NotificationBell: React.FC<{ isOpen: boolean; onClick: () => void }> = ({ isOpen, onClick }) => {
  const { unreadCount } = useArena();
  
  return (
    <BellButton onClick={onClick} id="notifications-button" data-testid="bell-notification">
      <Bell size={20} />
      {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </BellButton>
  );
};

const seasonOptions = [
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q4 2025", label: "Q4 2025" },
];

// Market stats hook
const useMarketContext = () => {
  const [stats, setStats] = useState({
    activeMarkets: 0,
    totalVolume: 0,
    totalBets: 0,
    topWinners: 0,
    trending: ['AI', 'DeFi', 'BTC', 'ETH']
  });
  
  useEffect(() => {
    OnchainStatsAPI.getStats().then(data => {
      setStats({
        activeMarkets: data.activeMarkets || data.totalMarkets || 0,
        totalVolume: data.totalVolume || 0,
        totalBets: (data as any).totalBets || 0,
        topWinners: (data as any).topWinners || 0,
        trending: ['AI', 'DeFi', 'BTC', 'ETH']
      });
    }).catch(err => console.error('Failed to fetch onchain stats:', err));
  }, []);
  
  return stats;
};

// Ticker data for prediction markets - now fetched from API
const useTickerData = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TickerAPI.getItems()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch ticker items:', err);
        // Fallback to default items
        setItems([
          { key: 'hot_markets', label: 'Hot Markets', icon: 'fire', color: '#f97316', enabled: true, order: 1, value: '12', changeValue: '+3', changePositive: true, isDynamic: true, dynamicSource: 'hotMarkets' },
          { key: 'total_volume', label: 'Total Volume', icon: 'volume', color: '#22c55e', enabled: true, order: 2, value: '$847K', changeValue: '+12%', changePositive: true, isDynamic: true, dynamicSource: 'totalVolume' },
          { key: 'active_bets', label: 'Active Bets', icon: 'target', color: '#3b82f6', enabled: true, order: 3, value: '1,247', changeValue: '+89', changePositive: true, isDynamic: true, dynamicSource: 'activeBets' },
          { key: 'predictors', label: 'Predictors', icon: 'users', color: '#a855f7', enabled: true, order: 4, value: '3,891', changeValue: '+156', changePositive: true, isDynamic: true, dynamicSource: 'totalUsers' },
          { key: 'top_win', label: 'Top Win', icon: 'trophy', color: '#eab308', enabled: true, order: 5, value: '$12.4K', changeValue: null, changePositive: true, isDynamic: true, dynamicSource: 'topWin' },
          { key: 'win_rate', label: 'Win Rate Avg', icon: 'chart', color: '#06b6d4', enabled: true, order: 6, value: '54.2%', changeValue: '-1.2%', changePositive: false, isDynamic: true, dynamicSource: 'avgWinRate' },
          { key: 'ending_soon', label: 'Ending Soon', icon: 'clock', color: '#ec4899', enabled: true, order: 7, value: '8', changeValue: null, changePositive: true, isDynamic: true, dynamicSource: 'endingSoon' },
          { key: 'new_today', label: 'New Today', icon: 'star', color: '#f59e0b', enabled: true, order: 8, value: '5', changeValue: '+2', changePositive: true, isDynamic: true, dynamicSource: 'newToday' },
        ]);
        setLoading(false);
      });
  }, []);

  return { items, loading };
};

// Icon component that renders based on icon name
const TickerIconComponent: React.FC<{ icon: string; color: string }> = ({ icon, color }) => {
  const icons: Record<string, React.ReactNode> = {
    fire: <TickerIconFire color={color} />,
    volume: <TickerIconVolume color={color} />,
    target: <TickerIconTarget color={color} />,
    users: <TickerIconUsers color={color} />,
    trophy: <TickerIconTrophy color={color} />,
    chart: <TickerIconChart color={color} />,
    clock: <TickerIconClock color={color} />,
    star: <TickerIconStar color={color} />,
    flame: <TickerIconFlame color={color} />,
  };
  return <>{icons[icon] || icons.star}</>;
};

export const Arena: React.FC = () => {
  const router = useRouter();
  const { currentWallet, balance } = useArena();
  const marketContext = useMarketContext();
  const { items: tickerItems, loading: tickerLoading } = useTickerData();

  const [searchValue, setSearchValue] = useState<string>("");
  const [sortBy, setSortBy] = useState<ArenaSortType>("live");
  const [filters, setFilters] = useState<any>(null);
  const [tab, setTab] = useState<"arena" | "duels" | "leagues">("arena");
  const [selectedSeason, setSelectedSeason] = useState<string>("Q1 2026");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreatePredictionOpen, setIsCreatePredictionOpen] = useState(false);
  const [isCreateDuelOpen, setIsCreateDuelOpen] = useState(false);

  const handleTabChange = (newTab: "arena" | "duels" | "leagues") => {
    setTab(newTab);
    if (newTab === "duels") {
      setSortBy("ends_soon");
    } else if (newTab === "arena") {
      setSortBy("live");
    }
  };

  const handleCreateClick = () => {
    if (tab === "duels") {
      setIsCreateDuelOpen(true);
    } else {
      setIsCreatePredictionOpen(true);
    }
  };

  const formatVolume = (volume: number) => {
    const volumeInUSDT = volume / 1e18;
    if (volumeInUSDT >= 1000000) return `$${(volumeInUSDT / 1000000).toFixed(1)}M`;
    if (volumeInUSDT >= 1000) return `$${(volumeInUSDT / 1000).toFixed(0)}K`;
    return `$${volumeInUSDT.toFixed(0)}`;
  };

  return (
    <PageWrapper>
      {/* ========== TICKER BAR - Running Line ========== */}
      <TickerBar data-testid="ticker-bar">
        <TickerContent>
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <TickerItem key={`${item.key}-${index}`}>
              <span className="icon">
                <TickerIconComponent icon={item.icon} color={item.color} />
              </span>
              <span className="label">{item.label}:</span>
              <span className="value">{item.value}</span>
              {item.changeValue && (
                <span className={`change ${item.changePositive ? 'positive' : 'negative'}`}>
                  {item.changeValue}
                </span>
              )}
              <span className="divider" />
            </TickerItem>
          ))}
        </TickerContent>
      </TickerBar>

      {/* ========== TOP BAR (Level 1): Logo + Search + Actions ========== */}
      <TopBar data-testid="main-header">
        <LeftZone>
          <LogoWrapper onClick={() => router.push('/')}>
            <Image src="/images/logo.svg" alt="FOMO" width={90} height={28} priority />
          </LogoWrapper>
          
          <HeaderSearch>
            <Search size={16} />
            <input
              type="text"
              placeholder={tab === "duels" ? "Search duels..." : "Search markets..."}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              data-testid="header-search-input"
            />
          </HeaderSearch>
        </LeftZone>
        
        <RightZone>
          <Q1Indicator data-testid="season-indicator">
            <span className="pulse-dot" />
            Q1 2026 LIVE
          </Q1Indicator>
          
          <div style={{ position: 'relative' }}>
            <NotificationBell isOpen={isNotificationsOpen} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} />
            <NotificationsPanelComponent isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
          </div>
          
          <CreateButton onClick={handleCreateClick} data-testid="create-market-btn">
            <Plus size={16} />
            {tab === "duels" ? "Create Duel" : "Create Market"}
          </CreateButton>
          
          <ProfileDropdown />
        </RightZone>
      </TopBar>

      {/* ========== SUB NAV (Level 2): Navigation + Filters + Stats ========== */}
      <SubNavBar data-testid="sub-nav-bar">
        <NavTabs>
          <NavTab $active={tab === "arena"} onClick={() => handleTabChange("arena")} data-testid="nav-tab-arena">
            <ArenaIcon active={tab === "arena"} />
            Arena
          </NavTab>
          <NavTab $active={tab === "duels"} onClick={() => handleTabChange("duels")} data-testid="nav-tab-duels">
            <DuelsIcon active={tab === "duels"} />
            Duels
          </NavTab>
          <NavTab $active={tab === "leagues"} onClick={() => handleTabChange("leagues")} data-testid="nav-tab-leagues">
            <LeaguesIcon active={tab === "leagues"} />
            Analyst Leagues
          </NavTab>
          
          {(tab === "arena" || tab === "duels") && (
            <>
              <ArenaSort sortBy={sortBy} setSortBy={setSortBy} tab={tab} />
              <ArenaFilter filterDataInitial={filters} onSave={(filtersData: any) => setFilters(filtersData)} onReset={() => setFilters(null)} tab={tab} />
            </>
          )}
        </NavTabs>
        
        {tab === "arena" && (
          <StatsZone>
            <StatItem data-testid="stat-active-markets">
              <div className="icon-wrapper">
                <Flame size={16} color="#f97316" />
              </div>
              <div className="stat-content">
                <span className="label">Active Markets</span>
                <span className="value">{marketContext.activeMarkets}</span>
              </div>
            </StatItem>
            
            <StatItem data-testid="stat-total-volume">
              <div className="icon-wrapper">
                <TrendingUp size={16} color="#05A584" />
              </div>
              <div className="stat-content">
                <span className="label">Total Volume</span>
                <span className="value">{formatVolume(marketContext.totalVolume)}</span>
              </div>
            </StatItem>
            
            <TrendingZone>
              <span className="trending-label">
                <Award size={12} />
                Trending:
              </span>
              <div className="tags">
                {marketContext.trending.map((topic) => (
                  <TrendingTag key={topic} onClick={() => setSearchValue(topic)} data-testid={`trending-${topic.toLowerCase()}`}>
                    {topic}
                  </TrendingTag>
                ))}
              </div>
            </TrendingZone>
          </StatsZone>
        )}
      </SubNavBar>

      {/* ========== CONTENT ========== */}
      <ContentWrapper>
        {tab === "arena" && <ArenaTab searchValue={searchValue} sortBy={sortBy} filters={filters} />}
        {tab === "duels" && <DuelsTab />}
        {tab === "leagues" && <LeaguesTab />}
      </ContentWrapper>

      <CreatePredictionModal isOpen={isCreatePredictionOpen} onClose={() => setIsCreatePredictionOpen(false)} onSuccess={() => window.location.reload()} />
      <CreateDuelModal isOpen={isCreateDuelOpen} onClose={() => setIsCreateDuelOpen(false)} />
    </PageWrapper>
  );
};
