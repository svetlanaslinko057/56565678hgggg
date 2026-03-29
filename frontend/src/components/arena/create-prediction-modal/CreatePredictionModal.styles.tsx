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
`;

export const FormSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  & > .date-picker {
    max-width: 200px;

    & > div > div {
      width: 100%;

      > div > button {
          width: 100%;
        }
      }
    }
  }
`;

export const SectionLabel = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 10px;
`;

export const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
`;

export const RadioOption = styled.label<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #0f172a;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => $active ? '#05a584' : '#e2e8f0'};
  background: ${({ $active }) => $active ? 'rgba(5, 165, 132, 0.05)' : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    border-color: #05a584;
  }

  input[type="radio"] {
    width: 16px;
    height: 16px;
    accent-color: #05a584;
    cursor: pointer;
  }

  .option-label {
    font-weight: 500;
  }

  .option-description {
    margin-left: 8px;
  }
`;

export const TextInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  transition: border-color 0.2s;

  &::placeholder {
    color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #05a584;
  }
`;

export const HintText = styled.p`
  font-size: 14px;
  color: #738094;
  margin-top: 10px;
  line-height: 1.5;
`;

export const InfoBox = styled.div`
  padding: 16px;
  background: #f5fbfd;
  border-radius: 12px;
  font-size: 14px;
  color: #0f172a;
  line-height: 1.5;
`;

export const FooterNote = styled.p`
  font-size: 14px;
  color: #738094;
  font-style: italic;
  margin-top: 20px;
  font-weight: 400;
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
  color: #ff5858;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  background: #f9f9f9;

  &:hover {
    background: rgba(255, 88, 88, 0.1);
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

/* Wallet & Stake Notices */
export const WalletNotice = styled.div<{ $connected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: ${({ $connected }) => $connected ? '#f0fdf4' : '#f8fafc'};
  border: 1px solid ${({ $connected }) => $connected ? '#bbf7d0' : '#e2e8f0'};
  
  svg {
    flex-shrink: 0;
    color: ${({ $connected }) => $connected ? '#22c55e' : '#64748b'};
  }
  
  span {
    flex: 1;
    font-size: 13px;
    color: ${({ $connected }) => $connected ? '#166534' : '#64748b'};
  }
`;

export const ConnectWalletBtn = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: #0f172a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  
  &:hover {
    background: #1e293b;
  }
`;

export const StakeNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  
  svg {
    flex-shrink: 0;
    color: #64748b;
  }
`;

export const StakeInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  strong {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }
  
  span {
    font-size: 12px;
    color: #64748b;
  }
`;

export const StakeAmount = styled.div`
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
`;

export const ErrorMessage = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 13px;
  margin-top: 16px;
`;
