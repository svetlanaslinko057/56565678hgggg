'use client';

import styled from 'styled-components';

export const SearchButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #eef1f5;
  border-radius: 6px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;

  &.active {
    border-color: #05A584;
  }

  .search-label {
    font-size: 14px;
    color: #0F172A;
  }

  .search-dropdown {
    display: none;
    &.active {
      display: block;
    }
    input {
      border: none;
      outline: none;
      font-size: 14px;
      width: 200px;
    }
  }
`;

export const FilterButton = styled.div<{ $newSort?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #eef1f5;
  border-radius: 6px;
  cursor: pointer;
  background: white;
  position: relative;
  transition: all 0.2s;
  
  &:hover {
    border-color: #05A584;
  }

  .sort-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #0F172A;
  }
`;

export const SortDropdown = styled.div<{ $isVisible?: boolean }>`
  display: ${({ $isVisible }) => ($isVisible ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border: 1px solid #eef1f5;
  border-radius: 6px;
  padding: 6px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  &.duels-dropdown {
    min-width: 260px;
  }
`;

export const SortOption = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    background: #f5f5f5;
  }

  ${({ $selected }) => $selected && `
    background: #e8f9f1;
    color: #05A584;
  `}

  .option-content {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
  }
`;

export const DropdownRow = styled.div`
  padding: 10px;
`;
