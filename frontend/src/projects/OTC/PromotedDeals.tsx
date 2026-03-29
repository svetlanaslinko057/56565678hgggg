'use client';

import React from 'react';
import styled from 'styled-components';

const AdBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  background: #05A584;
  border-radius: 6px;
  cursor: default;
`;

interface PromotedDealsProps {
  isSearch: boolean;
  setIsSearch: (value: boolean) => void;
}

const PromotedDeals: React.FC<PromotedDealsProps> = () => {
  return (
    <AdBadge>Ad</AdBadge>
  );
};

export default PromotedDeals;
