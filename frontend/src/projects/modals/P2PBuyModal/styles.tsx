'use client';

import styled from 'styled-components';

export const P2PBuyModalWrapper = styled.div`
  padding: 20px;
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #738094;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #738094;
  }
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #05A584;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #048a6e;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;
