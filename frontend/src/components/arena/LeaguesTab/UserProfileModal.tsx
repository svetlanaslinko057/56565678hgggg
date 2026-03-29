'use client';

import React from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  UserHeaderInfo,
  UserAvatarWrapper,
  UserDetails,
  UserName,
  UserRankInfo,
  RankText,
  TopPercentBadge,
  PointsBadge,
  CloseButton,
  ModalBody,
  StatsGrid,
  StatCard,
  StatIcon,
  StatValue,
  StatLabel,
  Section,
  SectionHeader,
  SectionTitle,
  ROICard,
  ROIValue,
  ROIDescription,
  PredictionsList,
  PredictionItem,
  PredictionText,
  PredictionROI,
  ModalFooter,
  FooterButton,
} from "./UserProfileModal.styles";
import { X } from "lucide-react";
import UserAvatar from "@/global/common/UserAvatar";
import Arrow from "@/global/Icons/Arrow";
import League from "@/global/Icons/League";
import Accuracy from "@/global/Icons/Accuracy";
import Trophy from "@/global/Icons/Trophy";
import ArenaTabIcon from "@/global/Icons/ArenaTabIcon";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    avatar: string;
    rank: number;
    topPercent: string;
    points: number;
    totalPredictions: number;
    currentStreak: number;
    winRate: number;
    roi: number;
    roiDescription: string;
    topPredictions: Array<{
      text: string;
      roi: string;
    }>;
  };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <UserHeaderInfo>
            <UserAvatarWrapper>
              <UserAvatar
                avatar={user.avatar}
                size="otc"
                variant="success"
                rating={94}
              />
            </UserAvatarWrapper>
            <UserDetails>
              <UserName>{user.name}</UserName>
              <UserRankInfo>
                <RankText>Rank #{user.rank}</RankText>
                <TopPercentBadge>{user.topPercent}</TopPercentBadge>
                <PointsBadge>{user.points} pts</PointsBadge>
              </UserRankInfo>
            </UserDetails>
          </UserHeaderInfo>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <StatsGrid>
            <StatCard>
              <StatIcon>
                <ArenaTabIcon size={40} color="#05A584" />
              </StatIcon>
              <StatValue>{user.totalPredictions}</StatValue>
              <StatLabel>Total Predictions</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>
                <Arrow size={40} />
              </StatIcon>
              <StatValue>{user.currentStreak} wins</StatValue>
              <StatLabel>Current Streak</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>
                <Accuracy size={40} />
              </StatIcon>
              <StatValue>{user.winRate}%</StatValue>
              <StatLabel>Win Rate</StatLabel>
            </StatCard>
          </StatsGrid>

          <Section>
            <SectionHeader>
              <Arrow size={24} />
              <SectionTitle>Performance Overview</SectionTitle>
            </SectionHeader>
            <ROICard>
              <ROIValue>
                <p>Total ROI</p>
                <strong>+{user.roi}%</strong>
              </ROIValue>
              <ROIDescription>{user.roiDescription}</ROIDescription>
            </ROICard>
          </Section>

          <Section>
            <SectionHeader>
              <League size={24} />
              <SectionTitle>Top Performing Predictions</SectionTitle>
            </SectionHeader>
            <PredictionsList>
              {user.topPredictions.map((prediction, index) => (
                <PredictionItem key={index}>
                  <PredictionText>{prediction.text}</PredictionText>
                  <PredictionROI>{prediction.roi}</PredictionROI>
                </PredictionItem>
              ))}
            </PredictionsList>
          </Section>
        </ModalBody>

        <ModalFooter>
          <FooterButton onClick={onClose}>Close</FooterButton>
          <FooterButton $variant="primary">Follow Analyst</FooterButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
