'use client';

import React from 'react';
import styled from 'styled-components';

const RangeRowWrapper = styled.div`
  margin-bottom: 20px;
  
  h4 {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #0F172A;
  }
  
  .inputs {
    display: flex;
    align-items: center;
    gap: 12px;
    
    input {
      width: 100px;
      padding: 10px 12px;
      border: 1px solid #eef1f5;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      
      &:focus {
        border-color: #05A584;
      }
    }
    
    .separator {
      color: #738094;
    }
  }
`;

interface OtcRangeRowProps {
  data: [number, number];
  title: string;
  step: number;
  range: [number, number];
  onChange: (values: [number, number]) => void;
  showInfoIcon?: boolean;
}

const OtcRangeRow: React.FC<OtcRangeRowProps> = ({
  data,
  title,
  step,
  range,
  onChange,
}) => {
  return (
    <RangeRowWrapper>
      <h4>{title}</h4>
      <div className="inputs">
        <input
          type="number"
          value={data[0]}
          min={range[0]}
          max={range[1]}
          step={step}
          onChange={(e) => onChange([Number(e.target.value), data[1]])}
        />
        <span className="separator">–</span>
        <input
          type="number"
          value={data[1]}
          min={range[0]}
          max={range[1]}
          step={step}
          onChange={(e) => onChange([data[0], Number(e.target.value)])}
        />
      </div>
    </RangeRowWrapper>
  );
};

export default OtcRangeRow;
