'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { TgBottomNav } from './TgBottomNav';
import { TgTopBar } from './TgTopBar';
import { getTelegramWebApp, initTelegramWebApp } from '@/lib/telegram';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { Web3Provider } from '@/lib/wagmi';

const ShellContainer = styled.div<{ $bgColor: string }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.$bgColor};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background 0.3s ease;
  
  /* Safe areas for notch/home indicator */
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 70px; /* Space for bottom nav */
  
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const LoadingScreen = styled.div<{ $bgColor: string; $textColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${props => props.$bgColor};
  color: ${props => props.$textColor};
  font-size: 18px;
  font-weight: 600;
`;

interface TgShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

function TgShellInner({ children, title, showBack, onBack }: TgShellProps) {
  const [isReady, setIsReady] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = getTelegramWebApp();
    
    if (tg) {
      initTelegramWebApp();
      
      // Set theme colors
      document.body.style.backgroundColor = theme.bgPrimary;
      
      // Expand to full height - CRITICAL
      tg.expand();
      
      // Configure header color
      if (tg.setHeaderColor) {
        tg.setHeaderColor(theme.bgPrimary);
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor(theme.bgPrimary);
      }
    }
    
    setIsReady(true);
  }, [theme]);

  if (!isReady) {
    return (
      <LoadingScreen $bgColor={theme.bgPrimary} $textColor={theme.textPrimary}>
        <div>Loading Arena...</div>
      </LoadingScreen>
    );
  }

  return (
    <ShellContainer data-testid="tg-shell" $bgColor={theme.bgPrimary}>
      <TgTopBar title={title} showBack={showBack} onBack={onBack} />
      <MainContent data-testid="tg-main-content">
        {children}
      </MainContent>
      <TgBottomNav />
    </ShellContainer>
  );
}

export function TgShell(props: TgShellProps) {
  return (
    <ThemeProvider>
      <Web3Provider>
        <TgShellInner {...props} />
      </Web3Provider>
    </ThemeProvider>
  );
}

export default TgShell;
