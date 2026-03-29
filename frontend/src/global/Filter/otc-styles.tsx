'use client';

import styled from 'styled-components';

export const OtcFilterWrapper = styled.div`
  position: relative;
`;

export const OtcDropdown = styled.div<{ $active?: boolean }>`
  display: ${({ $active }) => ($active ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border: 1px solid #eef1f5;
  border-radius: 16px;
  min-width: 320px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

export const OtcDropdownWrapper = styled.div<{ $variant?: string }>`
  padding: 20px;
`;

export const Buttons = styled.div`
  display: flex;
  gap: 12px;

  .red-btn {
    background: #fff;
    color: #FF5858;
    border: 1px solid #FF5858;
    
    &:hover {
      background: #fef1f2;
    }
  }
`;

export const ResetWrapper = styled.div<{ $variant?: string }>`
  margin-top: 16px;

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #738094;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    transition: color 0.2s;

    &:hover {
      color: #0F172A;
    }

    &.small {
      font-size: 12px;
    }
  }
`;

export const OtcBottom = styled.div<{ $variant?: string }>`
  padding: 20px;
  border-top: 1px solid #eef1f5;
`;
