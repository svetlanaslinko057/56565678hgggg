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
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

export const ModalHeader = styled.div`
  padding: 40px 40px 0px;
  position: relative;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 42px;
  right: 40px;
  width: 32px;
  height: 32px;
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
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionLabel = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

export const SideButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const SideButton = styled.button<{
  active: boolean;
  variant: "yes" | "no";
}>`
  padding: 8px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ variant, active }) =>
    variant === "yes"
      ? `
    background: ${active ? "#05A584" : "#F5FBFD"};
    color: ${active ? "#FFFFFF" : "#05A584"};

    &:hover {
      background: ${active ? "#038a6a" : "#d1f4e8"};
    }
  `
      : `
    background: ${active ? "#FF5858" : "#FEF1F2"};
    color: ${active ? "#FFFFFF" : "#FF5858"};

    &:hover {
      background: ${active ? "#e04646" : "#fee5e5"};
    }
  `}
`;

export const StakeInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StakeInput = styled.div`
  display: flex;
  gap: 0;
  align-items: center;
  background: #f8f9fb;
  border-radius: 12px;
  padding: 0;
  height: 48px;

  input {
    flex: 1;
    padding: 0 16px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 400;
    color: #0f172a;
    outline: none;

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
    padding: 0 8px;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    white-space: nowrap;
  }
`;

export const SpinnerButtons = styled.div`
  display: flex;
  flex-direction: column;
  height: 36px;
  width: 16px;
  background: #f0f2f5;
  margin-right: 8px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 18px;
    left: 4px;
    width: 8px;
    height: 1px;
    background: #b5bcc7;
  }

  button {
    flex: 1;
    height: 18px;
    width: 16px;
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

export const NoteText = styled.p`
  font-size: 14px;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
  line-height: 1.5;

  strong {
    font-weight: 600;
  }
`;

export const ModalFooter = styled.div`
  padding: 0px 40px 40px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

export const CancelButton = styled.button`
  padding: 12px 24px;
  border: none;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  background: #f9f9f9;

  &:hover {
    background: #f0f2f5;
  }
`;

export const SubmitButton = styled.button`
  padding: 12px 24px;
  border: none;
  background: #05a584;
  color: white;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #048c6e;
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;
