'use client';

import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  SideBadge,
  HighStakesBadge,
  Title,
  HostSection,
  HostInfo,
  HostName,
  HostLabel,
  Stakes,
  StakeRow,
  Footer,
  Timer,
  StatusBadge,
  Actions,
  ActionButton,
} from "./DuelCard.styles";
import { Clock, Star, Sparkles } from "lucide-react";
import UserAvatar from "@/global/common/UserAvatar";
import UserHoverCard from "../UserHoverCard";
import { DuelToast } from "@/UI/DuelToast/DuelToast";
import styled, { keyframes } from "styled-components";

// Featured Badge styles
const featuredGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6); }
`;

const FeaturedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.15) 100%);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #ffd700;
  animation: ${featuredGlow} 2s ease-in-out infinite;
`;

const FeaturedCard = styled(Card)<{ $featured?: boolean }>`
  ${({ $featured }) => $featured && `
    border: 2px solid rgba(255, 215, 0, 0.4);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(30, 30, 40, 0.95) 100%);
  `}
`;

const FeatureButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #ffd700;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateY(-1px);
  }
`;

interface DuelCardProps {
  id?: string;
  side: "yes" | "no";
  isHighStakes: boolean;
  isFeatured?: boolean;
  title: string;
  hostName: string;
  hostAvatar: string;
  hostWallet?: string;
  currentUserWallet?: string;
  stakePerSide: number;
  totalPot: number;
  timeLeft: string;
  status: "ends-soon" | "slot-free" | "no-slots";
  availableActions: ("join-yes" | "join-no" | "yes" | "no")[];
  onFeature?: (duelId: string) => void;
}

export const DuelCard: React.FC<DuelCardProps> = ({
  id,
  side,
  isHighStakes,
  isFeatured = false,
  title,
  hostName,
  hostAvatar,
  hostWallet,
  currentUserWallet,
  stakePerSide,
  totalPot,
  timeLeft,
  status,
  availableActions,
  onFeature,
}) => {
  const [featuring, setFeaturing] = useState(false);
  const isHost = hostWallet && currentUserWallet && hostWallet.toLowerCase() === currentUserWallet.toLowerCase();
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ends-soon":
        return "Ends Soon";
      case "slot-free":
        return "1 slot free";
      case "no-slots":
        return "No free slots";
      default:
        return "";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ends-soon":
        return "warning";
      case "slot-free":
        return "success";
      case "no-slots":
        return "danger";
      default:
        return undefined;
    }
  };

  const handleJoinDuel = (joinSide: "yes" | "no") => {
    const sideText = joinSide === "yes" ? "YES" : "NO";
    toast.success(
      <DuelToast
        title={`Joined duel as ${sideText}!`}
        description={`Stake: ${stakePerSide.toLocaleString()} USDT`}
      />,
      {
        icon: false,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }
    );
  };

  const handleFeature = async () => {
    if (!id || featuring) return;
    setFeaturing(true);
    try {
      if (onFeature) {
        await onFeature(id);
      }
      toast.success('Duel featured! Now visible to more players');
    } catch (err) {
      toast.error('Failed to feature duel');
    }
    setFeaturing(false);
  };

  return (
    <FeaturedCard $featured={isFeatured} data-testid={isFeatured ? 'featured-duel-card' : 'duel-card'}>
      <CardHeader>
        <SideBadge $side={side}>{side === "yes" ? "Yes" : "No"}</SideBadge>
        {isFeatured && (
          <FeaturedBadge data-testid="featured-badge">
            <Star size={12} fill="#ffd700" /> FEATURED
          </FeaturedBadge>
        )}
        {isHighStakes && <HighStakesBadge>High Stakes</HighStakesBadge>}
      </CardHeader>

      <Title>{title}</Title>

      <HostSection>
        <UserHoverCard userName={hostName} userAvatar={hostAvatar}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <UserAvatar avatar={hostAvatar} size="otc" variant="default" />
            <HostInfo>
              <HostName>{hostName}</HostName>
              <HostLabel>Host</HostLabel>
            </HostInfo>
          </div>
        </UserHoverCard>
      </HostSection>

      <Stakes>
        <StakeRow>
          <span className="label">Stake per side</span>
          <span className="value">{stakePerSide.toLocaleString()} USDT</span>
        </StakeRow>
        <StakeRow>
          <span className="label">Total Pot</span>
          <span className="value gray">{totalPot.toLocaleString()} USDT</span>
        </StakeRow>
      </Stakes>

      <Footer>
        <Actions>
          <Timer>
            <Clock size={16} />
            {timeLeft}
          </Timer>
          <StatusBadge $variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </StatusBadge>
          {/* Feature button for host */}
          {isHost && !isFeatured && id && (
            <FeatureButton onClick={handleFeature} disabled={featuring} data-testid="feature-duel-btn">
              <Sparkles size={14} />
              {featuring ? 'Processing...' : 'Feature ($2)'}
            </FeatureButton>
          )}
        </Actions>
        <Actions>
          <ActionButton
            $variant="success"
            $disabled={side === "yes"}
            disabled={side === "yes"}
            onClick={() => side !== "yes" && handleJoinDuel("yes")}
          >
            {side === "yes" ? "Yes" : "Join Yes"}
          </ActionButton>
          <ActionButton
            $variant="danger"
            $disabled={side === "no"}
            disabled={side === "no"}
            onClick={() => side !== "no" && handleJoinDuel("no")}
          >
            {side === "no" ? "No" : "Join No"}
          </ActionButton>
        </Actions>
      </Footer>
    </FeaturedCard>
  );
};
