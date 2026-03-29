'use client';

import React from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  DuelInfo,
  CloseButton,
  StatusBadge,
  ModalBody,
  CongratulationsBox,
  ParticipantsSection,
  SectionTitle,
  ParticipantsGrid,
  ParticipantCard,
  ParticipantHeader,
  ParticipantName,
  HostBadge,
  ParticipantDetails,
  DetailRow,
  DetailLabel,
  DetailValue,
  InfoGrid,
  InfoItem,
  InfoLabel,
  InfoValue,
  ResolutionSection,
  ResolutionTitle,
  ResolutionText,
  ModalFooter,
  CloseModalButton,
} from "./DuelDetailsModal.styles";
import { Calendar, Clock, DollarSign, Users, X } from "lucide-react";
import UserAvatar from "@/global/common/UserAvatar";
import UserHoverCard from "../UserHoverCard";
import League from "@/global/Icons/League";

interface DuelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  duel: {
    id: number;
    status: "won" | "lost" | "active" | "pending" | "declined" | "cancelled";
    title: string;
    duelId: string;
    createdDate: string;
    yourSide: "yes" | "no";
    yourStake: number;
    yourResult?: number;
    opponentName: string;
    opponentAvatar: string;
    opponentSide: "yes" | "no";
    opponentStake: number;
    opponentResult?: number;
    totalPot: number;
    startedDate: string;
    settledDate?: string;
    resolutionText?: string;
    isYouHost?: boolean;
  };
}

export const DuelDetailsModal: React.FC<DuelDetailsModalProps> = ({
  isOpen,
  onClose,
  duel,
}) => {
  if (!isOpen) return null;

  const getStatusText = () => {
    switch (duel.status) {
      case "won":
        return "You Won";
      case "lost":
        return "You Lost";
      case "active":
        return "Active";
      case "pending":
        return "Pending Invite";
      case "declined":
        return "Declined";
      case "cancelled":
        return "Cancelled";
      default:
        return "";
    }
  };

  const getCongratulationsMessage = () => {
    if (duel.status === "won") return "Congratulations! You won this duel";
    if (duel.status === "lost") return "Better luck next time";
    if (duel.status === "active")
      return "Duel in progress, waiting for market to resolve";
    if (duel.status === "pending") return "Waiting for opponent to accept";
    if (duel.status === "declined") return "Opponent declined the challenge";
    if (duel.status === "cancelled") return "Duel was cancelled";
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <ModalTitle>{duel.title}</ModalTitle>
            <DuelInfo>
              Duel ID: #{duel.duelId} • Created {duel.createdDate} • 00:00
            </DuelInfo>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <StatusBadge $status={duel.status}>{getStatusText()}</StatusBadge>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </div>
        </ModalHeader>

        <ModalBody>
          {getCongratulationsMessage() && (
            <CongratulationsBox>
              {getCongratulationsMessage()}
            </CongratulationsBox>
          )}

          <ParticipantsSection>
            <SectionTitle>
              <Users color="#2082EA" size={24} />
              Participants
            </SectionTitle>

            <ParticipantsGrid>
              <ParticipantCard
                $isWinner={duel.status === "won"}
                $isLoser={duel.status === "lost"}
              >
                <ParticipantHeader>
                  <UserHoverCard
                    userName="You"
                    userAvatar={duel.opponentAvatar}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UserAvatar
                        avatar={duel.opponentAvatar}
                        size="xxSmall"
                        variant="default"
                      />
                      <ParticipantName>You</ParticipantName>
                    </div>
                  </UserHoverCard>
                  {duel.isYouHost && <HostBadge>Host</HostBadge>}
                </ParticipantHeader>

                <ParticipantDetails>
                  <DetailRow>
                    <DetailLabel>Side:</DetailLabel>
                    <DetailValue>
                      {duel.yourSide === "yes" ? "Yes" : "No"}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Stake:</DetailLabel>
                    <DetailValue>{duel.yourStake} USDT</DetailValue>
                  </DetailRow>
                  {duel.yourResult !== undefined && (
                    <DetailRow className="result">
                      <DetailLabel>
                        {duel.yourResult > 0 ? "Profit:" : "Loss:"}
                      </DetailLabel>
                      <DetailValue $isPositive={duel.yourResult > 0}>
                        {duel.yourResult > 0 ? "+" : ""}
                        {duel.yourResult} USDT
                      </DetailValue>
                    </DetailRow>
                  )}
                </ParticipantDetails>
              </ParticipantCard>

              <ParticipantCard>
                <ParticipantHeader>
                  <UserHoverCard
                    userName={duel.opponentName}
                    userAvatar={duel.opponentAvatar}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UserAvatar
                        avatar={duel.opponentAvatar}
                        size="xxSmall"
                        variant="default"
                      />
                      <ParticipantName>{duel.opponentName}</ParticipantName>
                    </div>
                  </UserHoverCard>
                  {!duel.isYouHost && <HostBadge>Host</HostBadge>}
                </ParticipantHeader>

                <ParticipantDetails>
                  <DetailRow>
                    <DetailLabel>Side:</DetailLabel>
                    <DetailValue $isYes={duel.opponentSide === "yes"}>
                      {duel.opponentSide === "yes" ? "Yes" : "No"}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Stake:</DetailLabel>
                    <DetailValue>{duel.opponentStake} USDT</DetailValue>
                  </DetailRow>
                  {duel.opponentResult !== undefined && (
                    <DetailRow className="result">
                      <DetailLabel>
                        {duel.opponentResult < 0 ? "Loss:" : "Profit:"}
                      </DetailLabel>
                      <DetailValue $isPositive={duel.opponentResult > 0}>
                        {duel.opponentResult > 0 ? "+" : ""}
                        {duel.opponentResult} USDT
                      </DetailValue>
                    </DetailRow>
                  )}
                </ParticipantDetails>
              </ParticipantCard>
            </ParticipantsGrid>
          </ParticipantsSection>

          <InfoGrid>
            <InfoItem>
              <DollarSign size={24} color="#738094" />
              <div className="">
                <InfoLabel>Total Pot</InfoLabel>
                <InfoValue>{duel.totalPot} USDT</InfoValue>
              </div>
            </InfoItem>
            {duel.startedDate && (
              <InfoItem>
                <Clock size={24} color="#738094" />
                <div className="">
                  <InfoLabel>Started</InfoLabel>
                  <InfoValue>{duel.startedDate}</InfoValue>
                </div>
              </InfoItem>
            )}
            <InfoItem>
              <Calendar size={24} color="#738094" />
              <div className="">
                <InfoLabel>Created</InfoLabel>
                <InfoValue>{duel.createdDate}</InfoValue>
              </div>
            </InfoItem>
            {duel.settledDate && (
              <InfoItem>
                <League size={24} color="#738094" />
                <div className="">
                  <InfoLabel>Settled</InfoLabel>
                  <InfoValue>{duel.settledDate || "-"}</InfoValue>
                </div>
              </InfoItem>
            )}
          </InfoGrid>

          {duel.resolutionText && (
            <ResolutionSection>
              <ResolutionTitle>Market Resolution</ResolutionTitle>
              <ResolutionText>{duel.resolutionText}</ResolutionText>
            </ResolutionSection>
          )}
        </ModalBody>

        <ModalFooter>
          <CloseModalButton onClick={onClose}>Close</CloseModalButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
