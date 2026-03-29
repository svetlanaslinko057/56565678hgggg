'use client';

import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;

  .label {
    opacity: 1;
  }
`;

export const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 40px 40px 20px;
`;

export const ModalLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

export const ModalTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  span {
    font-size: 14px;
    font-weight: 400;
    color: #94a3b8;
  }
`;

export const ModalRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

export const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #738094;
  transition: color 0.2s;

  &:hover {
    color: #0f172a;
  }
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 40px 20px;
`;

export const RiskBadge = styled.div`
  font-size: 14px;
  color: #64748b;

  span {
    font-weight: 500;
  }
`;

export const Section = styled.div`
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #0f172a;

  .condition-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    background: #f5fbfd;
    border-radius: 6px;
    font-size: 14px;
    color: #3b82f6;
  }
`;

export const SectionText = styled.div`
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
`;

export const SelectSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  h4 {
    font-size: 16px;
    font-weight: 600;
  }
`;

export const SideButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

export const SideButton = styled.button<{
  active: boolean;
  variant: "yes" | "no";
}>`
  padding: 8px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${({ variant, active }) =>
    variant === "yes"
      ? `
    background: ${active ? "#038a6a" : "#D6EEEE"};
    color: ${active ? "#FFFFFF" : "#05A584"};

    &:hover {
      background: ${active ? "#038a6a" : "#d1f4e8"};
    }
  `
      : `
    background: ${active ? "#e04646" : "#FEF1F2"};
    color: ${active ? "#ffffff" : "#FF5858"};

    &:hover {
      color: ${active ? "#ffffff" : "#FF5858"};
      background: ${active ? "#e04646" : "#fee5e5"};
    }
  `}

  span.multiplier {
    font-size: 14px;
    font-weight: 500;
  }
`;

export const BetInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const BetInputRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  span.label {
    font-size: 14px;
    font-weight: 400;
    color: #0f172a;
    white-space: nowrap;
  }
`;

export const BetRow = styled.div`
  display: flex;
  gap: 0;
  align-items: center;
  background: #f8f9fb;
  border-radius: 12px;
  padding: 0;
  height: 40px;
  padding: 12px;
  width: 100%;

  span.label {
    font-size: 14px;
    font-weight: 400;
    color: #0f172a;
    white-space: nowrap;
  }

  input {
    flex: 1;
    padding: 0 6px;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    text-align: left;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &[type="number"] {
      -moz-appearance: textfield;
    }
  }

  span.increment {
    padding: 0 4px;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    white-space: nowrap;
  }
`;

export const BetSpinnerButtons = styled.div`
  display: flex;
  flex-direction: column;
  height: 28px;
  width: 14px;
  background: #f0f2f5;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 14px;
    left: 3px;
    width: 8px;
    height: 1px;
    background: #b5bcc7;
  }

  button {
    flex: 1;
    height: 14px;
    width: 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      color: #64748b;
    }

    &:active {
      color: #0f172a;
    }
  }
`;

export const PotentialReturn = styled.div`
  font-size: 14px;
  color: #94a3b8;

  strong {
    color: #0f172a;
    font-weight: 600;
  }
`;

export const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
`;

export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  &.total {
    font-size: 20px;
    font-weight: 600;

    .value {
      color: #05a584;
    }

    .label {
      font-size: 14px;
      font-weight: 400;
    }
  }

  .label {
    color: #94a3b8;
  }

  .value {
    color: #0f172a;
    font-weight: 600;
  }
`;

export const PlaceButton = styled.button`
  background: #05a584;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 40px 40px;

  &:hover {
    background: #038a6a;
  }

  &:disabled {
    background: #e5e7eb;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;
