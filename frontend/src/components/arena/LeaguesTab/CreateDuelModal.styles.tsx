'use client';

import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

export const ModalHeader = styled.div`
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;

export const ModalBody = styled.div`
  padding: 0 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const MarketsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const MarketRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const MarketPrice = styled.span`
  color: #0f172a;
  min-width: 60px;
  font-size: 14px;
`;

export const MarketOdds = styled.span`
  min-width: 50px;
  font-size: 14px;
  margin-left: auto;
  font-weight: 500;
`;

export const SideButtonsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

export const SideButton = styled.button<{
  $selected: boolean;
  $color: "success" | "danger";
}>`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: ${({ $selected, $color }) => {
    if ($selected) {
      return $color === "success" ? "#F5FBFD" : "#ff5858";
    }
    return $color === "success" ? "#F5FBFD" : "#fef2f2";
  }};
  color: ${({ $selected, $color }) => {
    if ($selected) return "#ffffff";
    return $color === "success" ? "#05a584" : "#ff5858";
  }};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ $color }) =>
      $color === "success" ? "#05a584" : "#ff5858"};
    color: #ffffff;
  }
`;

export const BetInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const BetRow = styled.div`
  display: flex;
  gap: 0;
  align-items: center;
  background: #f8f9fb;
  border-radius: 10px;
  padding: 0;
  height: 40px;

  input {
    flex: 1;
    padding: 0 10px;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    text-align: left;

    &::placeholder {
      color: #94a3b8;
    }

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
  margin-right: 10px;
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

export const StakeInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #dbe2ea;
    border-radius: 8px;
    font-size: 14px;
    color: #0f172a;
    background: #f9fbfc;

    &::placeholder {
      color: #94a3b8;
    }

    &:focus {
      outline: none;
      border-color: #05a584;
      background: #ffffff;
    }
  }
`;

export const StakeButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fbfc;
  border-radius: 8px;
  border: 1px solid #dbe2ea;

  span {
    font-size: 10px;
    color: #738094;
    min-width: 30px;
  }
`;

export const StakeButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: #ffffff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #738094;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #05a584;
    color: #ffffff;
  }
`;

export const StakeNote = styled.p`
  font-size: 14px;
  color: #738094;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
`;

export const Note = styled.p`
  font-size: 14px;
  color: #738094;
  margin: 0;
  font-style: italic;
`;

export const ModalFooter = styled.div`
  padding: 0px 40px 40px;
  display: flex;
  gap: 10px;
`;

export const CancelButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fbfc;
    border-color: #05a584;
  }
`;

export const CreateButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: #05a584;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #038a6a;
  }

  &:active {
    transform: scale(0.98);
  }
`;
