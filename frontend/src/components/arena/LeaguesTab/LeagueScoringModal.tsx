'use client';

import React from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import Arrow from "@/global/Icons/Arrow";
import Accuracy from "@/global/Icons/Accuracy";
import League from "@/global/Icons/League";
import {
  CloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalBody,
  WeightSection,
  WeightIcon,
  WeightInfo,
  WeightTitle,
  WeightDescription,
  AdditionalFactors,
  AdvisoryNotice,
} from "./LeagueScoringModal.styles";
import Warning from "@/global/Icons/Warning";

interface LeagueScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeagueScoringModal: React.FC<LeagueScoringModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <h2>League Scoring System</h2>
            <p>Understanding how analyst rankings are calculated</p>
          </div>
          <CloseButton onClick={onClose}>
            <X size={24} color="#0f172a" />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <WeightSection>
            <WeightIcon>
              <Arrow />
            </WeightIcon>
            <WeightInfo>
              <WeightTitle>ROI Weight (40%)</WeightTitle>
              <WeightDescription>
                Return on investment across all resolved markets
              </WeightDescription>
            </WeightInfo>
          </WeightSection>

          <WeightSection>
            <WeightIcon>
              <Accuracy />
            </WeightIcon>
            <WeightInfo>
              <WeightTitle>Accuracy Weight (30%)</WeightTitle>
              <WeightDescription>
                Percentage of correct predictions
              </WeightDescription>
            </WeightInfo>
          </WeightSection>

          <WeightSection>
            <WeightIcon>
              <League />
            </WeightIcon>
            <WeightInfo>
              <WeightTitle>Consistency Weight (30%)</WeightTitle>
              <WeightDescription>
                Streak performance and regular participation
              </WeightDescription>
            </WeightInfo>
          </WeightSection>

          <AdditionalFactors>
            <h3>Additional Factors:</h3>
            <ul>
              <li>Market size impact: Larger markets weighted higher</li>
              <li>NFT Trophies: Awarded to top performers each season</li>
              <li>Minimum requirement: 20 resolved markets to qualify</li>
            </ul>
          </AdditionalFactors>

          <AdvisoryNotice>
            <div className="content">
              <h4>
                <Warning /> AI Advisory Only
              </h4>
              <p>
                AI-powered insights are for reference. Final decisions remain
                with users.
              </p>
            </div>
          </AdvisoryNotice>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};
