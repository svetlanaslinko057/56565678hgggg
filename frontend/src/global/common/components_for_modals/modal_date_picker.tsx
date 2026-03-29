'use client';

import React from 'react';
import styled from 'styled-components';

const DatePickerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 14px;
    font-weight: 500;
    color: #0F172A;
  }
  
  input {
    padding: 12px 16px;
    border: 1px solid #eef1f5;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    
    &:focus {
      border-color: #05A584;
    }
  }
`;

interface ModalDatePickerProps {
  label?: string;
  value?: string;
  date?: Date | null;
  onChange: (value: string | Date) => void;
  placeholder?: string;
  type?: string;
  isSuccessIcon?: boolean;
}

const ModalDatePicker: React.FC<ModalDatePickerProps> = ({
  label,
  value,
  date,
  onChange,
  placeholder = 'Select date',
}) => {
  const dateValue = date ? date.toISOString().split('T')[0] : (value || '');
  
  return (
    <DatePickerWrapper>
      {label && <label>{label}</label>}
      <input
        type="date"
        value={dateValue}
        onChange={(e) => {
          if (date !== undefined) {
            onChange(new Date(e.target.value));
          } else {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
      />
    </DatePickerWrapper>
  );
};

export default ModalDatePicker;
