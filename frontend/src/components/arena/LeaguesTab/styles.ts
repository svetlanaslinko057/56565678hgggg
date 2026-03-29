'use client';

import styled from "styled-components";

export const LeaguesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-top: 40px;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

export const LeaguesTableWrapper = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const LeaguesTableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const LeaguesTableSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  flex: 1;

  input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    color: #0f172a;

    &::placeholder {
      color: #94a3b8;
    }
  }
`;

export const LeaguesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  table-layout: auto;
  min-width: 750px;
`;

export const LeaguesTableHead = styled.thead`
  border-bottom: 1px solid #f0f2f5;
  min-width: 800px;

  th {
    padding: 10px;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
    color: #738094;
  }
`;

export const LeaguesTableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #f0f2f5;
    transition: background-color 0.2s ease;
    display: table-row;
    vertical-align: middle;

    &:hover {
      background-color: #f9fbfc;
    }

    &:last-child {
      border-bottom: none;
    }

    td {
      padding: 0 10px;
      font-size: 14px;
      color: #0f172a;
      vertical-align: middle;
      height: 68px;
      display: table-cell;
    }
  }
`;

export const LeaguesRank = styled.td`
  color: #0f172a;
  text-align: center;
  vertical-align: middle;
  height: 68px;
  padding: 0 10px;
  font-weight: 500;
`;

export const LeaguesUserCell = styled.td`
  vertical-align: middle;
  height: 60px;
  padding: 0 10px;
  width: 250px;
  
  > div {
    display: flex;
    align-items: center;
  }
`;

export const LeaguesUserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

export const LeaguesUserName = styled.div`
  font-weight: 500;
  color: #0f172a;
`;

export const LeaguesMetric = styled.td<{ positive?: boolean }>`
  font-weight: 500;
  color: ${({ positive }) => (positive ? "#05a584" : "#0f172a")};
  display: table-cell;
  vertical-align: middle;
  height: 60px;
  padding: 0 10px;

  > div {
    height: 100%;
    display: flex;
    align-items: center;
  }
`;

export const LeaguesAccuracyBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  height: 100%;

  .bar {
    width: 50px;
    height: 4px;
    background: #e3e8ef;
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    align-items: center;

    .fill {
      height: 100%;
      background: linear-gradient(-90deg, #04a584 0%, #06d4a9 100%);
      border-radius: 3px;
    }
  }

  .percent {
    min-width: 40px;
    text-align: right;
    font-weight: 500;
    color: #0f172a;
  }
`;

export const LeaguesActionsCell = styled.td`
  vertical-align: middle;
  height: 60px;
  padding: 0 10px;
  width: 220px !important;
  min-width: 220px;
  max-width: 220px;
  text-align: right;
  white-space: nowrap;
  position: relative;
  z-index: 5;
`;

export const LeaguesActionButton = styled.button`
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;

  &:hover {
    background: #f6f8fa;
    border-color: #05a584;
    color: #05a584;
  }

  &.challenge {
    background: #05a584;
    border-color: #05a584;
    color: #ffffff;
    margin-left: 8px;

    &:hover {
      background: #038a6a;
      border-color: #038a6a;
    }
  }
`;

export const LeaguesSnapshotCardSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 40px;
  height: fit-content;
`;

export const LeaguesSnapshotCard = styled.div`
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .label {
    opacity: 1;
  }
`;
