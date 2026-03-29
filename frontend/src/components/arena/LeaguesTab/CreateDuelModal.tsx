'use client';

import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  Section,
  SectionTitle,
  MarketsContainer,
  MarketRow,
  MarketPrice,
  MarketOdds,
  SideButtonsWrapper,
  SideButton,
  BetInput,
  BetRow,
  BetSpinnerButtons,
  StakeNote,
  Note,
  ModalFooter,
  CancelButton,
  CreateButton,
} from "./CreateDuelModal.styles";
import { X } from "lucide-react";
import CustomDropdown from "@/UI/CustomDropdown";
import { DuelToast } from "@/UI/DuelToast/DuelToast";

interface CreateDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentName?: string;
}

type Side = "yes" | "no" | null;

export const CreateDuelModal: React.FC<CreateDuelModalProps> = ({
  isOpen,
  onClose,
  opponentName = "Dark Shark",
}) => {
  const [selectedMarket, setSelectedMarket] = useState(
    "Ethereum above __ at the end of 2025?"
  );
  const [selectedSides, setSelectedSides] = useState<{
    [key: number]: Side;
  }>({});
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState(opponentName);

  if (!isOpen) return null;

  const marketOptions = [
    { value: "ethereum-2025", label: "Ethereum above __ at the end of 2025?" },
    { value: "bitcoin-100k", label: "Bitcoin above $100k by EOY 2025?" },
    { value: "ethereum-10k", label: "Ethereum hits $10k by 2026?" },
  ];

  const opponentOptions = [
    { value: "dark-shark", label: "Dark Shark" },
    { value: "crypto-whale", label: "Crypto Whale" },
    { value: "bull-runner", label: "Bull Runner" },
  ];

  const markets = [
    { price: 2500, odds: "100%" },
    { price: 3000, odds: "100%" },
  ];

  const handleSideSelect = (marketIndex: number, side: Side) => {
    setSelectedSides((prev) => ({
      ...prev,
      [marketIndex]: prev[marketIndex] === side ? null : side,
    }));
  };

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setStakeAmount(value);
  };

  const handleStakeAdjust = (delta: number) => {
    const current = parseInt(stakeAmount || "0", 10);
    const newAmount = Math.max(0, current + delta);
    setStakeAmount(newAmount.toString());
  };

  const handleSubmit = () => {
    console.log({
      selectedMarket,
      selectedSides,
      stakeAmount,
      selectedOpponent,
    });
    
    // Show toast notification
    if (selectedOpponent) {
      const opponentLabel = opponentOptions.find(o => o.value === selectedOpponent)?.label || "opponent";
      toast.success(
        <DuelToast
          title="Duel request sent!"
          description={`Waiting for ${opponentLabel} to accept...`}
          buttonText="View Duel"
          onButtonClick={() => {
            console.log("Navigate to duel");
          }}
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
      
      // Show delayed confirmation toast
      setTimeout(() => {
        toast.success(
          <DuelToast
            title="Duel confirmed!"
            description={`Your duel vs ${opponentLabel} is now active.`}
            buttonText="Open Duel"
            onButtonClick={() => {
              console.log("Navigate to duel");
            }}
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
      }, 2000);
    } else {
      toast.success(
        <DuelToast
          title="Duel request sent!"
          description="Open duel created. Waiting for someone to join."
          buttonText="View Duel"
          onButtonClick={() => {
            console.log("Navigate to duel");
          }}
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
      
      // Show delayed confirmation toast
      setTimeout(() => {
        toast.success(
          <DuelToast
            title="Duel confirmed!"
            description="Someone joined your open duel!"
            buttonText="Open Duel"
            onButtonClick={() => {
              console.log("Navigate to duel");
            }}
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
      }, 2000);
    }
    
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Create Duel vs {opponentName}</h2>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Section>
            <SectionTitle>Select Market</SectionTitle>
            <CustomDropdown
              options={marketOptions}
              value={selectedMarket}
              onChange={(value) => setSelectedMarket(value as string)}
              placeholder="Select market..."
              isShowSuccess={false}
              searchable={false}
              className="market-select"
            />
          </Section>

          <Section>
            <SectionTitle>Choose Your Side</SectionTitle>
            <MarketsContainer>
              {markets.map((market, index) => (
                <MarketRow key={index}>
                  <MarketPrice>{market.price.toLocaleString()}</MarketPrice>
                  <MarketOdds>{market.odds}</MarketOdds>
                  <SideButtonsWrapper>
                    <SideButton
                      $selected={selectedSides[index] === "yes"}
                      $color="success"
                      onClick={() => handleSideSelect(index, "yes")}
                    >
                      Yes
                    </SideButton>
                    <SideButton
                      $selected={selectedSides[index] === "no"}
                      $color="danger"
                      onClick={() => handleSideSelect(index, "no")}
                    >
                      No
                    </SideButton>
                  </SideButtonsWrapper>
                </MarketRow>
              ))}
            </MarketsContainer>
          </Section>

          <Section>
            <SectionTitle>Stake Amount (USDT)</SectionTitle>
            <BetInput>
              <BetRow>
                <input
                  type="number"
                  placeholder="Enter amount (e.g., 100)"
                  value={stakeAmount}
                  onChange={handleStakeChange}
                  min="0"
                />
                <span className="increment">+10</span>
                <BetSpinnerButtons>
                  <button onClick={() => handleStakeAdjust(10)}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M4 1L7 5H1L4 1Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button onClick={() => handleStakeAdjust(-10)}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M4 7L1 3H7L4 7Z" fill="currentColor" />
                    </svg>
                  </button>
                </BetSpinnerButtons>
              </BetRow>
            </BetInput>
            <StakeNote>
              Both users commit the same stake. Winner keeps their own market
              PnL + earns a duel trophy for the season.
            </StakeNote>
          </Section>

          <Section>
            <SectionTitle>Specific Opponent (Optional)</SectionTitle>
            <CustomDropdown
              options={opponentOptions}
              value={selectedOpponent}
              onChange={(value) => setSelectedOpponent(value as string)}
              placeholder="Choose opponent..."
              isShowSuccess={false}
              searchable={false}
              className="opponent-select"
            />
          </Section>

          <Note>
            <strong>Note:</strong> Duels do not change market payouts. They only
            compare results between two users on the same prediction.
          </Note>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <CreateButton onClick={handleSubmit}>Create Duel</CreateButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
