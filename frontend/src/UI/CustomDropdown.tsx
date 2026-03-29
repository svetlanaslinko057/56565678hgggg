'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const DropdownWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #0F172A;
  transition: all 0.2s;

  &:hover {
    border-color: #05A584;
  }
  
  .label {
    color: #738094;
  }
`;

const DropdownMenu = styled.div<{ $isOpen?: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 180px;
  background: white;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
`;

const DropdownItem = styled.div<{ $selected?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  background: ${({ $selected }) => ($selected ? '#e8f9f1' : 'transparent')};
  color: ${({ $selected }) => ($selected ? '#05A584' : '#0F172A')};
  transition: all 0.15s;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#e8f9f1' : '#f5f5f5')};
  }
`;

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  isShowSuccess?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownWrapper className={className} ref={wrapperRef}>
      <DropdownTrigger onClick={() => setIsOpen(!isOpen)}>
        {children}
        {selectedOption?.label || placeholder}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
          <path d="M3 5L6 8L9 5" stroke="#738094" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </DropdownTrigger>
      <DropdownMenu $isOpen={isOpen}>
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            $selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </DropdownWrapper>
  );
};

export default CustomDropdown;
