'use client';

import React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalLeft,
  ModalTitle,
  ModalRight,
  CloseButton,
  RiskBadge,
  Section,
  SectionHeader,
  SectionText,
  SelectSide,
  SideButtons,
  SideButton,
  BetInputWrapper,
  BetInputRow,
  BetRow,
  BetSpinnerButtons,
  PotentialReturn,
  Summary,
  SummaryRow,
  PlaceButton,
  ModalBody,
} from "./ConditionalBetModal.styles";
import { StatusBadge } from "../prediction-card/styles";
import UserAvatar from "@/global/common/UserAvatar";

interface ConditionalBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  logo: string;
  title: string;
  subtitle?: string;
  status: "Active" | "Live" | "Pending" | "Resolved";
  risk: "Low" | "Medium" | "High";
  conditional: {
    condition: string;
    result: string;
  };
  conditionalBets: {
    if: { side: "yes" | "no" | null; amount: number };
    thenBet: { side: "yes" | "no" | null; amount: number };
  };
  setConditionalBets: React.Dispatch<
    React.SetStateAction<{
      if: { side: "yes" | "no" | null; amount: number };
      thenBet: { side: "yes" | "no" | null; amount: number };
    }>
  >;
  onPlaceBet: () => void;
}

export const ConditionalBetModal: React.FC<ConditionalBetModalProps> = ({
  isOpen,
  onClose,
  logo,
  title,
  subtitle,
  status,
  risk,
  conditional,
  conditionalBets,
  setConditionalBets,
  onPlaceBet,
}) => {
  if (!isOpen) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "#05A584";
      case "Medium":
        return "#FFB800";
      case "High":
        return "#FF5858";
      default:
        return "#738094";
    }
  };

  return (
    <ModalOverlay
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <ModalContent
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <ModalHeader>
          <ModalLeft>
            <UserAvatar avatar={logo} variant="default" size="otc" />
            <ModalTitle>
              <h3>{title}</h3>
              <span>{subtitle || "NFT & Collectibles"}</span>
            </ModalTitle>
          </ModalLeft>
          <ModalRight>
            <div style={{ display: "flex", gap: "8px" }}>
              <StatusBadge $status={status}>{status}</StatusBadge>
            </div>
            <RiskBadge>
              Risks: <span style={{ color: getRiskColor(risk) }}>{risk}</span>
            </RiskBadge>
          </ModalRight>
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={22} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Section>
            <SectionHeader>
              <span className="condition-label">If</span>
              <SectionText>{conditional.condition}</SectionText>
            </SectionHeader>

            <SelectSide>
              <h4>Select Side</h4>
              <SideButtons>
                <SideButton
                  active={conditionalBets.if.side === "yes"}
                  variant="yes"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConditionalBets({
                      ...conditionalBets,
                      if: { 
                        ...conditionalBets.if, 
                        side: conditionalBets.if.side === "yes" ? null : "yes" 
                      },
                    });
                  }}
                >
                  <span>Yes</span>
                  <span className="multiplier">1.3x</span>
                </SideButton>
                <SideButton
                  active={conditionalBets.if.side === "no"}
                  variant="no"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConditionalBets({
                      ...conditionalBets,
                      if: { 
                        ...conditionalBets.if, 
                        side: conditionalBets.if.side === "no" ? null : "no" 
                      },
                    });
                  }}
                >
                  <span>No</span>
                  <span className="multiplier">2.7x</span>
                </SideButton>
              </SideButtons>
            </SelectSide>

            <BetInputWrapper>
              <BetInputRow>
                <BetRow>
                  <span className="label">USDT</span>
                  <input
                    type="number"
                    value={conditionalBets.if.amount}
                    onChange={(e) =>
                      setConditionalBets({
                        ...conditionalBets,
                        if: {
                          ...conditionalBets.if,
                          amount: Number(e.target.value),
                        },
                      })
                    }
                    min="0"
                  />
                  <span className="increment">+10</span>
                  <BetSpinnerButtons>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConditionalBets({
                          ...conditionalBets,
                          if: {
                            ...conditionalBets.if,
                            amount: conditionalBets.if.amount + 10,
                          },
                        });
                      }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConditionalBets({
                          ...conditionalBets,
                          if: {
                            ...conditionalBets.if,
                            amount: Math.max(0, conditionalBets.if.amount - 10),
                          },
                        });
                      }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </BetSpinnerButtons>
                </BetRow>
              </BetInputRow>
              <PotentialReturn>
                Potential return:{" "}
                <strong>
                  {conditionalBets.if.side === "yes"
                    ? (conditionalBets.if.amount * 1.3).toFixed(0)
                    : (conditionalBets.if.amount * 2.7).toFixed(0)}{" "}
                  USDT
                </strong>
              </PotentialReturn>
            </BetInputWrapper>
          </Section>

          <Section>
            <SectionHeader>
              <span className="condition-label">Then</span>
              <SectionText>{conditional.result}</SectionText>
            </SectionHeader>

            <SelectSide>
              <SideButtons>
                <SideButton
                  active={conditionalBets.thenBet.side === "yes"}
                  variant="yes"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConditionalBets({
                      ...conditionalBets,
                      thenBet: { 
                        ...conditionalBets.thenBet, 
                        side: conditionalBets.thenBet.side === "yes" ? null : "yes" 
                      },
                    });
                  }}
                >
                  <span>Yes</span>
                  <span className="multiplier">1.6x</span>
                </SideButton>
                <SideButton
                  active={conditionalBets.thenBet.side === "no"}
                  variant="no"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConditionalBets({
                      ...conditionalBets,
                      thenBet: { 
                        ...conditionalBets.thenBet, 
                        side: conditionalBets.thenBet.side === "no" ? null : "no" 
                      },
                    });
                  }}
                >
                  <span>No</span>
                  <span className="multiplier">1.9x</span>
                </SideButton>
              </SideButtons>
            </SelectSide>

            <BetInputWrapper>
              <BetInputRow>
                <BetRow>
                  <span className="label">USDT</span>
                  <input
                    type="number"
                    value={conditionalBets.thenBet.amount}
                    onChange={(e) =>
                      setConditionalBets({
                        ...conditionalBets,
                        thenBet: {
                          ...conditionalBets.thenBet,
                          amount: Number(e.target.value),
                        },
                      })
                    }
                    min="0"
                  />
                  <span className="increment">+10</span>
                  <BetSpinnerButtons>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConditionalBets({
                          ...conditionalBets,
                          thenBet: {
                            ...conditionalBets.thenBet,
                            amount: conditionalBets.thenBet.amount + 10,
                          },
                        });
                      }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConditionalBets({
                          ...conditionalBets,
                          thenBet: {
                            ...conditionalBets.thenBet,
                            amount: Math.max(
                              0,
                              conditionalBets.thenBet.amount - 10
                            ),
                          },
                        });
                      }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </BetSpinnerButtons>
                </BetRow>
              </BetInputRow>
              <PotentialReturn>
                Potential return:{" "}
                <strong>
                  {conditionalBets.thenBet.side === "yes"
                    ? (conditionalBets.thenBet.amount * 1.6).toFixed(0)
                    : (conditionalBets.thenBet.amount * 1.9).toFixed(0)}{" "}
                  USDT
                </strong>
              </PotentialReturn>
            </BetInputWrapper>
          </Section>

          <Summary>
            <SummaryRow>
              <span className="label">Total stake:</span>
              <span className="value">
                {conditionalBets.if.amount + conditionalBets.thenBet.amount}{" "}
                USDT
              </span>
            </SummaryRow>
            <SummaryRow className="total">
              <span className="label">Potential return:</span>
              <span className="value">
                {(
                  (conditionalBets.if.side === "yes"
                    ? conditionalBets.if.amount * 1.3
                    : conditionalBets.if.amount * 2.7) +
                  (conditionalBets.thenBet.side === "yes"
                    ? conditionalBets.thenBet.amount * 1.6
                    : conditionalBets.thenBet.amount * 1.9)
                ).toFixed(0)}{" "}
                USDT
              </span>
            </SummaryRow>
            <SummaryRow>
              <span className="label">Platform fee (5%):</span>
              <span className="value">
                {(
                  (conditionalBets.if.amount + conditionalBets.thenBet.amount) *
                  0.05
                ).toFixed(2)}{" "}
                USDT
              </span>
            </SummaryRow>
          </Summary>
        </ModalBody>

        <PlaceButton
          disabled={!conditionalBets.if.side && !conditionalBets.thenBet.side}
          onClick={(e) => {
            e.stopPropagation();
            onPlaceBet();
          }}
        >
          Place{" "}
          {conditionalBets.if.side && conditionalBets.thenBet.side
            ? "2 Bets"
            : "1 Bet"}
        </PlaceButton>
      </ModalContent>
    </ModalOverlay>
  );
};
