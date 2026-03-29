'use client';

import styled from 'styled-components';

export const BuyModalWrapper = styled.div`
  padding: 20px;
`;

export const BuyModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const BuyModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

export const BuyModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const BuyModalInput = styled.input`
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #05A584;
  }
`;

export const BuyModalButton = styled.button`
  padding: 14px;
  background: #05A584;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #048a6e;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export const SelectLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #0F172A;
  margin-bottom: 8px;
`;

export const SelectWrapper = styled.div`
  position: relative;
`;

export const SelectTrigger = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  background: white;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.2s;
  
  &:hover {
    border-color: #05A584;
  }
`;

export const SelectOptions = styled.div<{ $isOpen?: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
`;

export const SelectOption = styled.div<{ $selected?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  background: ${({ $selected }) => ($selected ? '#e8f9f1' : 'transparent')};
  color: ${({ $selected }) => ($selected ? '#05A584' : '#0F172A')};
  
  &:hover {
    background: ${({ $selected }) => ($selected ? '#e8f9f1' : '#f5f5f5')};
  }
`;

export const TextareaWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #05A584;
  }
`;
