'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket } from '@/lib/contracts';
import { CONTRACTS, CHAIN_CONFIG } from '@/lib/contracts/config';
import { OnchainAdminPanel } from '@/components/arena/OnchainAdminPanel';
import { OnchainPositionsPanel } from '@/components/arena/OnchainPositionsPanel';
import { SyncIndicator } from '@/components/arena/SyncIndicator';
import { OnchainPositionsAPI, OnchainStatsAPI, ContractConfig } from '@/lib/api/onchainApi';
import { 
  Wallet, Shield, Trophy, ExternalLink, 
  RefreshCw, Settings, Zap, Link2
} from 'lucide-react';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 48px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`;

const PageSubtitle = styled.p`
  font-size: 15px;
  color: #738094;
  margin-bottom: 32px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const InfoCard = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 24px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: #10B981;
  }
`;

const ContractInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
`;

const InfoLabel = styled.span`
  font-size: 13px;
  color: #738094;
`;

const InfoValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AddressLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #10B981;
  text-decoration: none;
  font-family: monospace;
  font-size: 12px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span<{ $connected?: boolean }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  
  ${({ $connected }) => $connected ? `
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
  ` : `
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  `}
`;

const RoleBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const RoleBadge = styled.span<{ $role: string }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  
  ${({ $role }) => {
    switch ($role) {
      case 'owner':
        return `background: rgba(139, 92, 246, 0.15); color: #8b5cf6;`;
      case 'admin':
        return `background: rgba(59, 130, 246, 0.15); color: #3b82f6;`;
      case 'resolver':
        return `background: rgba(236, 72, 153, 0.15); color: #ec4899;`;
      default:
        return `background: rgba(107, 114, 128, 0.15); color: #6b7280;`;
    }
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef1f5;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #738094;
`;

const ConnectPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  text-align: center;
  padding: 48px;
`;

const PromptIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  svg {
    width: 40px;
    height: 40px;
    color: white;
  }
`;

const PromptTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
`;

const PromptText = styled.p`
  font-size: 16px;
  color: #738094;
  margin-bottom: 24px;
`;

export default function OnchainPage() {
  const { isConnected, isAuthenticated, walletAddress } = useWallet();
  const { config: walletConfig, roles, stableBalance, loading, error, refresh } = usePredictionMarket();
  const [hydrated, setHydrated] = useState(false);
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [apiConfig, setApiConfig] = useState<ContractConfig | null>(null);
  
  // Use wallet config if available, otherwise use API config
  const config = walletConfig || apiConfig;

  useEffect(() => {
    setHydrated(true);
  }, []);
  
  // Fetch config from API (fallback for non-connected users)
  useEffect(() => {
    if (!walletConfig) {
      OnchainStatsAPI.getContractConfig()
        .then(cfg => setApiConfig(cfg))
        .catch(err => console.error('Failed to fetch config from API:', err));
    }
  }, [walletConfig]);

  // Fetch token IDs from onchain API (indexer mirror)
  useEffect(() => {
    if (walletAddress) {
      OnchainPositionsAPI.getTokenIds(walletAddress)
        .then(ids => setUserTokenIds(ids))
        .catch(err => console.error('Failed to fetch token IDs:', err));
    }
  }, [walletAddress]);

  if (!hydrated) {
    return null;
  }

  const explorerUrl = CHAIN_CONFIG.blockExplorer;

  return (
    <PageWrapper>
      <Container>
        <BreadCrumbs items={[
          { title: 'Arena', link: '/arena' },
          { title: 'On-Chain', link: '' }
        ]} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <PageTitle>On-Chain Markets</PageTitle>
          <SyncIndicator />
        </div>
        <PageSubtitle>
          Interact directly with the StablePredictionMarketNFT smart contract
        </PageSubtitle>

        {/* Stats */}
        <StatsGrid>
          <StatCard>
            <StatValue>{config?.minBetFormatted || '0'}</StatValue>
            <StatLabel>Min Bet (USDT)</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{config ? (config.claimFeeBps / 100).toFixed(1) : '0'}%</StatValue>
            <StatLabel>Platform Fee</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stableBalance?.balanceFormatted ? parseFloat(stableBalance.balanceFormatted).toFixed(2) : '0'}</StatValue>
            <StatLabel>Your Balance</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{userTokenIds.length}</StatValue>
            <StatLabel>Your Positions</StatLabel>
          </StatCard>
        </StatsGrid>

        <Grid>
          {/* Contract Info */}
          <InfoCard>
            <CardTitle>
              <Link2 size={20} />
              Contract Information
            </CardTitle>
            <ContractInfo>
              <InfoRow>
                <InfoLabel>Market Contract</InfoLabel>
                <InfoValue>
                  <AddressLink 
                    href={`${explorerUrl}/address/${CONTRACTS.MARKET_ADDRESS}`}
                    target="_blank"
                  >
                    {CONTRACTS.MARKET_ADDRESS.slice(0, 6)}...{CONTRACTS.MARKET_ADDRESS.slice(-4)}
                    <ExternalLink size={12} />
                  </AddressLink>
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Stablecoin</InfoLabel>
                <InfoValue>
                  <AddressLink 
                    href={`${explorerUrl}/token/${CONTRACTS.STABLE_TOKEN}`}
                    target="_blank"
                  >
                    {CONTRACTS.STABLE_TOKEN.slice(0, 6)}...{CONTRACTS.STABLE_TOKEN.slice(-4)}
                    <ExternalLink size={12} />
                  </AddressLink>
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Network</InfoLabel>
                <InfoValue>{CHAIN_CONFIG.chainName}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Fee Recipient</InfoLabel>
                <InfoValue>
                  {config?.feeRecipient ? (
                    <AddressLink 
                      href={`${explorerUrl}/address/${config.feeRecipient}`}
                      target="_blank"
                    >
                      {config.feeRecipient.slice(0, 6)}...{config.feeRecipient.slice(-4)}
                      <ExternalLink size={12} />
                    </AddressLink>
                  ) : '-'}
                </InfoValue>
              </InfoRow>
            </ContractInfo>
          </InfoCard>

          {/* Wallet Info */}
          <InfoCard>
            <CardTitle>
              <Wallet size={20} />
              Your Wallet
            </CardTitle>
            <ContractInfo>
              <InfoRow>
                <InfoLabel>Status</InfoLabel>
                <InfoValue>
                  <StatusBadge $connected={isConnected && isAuthenticated}>
                    {isConnected && isAuthenticated ? 'Connected & Signed' : isConnected ? 'Connected' : 'Not Connected'}
                  </StatusBadge>
                </InfoValue>
              </InfoRow>
              {walletAddress && (
                <InfoRow>
                  <InfoLabel>Address</InfoLabel>
                  <InfoValue>
                    <AddressLink 
                      href={`${explorerUrl}/address/${walletAddress}`}
                      target="_blank"
                    >
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      <ExternalLink size={12} />
                    </AddressLink>
                  </InfoValue>
                </InfoRow>
              )}
              <InfoRow>
                <InfoLabel>USDT Balance</InfoLabel>
                <InfoValue>
                  {stableBalance ? parseFloat(stableBalance.balanceFormatted).toFixed(2) : '0'} USDT
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Approved</InfoLabel>
                <InfoValue>
                  {stableBalance ? parseFloat(stableBalance.allowanceFormatted).toFixed(2) : '0'} USDT
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Roles</InfoLabel>
                <InfoValue>
                  <RoleBadges>
                    {roles.isOwner && <RoleBadge $role="owner">Owner</RoleBadge>}
                    {roles.isAdmin && <RoleBadge $role="admin">Admin</RoleBadge>}
                    {roles.isResolver && <RoleBadge $role="resolver">Resolver</RoleBadge>}
                    {!roles.isOwner && !roles.isAdmin && !roles.isResolver && (
                      <RoleBadge $role="user">User</RoleBadge>
                    )}
                  </RoleBadges>
                </InfoValue>
              </InfoRow>
            </ContractInfo>
          </InfoCard>

          {/* Admin Panel */}
          {(roles.isOwner || roles.isAdmin || roles.isResolver) && (
            <FullWidth>
              <OnchainAdminPanel />
            </FullWidth>
          )}

          {/* Positions Panel */}
          <FullWidth>
            <OnchainPositionsPanel 
              tokenIds={userTokenIds}
              onPositionClaimed={(tokenId) => {
                console.log('Position claimed:', tokenId);
              }}
              onPositionRefunded={(tokenId) => {
                console.log('Position refunded:', tokenId);
              }}
            />
          </FullWidth>
        </Grid>

        {!isConnected && (
          <ConnectPrompt>
            <PromptIcon><Zap /></PromptIcon>
            <PromptTitle>Connect Your Wallet</PromptTitle>
            <PromptText>
              Connect your wallet to interact with on-chain prediction markets
            </PromptText>
          </ConnectPrompt>
        )}
      </Container>
    </PageWrapper>
  );
}
