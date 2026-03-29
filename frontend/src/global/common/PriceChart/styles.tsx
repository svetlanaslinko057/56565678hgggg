'use client';

import styled from 'styled-components';

export const TimeButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${({ active }) => (active ? '#05A584' : 'transparent')};
  color: ${({ active }) => (active ? 'white' : '#738094')};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ active }) => (active ? '#05A584' : '#f0f0f0')};
  }
`;
