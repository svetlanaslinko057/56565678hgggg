'use client';

import styled from "styled-components";

export const CardWrapper = styled.div<{ $isOpen?: boolean }>`
  padding: 20px;
  transition: all 0.2s ease;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: space-between;
  position: relative;
  z-index: ${(props) => (props.$isOpen ? 100 : 1)};
  overflow: visible;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: #ffffff;
  border-radius: 12px;

  .row {
    display: flex;
    flex-direction: row;
    gap: 6px;
  }

  &:hover .sell-position {
    display: flex;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

export const LeftSection = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
`;

export const Logo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
`;

export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
`;

export const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
`;

export const StatusBadge = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ $status }) => ($status === "Live" ? 500 : 400)};
  background: ${({ $status }) =>
    $status === "Active"
      ? "#E9F8F8"
      : $status === "Pending"
        ? "#FFF7E6"
        : "#fff"};
  color: ${({ $status }) =>
    $status === "Live"
      ? "#FF5858"
      : $status === "Active"
        ? "#05A584"
        : $status === "Pending"
          ? "#FFB800"
          : "#738094"};
`;

export const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff5858;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export const StarButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover svg {
    fill: #fbbf24;
    stroke: #fbbf24;
  }
`;

export const RiskBadge = styled.div`
  font-size: 14px;
  color: #64748b;

  span {
    font-weight: 500;
  }
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;

  &.with-yes-no {
    flex-direction: column;
    gap: 8px;

    .info-row {
      grid-template-columns: repeat(3, 1fr);
    }
    .info-item {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;

  gap: 11px;
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: space-between;
  align-items: center;

  &.column {
    flex-direction: column;
  }
`;

export const InfoLabel = styled.span`
  font-size: 14px;
  color: #94a3b8;
`;

export const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const PercentageRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

export const PercentageBox = styled.div<{
  positive?: boolean;
  negative?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 7px;
  border-radius: 12px;
  width: 130px;
  background: ${({ positive, negative }) =>
    positive ? "#E8F9F1" : negative ? "#FEF2F2" : "#F3F4F6"};

  span {
    color: ${({ positive, negative }) =>
      positive ? "#05A584" : negative ? "#FF5858" : "#64748B"};
  }
`;

export const PercentageIcon = styled.span`
  width: 20px;
  height: 20px;
`;

export const PercentageValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

export const YesNoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const YesNoRow = styled.div`
  display: grid;
  grid-template-columns: 80px 80px 1fr;
  gap: 12px;
  align-items: center;
`;

export const ThresholdValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

export const YesNoButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;

export const YesButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  background: #f5fbfd;
  color: #05a584;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #d1f4e8;
  }
`;

export const NoButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  background: #fef2f2;
  color: #ff5858;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fee5e5;
  }
`;

export const ConditionalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ConditionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  position: relative;

  .condition-content {
    display: flex;
    gap: 4px;
    align-items: center;
    flex: 1;
  }

  .condition-buttons {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;

    button {
      padding: 6px 16px;
      font-size: 14px;
      border-radius: 8px;
    }
  }

  &:hover .condition-buttons {
    opacity: 1;
  }
`;

export const ConditionLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  background: #f5fbfd;
  border-radius: 6px;
  font-size: 14px;
  color: #3b82f6;
  white-space: nowrap;
`;

export const ConditionText = styled.span`
  font-size: 14px;
  color: #64748b;
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
`;

export const Author = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
`;

export const AuthorAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

export const AISentiment = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  background: #f5fbfd;
  border-radius: 20px;
  font-size: 10px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;

  &:hover {
    background: #eff6ff;
    border-color: #3b82f6;
  }
`;
export const ChanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;

  .row {
    justify-content: space-between;
  }
`;

export const ChanceLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #64748b;
`;

export const ChanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #f5fbfd;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

export const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  background: var(--main-green, #05a584);
  width: ${(props) => props.percentage}%;
  border-radius: 12px;
  transition: width 0.3s ease;
`;

export const SentimentModal = styled.div`
  position: absolute;
  top: calc(100% - 20px);
  right: 0;
  z-index: 50;
  width: 100%;
  pointer-events: auto;
`;

export const SentimentModalContent = styled.div`
  background: #ffffff;
  border-radius: 0 0 12px 12px;
  padding: 24px;
  padding-top: 40px;
  box-shadow: 0 30px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 20px;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-radius: 0 0 12px 12px;
    z-index: 1;
  }
`;

export const SentimentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  span {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const SentimentCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: #64748b;
  }
`;

export const SentimentBox = styled.div`
  border: 1px solid #ffc704;
  border-radius: 8px;
  padding: 10px;
  background: #fefcf3;

  p {
    font-size: 14px;
    color: #728094;
    margin: 0;
    line-height: 1.3;

    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
`;

export const SentimentButton = styled.button`
  background: var(--main-green, #05a584);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #038a6a;
    transform: translateY(-2px);
  }
`;

export const SentimentTopBox = styled.div<{
  sentiment: "Bullish" | "Bearish" | "Neutral";
}>`
  background: ${(props) =>
    props.sentiment === "Bullish"
      ? "#F5FBFD"
      : props.sentiment === "Bearish"
        ? "#fff5f5"
        : "#f5f5f5"};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

export const SentimentBadge = styled.div<{
  sentiment: "Bullish" | "Bearish" | "Neutral";
}>`
  background: ${(props) =>
    props.sentiment === "Bullish"
      ? "#E9F8F8"
      : props.sentiment === "Bearish"
        ? "#ffebee"
        : "#f5f5f5"};
  color: ${(props) =>
    props.sentiment === "Bullish"
      ? "#05a584"
      : props.sentiment === "Bearish"
        ? "#ff5858"
        : "#64748b"};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SentimentDescription = styled.div`
  font-size: 14px;
`;

export const SentimentMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f5fbfd;
  border-radius: 8px;
`;

export const SentimentMetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #1a1a1a;
`;

export const SentimentFullDescription = styled.p`
  font-size: 14px;
  color: #728094;
  line-height: 1.2;
  margin: 0;
  text-align: justify;
`;

export const BetModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const BetModalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 36px;
`;

export const BetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

export const BetTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;

  img {
    width: 20px;
    height: 20px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }
`;

export const BetCloseButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #738094;
  transition: color 0.2s;

  &:hover {
    color: #0f172a;
  }
`;

export const BetContent = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;

export const BetOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.color ? props.color : "#05a584")};

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const BetInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const BetRow = styled.div`
  display: flex;
  gap: 0;
  align-items: center;
  background: #f8f9fb;
  border-radius: 12px;
  padding: 0;
  height: 40px;

  span.label {
    padding: 0 20px;
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
  }

  input {
    flex: 1;
    padding: 0 12px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    outline: none;
    text-align: left;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &[type="number"] {
      -moz-appearance: textfield;
    }
  }

  span.increment {
    padding: 0 4px;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    white-space: nowrap;
  }
`;

export const BetSpinnerButtons = styled.div`
  display: flex;
  flex-direction: column;
  height: 28px;
  width: 14px;
  background: #f0f2f5;
  margin-right: 12px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 14px;
    left: 3px;
    width: 8px;
    height: 1px;
    background: #b5bcc7;
  }

  button {
    flex: 1;
    height: 14px;
    width: 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      color: #64748b;
    }

    &:active {
      color: #0f172a;
    }
  }
`;

export const BetInfo = styled.p`
  display: flex;
  flex-direction: row;
  gap: 4px;
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  display: flex;
  align-items: center;

  strong {
    color: #000;
    font-weight: 600;
  }
`;

export const BetButton = styled.button`
  background: #05a584;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #038a6a;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const UserPosition = styled.div`
  background: #f8f9fb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;

  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 58px;
    background: #f5fbfd;
    border-radius: 0 0 12px 12px;
    z-index: -1;
  }

  .label {
    color: #738094;
    font-weight: 400;
    opacity: 1;
  }

  .value {
    color: #1e293b;
    font-weight: 600;

    .option {
      font-weight: 700;
    }
  }
`;

export const SellPosition = styled.div`
  display: none;
  position: absolute;
  top: 0px;
  left: 0;
  width: 100%;
  height: calc(100% - 58px);
  align-items: flex-end;
  padding-bottom: 40px;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  border-radius: 12px 12px 0 0;
`;


/* ========== FOMO ENGINE STYLES ========== */

export const FomoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
`;

export const FomoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const FomoActivityBadge = styled.div<{ $level: 'low' | 'medium' | 'high' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $level }) =>
    $level === 'high' ? 'linear-gradient(135deg, #FF5858 0%, #FF8C42 100%)' :
    $level === 'medium' ? 'linear-gradient(135deg, #FFB800 0%, #FFD700 100%)' :
    '#f1f5f9'};
  color: ${({ $level }) => $level === 'low' ? '#64748b' : '#fff'};
  animation: ${({ $level }) => $level === 'high' ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const FomoTrendBadge = styled.div<{ $trend: 'bullish' | 'bearish' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $trend }) =>
    $trend === 'bullish' ? 'rgba(5, 165, 132, 0.1)' :
    $trend === 'bearish' ? 'rgba(255, 88, 88, 0.1)' :
    '#f1f5f9'};
  color: ${({ $trend }) =>
    $trend === 'bullish' ? '#05A584' :
    $trend === 'bearish' ? '#FF5858' :
    '#64748b'};
`;

export const SentimentBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

export const SentimentBarLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;

  .yes {
    color: #05A584;
  }

  .no {
    color: #FF5858;
  }
`;

export const SentimentBarTrack = styled.div`
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
`;

export const SentimentBarFillYes = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #05A584 0%, #10b981 100%);
  border-radius: 3px 0 0 3px;
  transition: width 0.3s ease;
`;

export const SentimentBarFillNo = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #f87171 0%, #FF5858 100%);
  border-radius: 0 3px 3px 0;
  transition: width 0.3s ease;
`;

export const TrendingTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #FF5858 0%, #FF8C42 100%);
  color: #fff;
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const FomoStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: #64748b;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  strong {
    color: #0f172a;
    font-weight: 600;
  }
`;
