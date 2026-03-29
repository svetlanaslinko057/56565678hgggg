'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Bell } from 'lucide-react';
import { ProfileDropdown } from '@/components/wallet/ProfileDropdown';
import { NotificationsPanelComponent } from '@/components/arena/notification-panel/NotificationsPanel';

// ============== STYLED COMPONENTS ==============
const HeaderWrapper = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  
  &:hover {
    opacity: 0.9;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #0f172a;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #1e293b;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const BellButton = styled.button<{ $hasNotifications?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${({ $hasNotifications }) => $hasNotifications ? '#FEF3C7' : '#f5f7fa'};
  border: none;
  border-radius: 10px;
  color: ${({ $hasNotifications }) => $hasNotifications ? '#F59E0B' : '#738094'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ $hasNotifications }) => $hasNotifications ? '#FDE68A' : '#eef1f5'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #FF5858;
  border-radius: 50%;
  border: 2px solid #fff;
`;

const StatusPill = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #E8F5F1;
  border: 1px solid #B8E0D5;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #05A584;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #05A584;
    border-radius: 50%;
  }
`;

// ============== COMPONENT ==============
interface GlobalHeaderProps {
  showCreate?: boolean;
  createLabel?: string;
  onCreateClick?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  showCreate = true,
  createLabel = 'Create Market',
  onCreateClick,
}) => {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleCreate = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      router.push('/arena/create');
    }
  };

  return (
    <HeaderWrapper>
      <LeftSection>
        {/* Logo only - clickable to home */}
        <LogoLink href="/" data-testid="logo-link">
          <Image
            src="/images/logo.svg"
            alt="FOMO Arena"
            width={120}
            height={40}
            priority
            style={{ objectFit: 'contain' }}
          />
        </LogoLink>
      </LeftSection>

      <RightSection>
        {/* Create Button */}
        {showCreate && (
          <CreateButton onClick={handleCreate} data-testid="header-create-btn">
            <Plus />
            {createLabel}
          </CreateButton>
        )}

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <BellButton 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            data-testid="header-notifications-btn"
          >
            <Bell />
            <NotificationBadge />
          </BellButton>
          <NotificationsPanelComponent
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* Season Status */}
        <StatusPill>Q1 2026 Live</StatusPill>

        {/* Wallet */}
        <ProfileDropdown />
      </RightSection>
    </HeaderWrapper>
  );
};

export default GlobalHeader;
