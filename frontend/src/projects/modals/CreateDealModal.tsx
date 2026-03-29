'use client';

import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div<{ $isVisible: boolean }>`
  display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #738094;
  
  &:hover {
    color: #0F172A;
  }
`;

interface CreateDealModalProps {
  isVisible: boolean;
  onClose: () => void;
  disableBuyButton?: boolean;
}

const CreateDealModal: React.FC<CreateDealModalProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <ModalOverlay $isVisible={isVisible} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Create Deal</h2>
          <CloseButton onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </CloseButton>
        </ModalHeader>
        <p style={{ color: '#738094', marginBottom: '20px' }}>Deal creation form would go here.</p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: '#05A584',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Create Deal
        </button>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateDealModal;
