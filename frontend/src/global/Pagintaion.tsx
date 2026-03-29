'use client';

import React from 'react';
import styled from 'styled-components';

const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 20px 0;
`;

const PaginationLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#05A584' : 'transparent')};
  color: ${({ $active }) => ($active ? 'white' : '#05A584')};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  min-width: 32px;

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? '#05A584' : '#e8f9f1')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ArrowButton = styled.button`
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #05A584;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: #e8f9f1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Ellipsis = styled.span`
  color: #728094;
  padding: 0 4px;
`;

const ShowingText = styled.div`
  color: #728094;
  font-size: 14px;
`;

interface PaginationProps {
  page: number;
  totalPage: number;
  onChange: (page: number) => void;
  limit: number;
  total: number;
  style?: React.CSSProperties;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPage,
  onChange,
  limit,
  total,
  style,
}) => {
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPage <= maxVisible + 2) {
      for (let i = 1; i <= totalPage; i++) pages.push(i);
    } else {
      // Always show first few pages
      for (let i = 1; i <= Math.min(maxVisible, page + 1); i++) {
        pages.push(i);
      }
      
      if (page < totalPage - 2) pages.push('...');
      pages.push(totalPage);
    }
    
    return pages;
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <PaginationWrapper style={style}>
      <PaginationLeft>
        <ArrowButton disabled={page === 1} onClick={() => onChange(page - 1)}>
          &lt;
        </ArrowButton>
        {getVisiblePages().map((p, idx) => (
          typeof p === 'number' ? (
            <PageButton key={idx} $active={p === page} onClick={() => onChange(p)}>
              {p}
            </PageButton>
          ) : (
            <Ellipsis key={idx}>...</Ellipsis>
          )
        ))}
        <ArrowButton disabled={page === totalPage} onClick={() => onChange(page + 1)}>
          &gt;
        </ArrowButton>
      </PaginationLeft>
      <ShowingText>
        Showing {start} - {end} out of {total}
      </ShowingText>
    </PaginationWrapper>
  );
};

export default Pagination;
