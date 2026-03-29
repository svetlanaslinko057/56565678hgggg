'use client';

import React from 'react';
import styled from 'styled-components';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { usePathname } from 'next/navigation';

const LayoutWrapper = styled.div`
  min-height: 100vh;
  background: #f8f9fc;
`;

const MainContent = styled.main`
  /* Content styles handled by individual pages */
`;

interface ArenaLayoutClientProps {
  children: React.ReactNode;
}

export default function ArenaLayoutClient({ children }: ArenaLayoutClientProps) {
  const pathname = usePathname();
  
  // Main page has its own header built into ArenaComponent
  const isMainPage = pathname === '/' || pathname === '/arena';
  
  // Check if we're on an inner page
  const isMarketDetail = pathname?.match(/^\/arena\/[a-f0-9]{24}$/);
  const isPositions = pathname === '/arena/positions';
  const isCreate = pathname === '/arena/create';
  const isAnalyst = pathname?.startsWith('/arena/analyst');
  const isMyMarkets = pathname === '/arena/my-markets';
  const isMarketplace = pathname === '/arena/marketplace';
  const isProfile = pathname === '/arena/profile';
  const isSettings = pathname === '/arena/settings';
  const isOnchain = pathname === '/arena/onchain';
  const isCabinet = pathname === '/arena/cabinet';
  
  // Show global header only on inner pages (main page has its own)
  const showGlobalHeader = !isMainPage && (
    isMarketDetail || isPositions || isCreate || isAnalyst || isMyMarkets || isMarketplace || isProfile || isSettings || isOnchain || isCabinet
  );

  return (
    <LayoutWrapper>
      {showGlobalHeader && (
        <GlobalHeader
          showCreate={!isCreate}
          createLabel="Create Market"
        />
      )}
      <MainContent>
        {children}
      </MainContent>
    </LayoutWrapper>
  );
}
