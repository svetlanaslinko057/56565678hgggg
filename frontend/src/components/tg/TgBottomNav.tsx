'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { usePathname, useRouter } from 'next/navigation';
import { Target, Swords, Trophy, User } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

const NavContainer = styled.nav<{ $bgColor: string; $borderColor: string }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.$bgColor};
  border-top: 1px solid ${props => props.$borderColor};
  padding: 8px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
  z-index: 1000;
  transition: all 0.3s ease;
`;

const NavList = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
`;

const NavItem = styled.button<{ $active?: boolean; $activeColor: string; $inactiveColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
  min-width: 64px;
  
  ${({ $active, $activeColor, $inactiveColor }) => $active ? css`
    color: ${$activeColor};
    background: ${$activeColor}15;
    
    svg {
      filter: drop-shadow(0 0 8px ${$activeColor}80);
    }
  ` : css`
    color: ${$inactiveColor};
    
    &:active {
      background: ${$inactiveColor}10;
      transform: scale(0.95);
    }
  `}
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItemConfig[] = [
  { path: '/tg/arena', label: 'Arena', icon: <Target size={22} /> },
  { path: '/tg/duels', label: 'Duels', icon: <Swords size={22} /> },
  { path: '/tg/leaderboard', label: 'Leaders', icon: <Trophy size={22} /> },
  { path: '/tg/profile', label: 'Profile', icon: <User size={22} /> },
];

export function TgBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const isActive = (path: string) => {
    if (path === '/tg/arena') {
      return pathname === '/tg' || pathname === '/tg/arena' || pathname?.startsWith('/tg/arena');
    }
    return pathname?.startsWith(path);
  };

  return (
    <NavContainer 
      data-testid="tg-bottom-nav"
      $bgColor={theme.bgNav}
      $borderColor={theme.border}
    >
      <NavList>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            $active={isActive(item.path)}
            $activeColor={theme.accent}
            $inactiveColor={theme.textMuted}
            onClick={() => router.push(item.path)}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <NavIcon>{item.icon}</NavIcon>
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        ))}
      </NavList>
    </NavContainer>
  );
}

export default TgBottomNav;
