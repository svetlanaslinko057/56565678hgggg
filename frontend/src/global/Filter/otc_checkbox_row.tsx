'use client';

import React from 'react';
import styled from 'styled-components';

const CheckboxRowWrapper = styled.div`
  margin-bottom: 20px;
  
  h4 {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #0F172A;
  }
  
  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 14px;
    color: #0F172A;
    
    input {
      accent-color: #05A584;
      width: 18px;
      height: 18px;
    }
  }
`;

interface OtcCheckboxRowProps {
  data: string[];
  title: string;
  items: string[];
  onChange: (value: string[]) => void;
  className?: string;
  showInfoIcon?: boolean;
}

const OtcCheckboxRow: React.FC<OtcCheckboxRowProps> = ({
  data = [],
  title,
  items,
  onChange,
  className,
}) => {
  const safeData = data || [];
  
  const handleToggle = (item: string) => {
    if (safeData.includes(item)) {
      onChange(safeData.filter((i) => i !== item));
    } else {
      onChange([...safeData, item]);
    }
  };

  return (
    <CheckboxRowWrapper className={className}>
      <h4>{title}</h4>
      <div className="checkboxes">
        {items.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={safeData.includes(item)}
              onChange={() => handleToggle(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </CheckboxRowWrapper>
  );
};

export default OtcCheckboxRow;
