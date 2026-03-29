'use client';

import styled from "styled-components";

export const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: #ffffff;
  border-radius: 12px;

  &:hover {
    border-color: #05a584;
  }

  .label {
    opacity: 1;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const SideBadge = styled.div<{ $side: "yes" | "no" }>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: ${({ $side }) => ($side === "yes" ? "#e8f9f1" : "#fef2f2")};
  color: ${({ $side }) => ($side === "yes" ? "#05a584" : "#ff5858")};
`;

export const HighStakesBadge = styled.div`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  color: #0f172a;
  border: 1px solid #f0f2f5;
`;

export const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 20px 0;
  line-height: 1.4;
`;

export const HostSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

export const HostInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const HostName = styled.div`
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
`;

export const HostLabel = styled.div`
  font-size: 12px;
  color: #738094;
`;

export const Stakes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #f9fbfc;
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const StakeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: 14px;
    color: #738094;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;

    &.gray {
      color: #728094;
    }
  }
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
`;

export const Timer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #738094;

  svg {
    color: #738094;
  }
`;

export const StatusBadge = styled.div<{
  $variant?: "warning" | "success" | "danger";
}>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  background: #e5e7eb;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
  width: 100%;
  justify-content: space-between;
`;

export const ActionButton = styled.button<{
  $variant?: "success" | "danger";
  $disabled?: boolean;
}>`
  padding: 10px 20px;
  border-radius: 8px;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: ${({ $variant, $disabled }) => {
    if ($disabled) return "#f0f2f5";
    if ($variant === "success") return "#e8f9f1";
    if ($variant === "danger") return "#fef2f2";
    return "#f9fbfc";
  }};
  color: ${({ $variant, $disabled }) => {
    if ($disabled) return "#b5bcc7";
    if ($variant === "success") return "#05a584";
    if ($variant === "danger") return "#ff5858";
    return "#0f172a";
  }};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};

  &:hover {
    background: ${({ $variant, $disabled }) => {
      if ($disabled) return "#f0f2f5";
      if ($variant === "success") return "#05a584";
      if ($variant === "danger") return "#ff5858";
      return "#f0f2f5";
    }};
    color: ${({ $disabled }) => ($disabled ? "#b5bcc7" : "#ffffff")};
  }

  &:active {
    transform: ${({ $disabled }) => ($disabled ? "none" : "scale(0.98)")};
  }
`;
