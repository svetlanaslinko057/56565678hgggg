'use client';

import React, { useState, useRef, useEffect } from "react";
import {
  HoverCardWrapper,
  HoverCardContent,
  UserHeader,
  UserAvatar,
  UserInfo,
  UserName,
  UserBadge,
  StatsRow,
  StatItem,
  StatValue,
  StatLabel,
} from "./styles";

interface UserHoverCardProps {
  userName: string;
  userAvatar?: string;
  positions?: number;
  profitLoss?: number;
  volume?: number;
  children: React.ReactNode;
}

const UserHoverCard: React.FC<UserHoverCardProps> = ({
  userName,
  userAvatar,
  positions = 2000,
  profitLoss = 709,
  volume = 15000,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && cardRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const cardHeight = cardRef.current.offsetHeight;

      setPosition({
        top: triggerRect.bottom + 8,
        left: triggerRect.left,
      });
    }
  }, [isVisible]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `$${(num / 1000).toFixed()}k`;
    }
    return `$${num}`;
  };

  return (
    <HoverCardWrapper
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <HoverCardContent
          ref={cardRef}
          style={{ top: position.top, left: position.left }}
        >
          <UserHeader>
            <UserAvatar src={userAvatar} alt={userName} />
            <UserInfo>
              <UserName>{userName}</UserName>
              <UserBadge>XXX</UserBadge>
            </UserInfo>
          </UserHeader>

          <StatsRow>
            <StatItem>
              <StatValue>{formatNumber(positions)}</StatValue>
              <StatLabel>Positions</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue profitLoss={profitLoss > 0}>
                {formatNumber(profitLoss)}
              </StatValue>
              <StatLabel>Profit/Loss</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{formatNumber(volume)}</StatValue>
              <StatLabel>Volume</StatLabel>
            </StatItem>
          </StatsRow>
        </HoverCardContent>
      )}
    </HoverCardWrapper>
  );
};

export default UserHoverCard;
