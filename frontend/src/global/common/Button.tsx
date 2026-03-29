'use client';

import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button<{ $variant?: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  
  svg {
    flex-shrink: 0;
  }
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: #05A584;
          color: white;
          &:hover { background: #048a6e; }
        `;
      case 'outlined':
        return `
          background: transparent;
          color: #0F172A;
          border: 1px solid #EEF1F5;
          &:hover { 
            border-color: #05A584;
            color: #05A584;
          }
        `;
      default:
        return `
          background: #f5f5f5;
          color: #333;
          &:hover { background: #e5e5e5; }
        `;
    }
  }}
`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined' | 'default';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, children, ...props }) => {
  return <StyledButton $variant={variant} {...props}>{children}</StyledButton>;
};

export default Button;
