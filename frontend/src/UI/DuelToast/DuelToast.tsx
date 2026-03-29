'use client';

import React from 'react';
import styled from 'styled-components';

const ToastWrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 280px;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #0F172A;
  margin-bottom: 4px;
`;

const ToastDescription = styled.div`
  font-size: 13px;
  color: #738094;
  margin-bottom: 12px;
`;

const ToastButton = styled.button`
  padding: 8px 16px;
  background: #05A584;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #048a6e;
  }
`;

interface DuelToastProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const DuelToast: React.FC<DuelToastProps> = ({ title, description, buttonText, onButtonClick }) => {
  return (
    <ToastWrapper>
      <ToastTitle>{title}</ToastTitle>
      <ToastDescription>{description}</ToastDescription>
      {buttonText && onButtonClick && (
        <ToastButton onClick={onButtonClick}>{buttonText}</ToastButton>
      )}
    </ToastWrapper>
  );
};
