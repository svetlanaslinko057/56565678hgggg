'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';

const BreadCrumbsWrapper = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  padding: 16px 0;
  
  a {
    color: #738094;
    text-decoration: none;
    transition: color 0.2s;
    font-weight: 500;
    
    &:hover {
      color: #05A584;
    }
  }
  
  .separator {
    color: #d1d5db;
    display: flex;
    align-items: center;
  }
  
  .current {
    color: #0F172A;
    font-weight: 500;
  }
`;

interface BreadCrumbItem {
  title: string;
  link: string;
}

interface BreadCrumbsProps {
  items: BreadCrumbItem[];
}

const BreadCrumbs: React.FC<BreadCrumbsProps> = ({ items }) => {
  return (
    <BreadCrumbsWrapper data-testid="breadcrumbs">
      {items.map((item, index) => (
        <React.Fragment key={item.link || index}>
          {index > 0 && <span className="separator"><ChevronRight size={16} /></span>}
          {item.link ? (
            <Link href={item.link}>{item.title}</Link>
          ) : (
            <span className="current">{item.title}</span>
          )}
        </React.Fragment>
      ))}
    </BreadCrumbsWrapper>
  );
};

export default BreadCrumbs;
