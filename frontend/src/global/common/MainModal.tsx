'use client';

import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div<{ $isVisible?: boolean }>`
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
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eef1f5;

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
`;

interface MainModalProps {
  isVisible: boolean;
  className?: string;
  title: string;
  variant?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const MainModal: React.FC<MainModalProps> = ({
  isVisible,
  className,
  title,
  onClose,
  children,
}) => {
  return (
    <ModalOverlay $isVisible={isVisible} onClick={onClose}>
      <ModalContent className={className} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>{title}</h2>
          <button onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="#738094" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </ModalHeader>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

export default MainModal;
