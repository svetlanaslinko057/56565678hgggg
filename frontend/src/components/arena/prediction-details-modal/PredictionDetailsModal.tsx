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
  MessageBox,
  Section,
  SectionTitle,
  DetailsCard,
  DetailRow,
  DetailLabel,
  DetailValue,
  StatsGrid,
  StatRow,
  StatLabel,
  StatValue,
  VoteRow,
  VoteLabel,
  VoteValue,
  InfoRow,
  InfoItem,
  InfoContent,
  InfoLabel,
  InfoValue,
  ResolutionSection,
  ResolutionTitle,
  ResolutionText,
  ModalFooter,
  CancelButton,
  TryAgainButton,
} from "./PredictionDetailsModal.styles";
import { X, Calendar, Lightbulb, Locate, LineChart } from "lucide-react";

interface PredictionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: {
    title: string;
    betId: string;
    placedDate: string;
    status: "won" | "lost";
    position: string;
    side: "yes" | "no";
    stakeAmount: number;
    odds: string;
    profit?: number;
    loss?: number;
    payout?: number;
    xpEarned: string;
    totalVolume: string;
    yourShare: string;
    yesVotes?: string;
    noVotes?: string;
    positions?: Array<{
      amount: string;
      side: "yes" | "no";
      percentage: string;
    }>;
    marketResolvedDate: string;
    resolutionText: string;
  };
}

export const PredictionDetailsModal: React.FC<PredictionDetailsModalProps> = ({
  isOpen,
  onClose,
  prediction,
}) => {
  if (!isOpen) return null;

  const getMessage = () => {
    if (prediction.status === "won") {
      return "Congratulations! Your prediction was correct";
    }
    return "Your prediction was incorrect this time";
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <ModalTitle>{prediction.title}</ModalTitle>
            <ModalSubtitle>
              Bet ID {prediction.betId} • Placed {prediction.placedDate}
            </ModalSubtitle>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <StatusBadge $status={prediction.status}>
              {prediction.status === "won" ? "You Won" : "You Lost"}
            </StatusBadge>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </div>
        </ModalHeader>

        <ModalBody>
          <MessageBox $status={prediction.status}>{getMessage()}</MessageBox>

          <Section>
            <SectionTitle>
              <Locate color="#2082EA" size={20} />
              Your Prediction
            </SectionTitle>

            <DetailsCard>
              <DetailRow>
                <DetailLabel>Your position:</DetailLabel>
                <DetailValue>
                  {prediction.position} •{" "}
                  {prediction.side === "yes" ? "Yes" : "No"}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Stake Amount:</DetailLabel>
                <DetailValue>{prediction.stakeAmount} USDT</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Odds:</DetailLabel>
                <DetailValue>{prediction.odds}</DetailValue>
              </DetailRow>

              {prediction.status === "won" &&
                prediction.profit !== undefined && (
                  <DetailRow $highlight>
                    <DetailLabel>Profit:</DetailLabel>
                    <DetailValue $variant="success">
                      +{prediction.profit} USDT
                    </DetailValue>
                  </DetailRow>
                )}

              {prediction.status === "lost" &&
                prediction.loss !== undefined && (
                  <DetailRow $highlight>
                    <DetailLabel>Loss:</DetailLabel>
                    <DetailValue $variant="danger">
                      {prediction.loss} USDT
                    </DetailValue>
                  </DetailRow>
                )}

              {prediction.status === "won" &&
                prediction.payout !== undefined && (
                  <DetailRow>
                    <DetailLabel>Payout:</DetailLabel>
                    <DetailValue $variant="large">
                      {prediction.payout} USDT
                    </DetailValue>
                  </DetailRow>
                )}

              <DetailRow>
                <DetailLabel>XP earned:</DetailLabel>
                <DetailValue $variant="success">
                  {prediction.xpEarned}
                </DetailValue>
              </DetailRow>
            </DetailsCard>
          </Section>

          <Section>
            <SectionTitle>
              <LineChart color="#2082EA" size={20} />
              Market Statistics
            </SectionTitle>

            <StatsGrid>
              <StatRow>
                <StatLabel>Total Volume</StatLabel>
                <StatValue>{prediction.totalVolume}</StatValue>
              </StatRow>

              <StatRow>
                <StatLabel>Your Share</StatLabel>
                <StatValue>{prediction.yourShare}</StatValue>
              </StatRow>

              {prediction.positions ? (
                <>
                  {prediction.positions.map((pos, index) => (
                    <VoteRow key={index}>
                      <VoteLabel>
                        {pos.amount} • {pos.side === "yes" ? "Yes" : "No"}
                      </VoteLabel>
                      <VoteValue>{pos.percentage}</VoteValue>
                    </VoteRow>
                  ))}
                </>
              ) : (
                <>
                  <VoteRow>
                    <VoteLabel>Yes Votes</VoteLabel>
                    <VoteValue>{prediction.yesVotes}</VoteValue>
                  </VoteRow>
                </>
              )}

              {prediction.positions ? (
                <>
                  {prediction.positions.slice(2).map((pos, index) => (
                    <VoteRow key={index}>
                      <VoteLabel>
                        {pos.amount} • {pos.side === "yes" ? "Yes" : "No"}
                      </VoteLabel>
                      <VoteValue>{pos.percentage}</VoteValue>
                    </VoteRow>
                  ))}
                </>
              ) : (
                <>
                  <VoteRow>
                    <VoteLabel>No Votes</VoteLabel>
                    <VoteValue>{prediction.noVotes}</VoteValue>
                  </VoteRow>
                </>
              )}
            </StatsGrid>
          </Section>

          <InfoRow>
            <InfoItem>
              <Calendar size={20} color="#738094" />
              <InfoContent>
                <InfoLabel>Bet Placed</InfoLabel>
                <InfoValue>{prediction.placedDate}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <Lightbulb size={20} color="#738094" />
              <InfoContent>
                <InfoLabel>Market Resolved</InfoLabel>
                <InfoValue>{prediction.marketResolvedDate}</InfoValue>
              </InfoContent>
            </InfoItem>
          </InfoRow>

          <ResolutionSection>
            <ResolutionTitle>Market Resolution</ResolutionTitle>
            <ResolutionText>{prediction.resolutionText}</ResolutionText>
          </ResolutionSection>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <TryAgainButton onClick={onClose}>
            Try Again on New Market
          </TryAgainButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
