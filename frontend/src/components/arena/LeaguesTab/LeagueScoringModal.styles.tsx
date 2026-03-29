'use client';

import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

export const ModalHeader = styled.div`
  padding: 40px 40px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #728094;
    margin: 0;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f6f8fa;
  }
`;

export const ModalBody = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const WeightSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

export const WeightIcon = styled.div`
  svg {
    width: 24px;
    height: 24px;
  }
`;

export const WeightInfo = styled.div`
  flex: 1;
`;

export const WeightTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 8px 0;
`;

export const WeightDescription = styled.p`
  font-size: 14px;
  color: #728094;
  margin: 0;
`;

export const AdditionalFactors = styled.div`
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;

  h3 {
    font-size: 16px;
    font-weight: 400;
    color: #0f172a;
    margin: 0 0 12px 0;
  }

  ul {
    margin: 0;
    padding-left: 9px;
    list-style: disc;

    li {
      font-size: 14px;
      color: #738094;
      margin-bottom: 12px;

      &::before {
        content: "";
        display: inline-block;
        width: 2px;
        height: 2px;
        background: #728094;
        border-radius: 50%;
        margin-right: 8px;
        vertical-align: middle;
      }
    }
  }
`;

export const AdvisoryNotice = styled.div`
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #f0f2f5;
  background: #f9f9f9;
  border-radius: 12px;

  .icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .content {
    flex: 1;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 8px 0;
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    p {
      font-size: 13px;
      color: #728094;
      margin: 0;
      line-height: 1.5;
    }
  }
`;
