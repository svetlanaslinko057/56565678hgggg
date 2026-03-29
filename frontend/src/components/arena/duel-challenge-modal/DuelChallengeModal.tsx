'use client';

import React from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  StatusBadge,
  CloseButton,
  ModalBody,
  MarketSection,
  MarketLabel,
  MarketTitle,
  ChallengeSection,
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
  InfoRow,
  InfoItem,
  InfoLabel,
  InfoValue,
  NoteSection,
  NoteLabel,
  NoteText,
  ModalFooter,
  DeclineButton,
  AcceptButton,
} from "./DuelChallengeModal.styles";
import { Clock, DollarSign, Users, X } from "lucide-react";
import UserAvatar from "@/global/common/UserAvatar";
import UserHoverCard from "../UserHoverCard";

interface DuelChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    challengerName: string;
    challengerAvatar: string;
    market: string;
    challengerSide: "yes" | "no";
    yourSide: "yes" | "no";
    stake: number;
    expiresIn: string;
  };
}

export const DuelChallengeModal: React.FC<DuelChallengeModalProps> = ({
  isOpen,
  onClose,
  challenge,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <ModalTitle>New Duel Challenge</ModalTitle>
            <ModalSubtitle>
              {challenge.challengerName} wants to challenge you
            </ModalSubtitle>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <StatusBadge>Pending Your Response</StatusBadge>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </div>
        </ModalHeader>

        <ModalBody>
          <MarketSection>
            <MarketLabel>Market</MarketLabel>
            <MarketTitle>{challenge.market}</MarketTitle>
          </MarketSection>

          <ChallengeSection>
            <SectionTitle>
              <Users color="#2082EA" />
              Challenge Details
            </SectionTitle>

            <ParticipantsGrid>
              <ParticipantCard>
                <ParticipantHeader>
                  <UserHoverCard
                    userName={challenge.challengerName}
                    userAvatar={challenge.challengerAvatar}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UserAvatar
                        avatar={challenge.challengerAvatar}
                        size="xxSmall"
                        variant="default"
                      />
                      <ParticipantName>
                        {challenge.challengerName}
                      </ParticipantName>
                    </div>
                  </UserHoverCard>
                  <HostBadge>Host</HostBadge>
                </ParticipantHeader>

                <ParticipantDetails>
                  <DetailRow>
                    <DetailLabel>Side:</DetailLabel>
                    <DetailValue $isYes={challenge.challengerSide === "yes"}>
                      {challenge.challengerSide === "yes" ? "Yes" : "No"}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Stake:</DetailLabel>
                    <DetailValue>{challenge.stake} USDT</DetailValue>
                  </DetailRow>
                </ParticipantDetails>
              </ParticipantCard>

              <ParticipantCard>
                <ParticipantHeader>
                  <UserHoverCard userName="You" userAvatar="">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UserAvatar avatar="" size="xxSmall" variant="default" />
                      <ParticipantName>You</ParticipantName>
                    </div>
                  </UserHoverCard>
                </ParticipantHeader>

                <ParticipantDetails>
                  <DetailRow>
                    <DetailLabel>Side:</DetailLabel>
                    <DetailValue $isYes={challenge.yourSide === "yes"}>
                      {challenge.yourSide === "yes" ? "Yes" : "No"}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Stake:</DetailLabel>
                    <DetailValue>{challenge.stake} USDT</DetailValue>
                  </DetailRow>
                </ParticipantDetails>
              </ParticipantCard>
            </ParticipantsGrid>
          </ChallengeSection>

          <InfoRow>
            <InfoItem>
              <DollarSign size={20} color="#738094" />
              <div className="col">
                <InfoLabel>Total Pot</InfoLabel>
                <InfoValue>{challenge.stake * 2} USDT</InfoValue>
              </div>
            </InfoItem>
            <InfoItem>
              <Clock size={20} color="#738094" />
              <div className="col">
                <InfoLabel>Expires In</InfoLabel>
                <InfoValue>{challenge.expiresIn}</InfoValue>
              </div>
            </InfoItem>
          </InfoRow>

          <NoteSection>
            <NoteLabel>Note:</NoteLabel>
            <NoteText>
              Duels do not change market payouts. They only compare results
              between two users on the same prediction. Winner takes the entire
              pot of $200.
            </NoteText>
          </NoteSection>
        </ModalBody>

        <ModalFooter>
          <DeclineButton onClick={onClose}>Decline Challenge</DeclineButton>
          <AcceptButton onClick={onClose}>Accept Challenge</AcceptButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
