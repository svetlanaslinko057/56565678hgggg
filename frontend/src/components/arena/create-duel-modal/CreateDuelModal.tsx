'use client';

import React, { useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  FormSection,
  SectionLabel,
  SideButtons,
  SideButton,
  StakeInputWrapper,
  StakeInput,
  SpinnerButtons,
  NoteText,
  ModalFooter,
  CancelButton,
  SubmitButton,
} from "./CreateDuelModal.styles";
import CustomDropdown from "@/UI/CustomDropdown";
import { DuelToast } from "@/UI/DuelToast/DuelToast";

interface CreateDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for prediction markets
const predictionMarkets = [
  { value: "sharkrace-tge", label: "SharkRace Club - TGE FDV > $200M" },
  { value: "bitcoin-100k", label: "Bitcoin reaches $100k by Q2 2026" },
  { value: "eth-merge", label: "Ethereum 2.0 Launch Success" },
];

// Mock data for opponents
const opponents = [
  { value: "", label: "Leave empty or open challenge" },
  { value: "user1", label: "@CryptoWhale" },
  { value: "user2", label: "@TokenMaster" },
  { value: "user3", label: "@DegenTrader" },
];

export const CreateDuelModal: React.FC<CreateDuelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedMarket, setSelectedMarket] = useState("");
  const [side, setSide] = useState<"yes" | "no" | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [opponent, setOpponent] = useState("");

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = () => {
    console.log({
      selectedMarket,
      side,
      stakeAmount,
      opponent,
    });
    
    // Show toast notification
    if (opponent) {
      const opponentName = opponents.find(o => o.value === opponent)?.label || "opponent";
      toast.success(
        <DuelToast
          title="Duel request sent!"
          description={`Waiting for ${opponentName} to accept...`}
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
            description={`Your duel vs ${opponentName} is now active.`}
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

  const handleSideClick = (selectedSide: "yes" | "no") => {
    setSide(side === selectedSide ? null : selectedSide);
  };

  const isValid = selectedMarket && side && stakeAmount > 0;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <h2>Create New Duel</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormSection>
            <SectionLabel>Select Market</SectionLabel>
            <CustomDropdown
              options={predictionMarkets}
              value={selectedMarket}
              onChange={(value) => setSelectedMarket(value as string)}
              placeholder="Choose a prediction market"
              searchable={true}
              
              isShowSuccess={false}
            />
          </FormSection>

          <FormSection>
            <SectionLabel>Choose Your Side</SectionLabel>
            <SideButtons>
              <SideButton
                active={side === "yes"}
                variant="yes"
                onClick={() => handleSideClick("yes")}
              >
                Yes
              </SideButton>
              <SideButton
                active={side === "no"}
                variant="no"
                onClick={() => handleSideClick("no")}
              >
                No
              </SideButton>
            </SideButtons>
          </FormSection>

          <FormSection>
            <SectionLabel>Stake Amount (USDT)</SectionLabel>
            <StakeInputWrapper>
              <StakeInput>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  placeholder="Enter amount (e.g., 100)"
                  min="0"
                />
                <span className="increment">+10</span>
                <SpinnerButtons>
                  <button
                    onClick={() => setStakeAmount((prev) => prev + 10)}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() =>
                      setStakeAmount((prev) => Math.max(0, prev - 10))
                    }
                  >
                    <ChevronDown size={12} />
                  </button>
                </SpinnerButtons>
              </StakeInput>
            </StakeInputWrapper>
          </FormSection>

          <FormSection>
            <SectionLabel>Specific Opponent (Optional)</SectionLabel>
            <CustomDropdown
              options={opponents}
              value={opponent}
              onChange={(value) => setOpponent(value as string)}
              placeholder="Leave empty or open challenge"
              searchable={true}
              
              isShowSuccess={false}
            />
          </FormSection>

          <NoteText>
            <strong>Note:</strong> Duels do not change market payouts. They only
            compare results between two users on the same prediction.
          </NoteText>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SubmitButton onClick={handleSubmit} disabled={!isValid}>
            Create Duel
          </SubmitButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
