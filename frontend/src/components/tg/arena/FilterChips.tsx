'use client';

import React from 'react';
import styled from 'styled-components';
import { Flame, Zap, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

const ChipsContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  margin-bottom: 16px;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button<{ $active: boolean; $accentColor: string; $bgColor: string; $textColor: string }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  white-space: nowrap;
  
  ${({ $active, $accentColor, $bgColor, $textColor }) => $active ? `
    background: ${$accentColor};
    color: #000;
    border-color: ${$accentColor};
    box-shadow: 0 4px 12px ${$accentColor}40;
  ` : `
    background: ${$bgColor};
    color: ${$textColor};
    border-color: ${$bgColor};
    
    &:active {
      transform: scale(0.96);
      background: ${$accentColor}20;
    }
  `}
`;

export type FilterType = 'trending' | 'live' | 'closing' | 'volume';

interface FilterChipsProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}

const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: 'trending', label: 'Trending', icon: <Flame size={14} /> },
  { id: 'live', label: 'Live', icon: <Zap size={14} /> },
  { id: 'closing', label: 'Closing', icon: <Clock size={14} /> },
  { id: 'volume', label: 'Volume', icon: <TrendingUp size={14} /> },
];

export function FilterChips({ active, onChange }: FilterChipsProps) {
  const { theme } = useTheme();

  return (
    <ChipsContainer>
      {filters.map((filter) => (
        <Chip
          key={filter.id}
          $active={active === filter.id}
          $accentColor={theme.accent}
          $bgColor={theme.bgCard}
          $textColor={theme.textSecondary}
          onClick={() => onChange(filter.id)}
          data-testid={`filter-${filter.id}`}
        >
          {filter.icon}
          {filter.label}
        </Chip>
      ))}
    </ChipsContainer>
  );
}

export default FilterChips;
