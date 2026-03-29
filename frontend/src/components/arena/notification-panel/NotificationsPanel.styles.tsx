'use client';

import styled from "styled-components";

export const NotificationsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  pointer-events: none;
`;

export const NotificationsPanel = styled.div`
  position: absolute;
  top: 36px;
  right: 0;
  width: 480px;
  max-height: calc(100vh - 100px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.25);
  z-index: 100000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;

  @media (max-width: 640px) {
    width: calc(100vw - 40px);
    right: 20px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

export const NotificationsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
  background: #f0f2f5;
`;

export const NotificationsTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const MarkAllReadButton = styled.button`
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  padding: 6px 12px;
  border: 1px solid #f0f2f5;
  cursor: pointer;
  transition: opacity 0.2s;
  border-radius: 8px;

  &:hover {
    opacity: 0.8;
  }
`;

export const NotificationsList = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #dbe2ea;
    border-radius: 3px;
  }
`;

export const NotificationItem = styled.div<{ $isUnread?: boolean }>`
  position: relative;
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  gap: 12px;
  background: ${({ $isUnread }) => ($isUnread ? "#F5FBFD" : "#ffffff")};
  transition: background 0.3s;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

export const UnreadDot = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  width: 8px;
  height: 8px;
  background: #05a584;
  border-radius: 50%;
`;

export const NotificationIcon = styled.div<{
  $variant: "info" | "success" | "danger";
}>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $variant }) => {
    switch ($variant) {
      case "info":
        return "#E9F8F8";
      case "success":
        return "#E9F8F8";
      case "danger":
        return "#FEF1F2";
      default:
        return "#F0F2F5";
    }
  }};

  svg {
    color: ${({ $variant }) => {
    switch ($variant) {
      case "info":
        return "#05A584";
      case "success":
        return "#05A584";
      case "danger":
        return "#f43f5e";
      default:
        return "#738094";
    }
  }};

    path {
      stroke: ${({ $variant }) => {
    switch ($variant) {
      case "info":
        return "#05A584";
      case "success":
        return "#05A584";
      case "danger":
        return "#f43f5e";
      default:
        return "#738094";
    }
  }}
`;

export const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const NotificationTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
`;

export const NotificationDescription = styled.div`
  font-size: 14px;
  color: #738094;
  line-height: 1.5;

  strong {
    font-weight: 500;
    text-decoration: underline;
  }
`;

export const NotificationStats = styled.div`
  display: flex;
  gap: 16px;
`;

export const StatItem = styled.div<{ $variant: "success" | "danger" }>`
  font-size: 14px;

  color: ${({ $variant }) => ($variant === "success" ? "#05a584" : "#ff5858")};
  text-align: center;
  width: 100%;

  strong {
    font-weight: 500;
  }
`;

export const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const NotificationStatus = styled.div<{ $variant: string }>`
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  background: ${({ $variant }) => {
    switch ($variant) {
      case "won":
        return "#E9F8F8";
      case "lost":
        return "#FEF1F2";
      case "active":
      case "cancelled":
      case "declined":
        return "#fff";
      case "pending":
        return "#F9F9F9";
      default:
        return "#E9F8F8";
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case "won":
        return "#05A584";
      case "lost":
        return "#f43f5e";
      case "active":
        return "#05A584";
      case "pending":
        return "#0f172a";
      case "declined":
        return "#0ea5e9";
      case "cancelled":
        return "#f43f5e";
      default:
        return "#738094";
    }
  }};
  border: ${({ $variant }) => {
    switch ($variant) {
      case "won":
        return "1px solid #E9F8F8";
      case "lost":
        return "1px solid #FEF1F2";
      case "active":
        return "1px solid #E9F8F8";
      case "pending":
        return "1px solid #F0F2F5";
      case "declined":
        return "1px solid #F7FEFF";
      case "cancelled":
        return "1px solid #FEF1F2";
      default:
        return "1px solid #F0F2F5";
    }
  }};
  border-radius: 8px;
`;

export const NotificationTime = styled.div`
  font-size: 14px;
  color: #738094;
`;

export const DeclineButton = styled.button`
  font-size: 14px;
  color: #738094;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 10px;
  margin-left: auto;
  transition: color 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border-radius: 8px;

  &:hover {
    color: #0f172a;
  }
`;

export const NotificationActions = styled.div`
  display: flex;
  gap: 12px;
`;

export const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px;
  border-radius: 8px;
  background: #05a584;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  height: 30px;

  &.decline {
    border: 1px solid #FF5857;
    background: #FEF1F2;
    color: #ff5857;
    max-width: 94px;

    svg {
      color: #ff5857;
    }

    &:hover {
      background: #ff5857;
      color: #ffffff;

      svg {
        color: #ffffff;
      }
    }
  }

  &:hover {
    background: #048f70;
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    color: #ffffff;
  }
`;

export const ViewDetailsButton = styled.button`
  flex: 1;
  padding: 6px;
  border-radius: 8px;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.2s;
  height: 30px;

  &:hover {
    background: #f0f2f5;
  }
`;

export const CloseNotificationButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 12px;
  top: 12px;

  &:hover {
    background: #f0f2f5;
  }
`;

export const ClearAllButton = styled.button`
  width: 100%;
  padding: 20px;
  border: none;
  background: #f0f2f5;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-top: 1px solid #f0f2f5;
  transition: background 0.2s;

  &:hover {
    background: #e0e3e7;
  }
`;
