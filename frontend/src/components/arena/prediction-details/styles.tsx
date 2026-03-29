'use client';

import styled from "styled-components";

export const PredictionDetailsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  margin-top: 40px;
  padding-bottom: 40px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const RightColumn = styled.div``;

export const PredictionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const LogoSection = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  flex: 1;
`;

export const Logo = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
`;

export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
`;

export const Creator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;

  .name {
    color: #0f172a;
    font-weight: 500;
  }

  img {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

export const HeaderBottom = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  padding: 20px;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
`;

export const CountdownTimer = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  position: relative;
  cursor: pointer;
`;

export const CountdownTooltip = styled.div<{ visible: boolean }>`
  position: absolute;
  top: -130px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  min-width: 340px;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  visibility: ${({ visible }) => (visible ? "visible" : "hidden")};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(20px);
`;

export const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  padding: 5px 0 5px 5px;
  margin-bottom: 20px;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff5858;
    animation: pulse 2s ease-in-out infinite;
  }

  .live-text {
    color: #ff5858;
  }

  .time-left {
    text-align: right;
    width: 100%;
    color: #000;
    font-weight: 500;

    span {
      color: #728094;
      font-weight: 400;
    }
  }
`;

export const TooltipLabel = styled.div`
  font-size: 14px;
  color: #94a3b8;
  font-weight: 400;
  margin-bottom: 10px;
`;

export const TooltipTime = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .date {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .time {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const TimeUnit = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const TimeValue = styled.span`
  font-size: 32px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1;
`;

export const TimeLabel = styled.span`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
`;

export const VolumeRiskRow = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 8px;
`;

export const VolumeInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;

  .value {
    font-size: 16px;
    font-weight: 600;
    color: #728094;
  }

  .label {
    font-size: 12px;
    color: #94a3b8;
  }
`;

export const RiskInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;

  .label {
    color: #94a3b8;
    opacity: 1;
  }

  .value {
    font-weight: 600;

    &.low {
      color: #05a584;
    }

    &.medium {
      color: #ffb800;
    }

    &.high {
      color: #ff5858;
    }
  }
`;

export const OutcomesSection = styled.div`
  display: flex;
  flex-direction: column;
`;

export const OutcomesHeader = styled.div`
  display: grid;
  grid-template-columns: 0.4fr 100px 0.6fr;
  gap: 10px;
  font-size: 14px;
  color: #738094;
  font-weight: 500;
  border-bottom: 1px solid #f0f2f5;

  span {
    padding: 6.5px 10px;
  }

  .chance {
    text-align: right;
  }
`;

export const OutcomesTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const OutcomeRow = styled.div<{ selected?: boolean }>`
  display: grid;
  grid-template-columns: 0.4fr 100px 0.6fr;
  gap: 10px;
  padding: 10px 17px;
  background: #ffffff;
  align-items: center;
  transition: background 0.2s ease;
  height: 72px;
  border-bottom: 1px solid #f0f2f5;
  border-radius: 12px;

  &:hover {
    background: #f9fbfc;
  }

  .bet-buttons {
    display: flex;
    gap: 8px;
  }
`;

export const OutcomeLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

export const ChanceValue = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  text-align: right;
  margin-right: 10px;
`;

export const BetButton = styled.button<{ variant: "yes" | "no" }>`
  flex: 1;
  padding: 8px 16px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  ${({ variant }) =>
    variant === "yes"
      ? `
    background: #F5FBFD;
    color: #05A584;

    &:hover {
      background: #d1f4e8;
    }
  `
      : `
    background: #FEF1F2;
    color: #FF5858;

    &:hover {
      background: #fee5e5;
    }
  `}
`;

export const Multiplier = styled.span`
  font-size: 12px;
  opacity: 0.8;
`;

export const BettingCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const BettingCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  .outcome-value {
    font-size: 40px;
    font-weight: 600;
    color: #0f172a;
  }

  img {
    width: 40px;
    height: 40px;
  }
`;

export const BettingOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

export const BetOptionButton = styled.button<{
  variant: "yes" | "no";
  active?: boolean;
}>`
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  ${({ variant, active }) =>
    variant === "yes"
      ? `
    background: ${active ? "#05A584" : "#F5FBFD"};
    color: ${active ? "#FFFFFF" : "#05A584"};

    &:hover {
      background: ${active ? "#038a6a" : "#d1f4e8"};
    }
  `
      : `
    background: ${active ? "#FF5858" : "#FEF1F2"};
    color: ${active ? "#FFFFFF" : "#FF5858"};

    &:hover {
      background: ${active ? "#e04646" : "#fee5e5"};
    }
  `}
`;

export const AmountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const AmountLabel = styled.span`
  font-size: 14px;
  color: #728094;
  font-weight: 500;
`;

export const AmountInput = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #05a584;
  border-radius: 12px;
  background: #ffffff;
  position: relative;

  .currency {
    font-size: 16px;
    font-weight: 500;
    color: #0f172a;
  }

  input {
    border: none;
    outline: none;
    text-align: right;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    width: 100px;
    flex: 1;
    margin: 0 12px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

export const AmountSpinnerButtons = styled.div`
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  width: 14px;
  border-radius: 4px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 12px;
    left: 4px;
    width: 6px;
    height: 1px;
    background: #b5bcc7;
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;

    &:hover {
      color: #05a584;
    }

    svg {
      width: 12px;
      height: 8px;
    }
  }
`;

export const QuickAmountButtons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 12px;
`;

export const QuickAmountButton = styled.button`
  padding: 8px;
  background: #f5fbfd;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e8f9f1;
    color: #05a584;
  }
`;

export const BettingDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: 14px;
    color: #94a3b8;
    opacity: 1;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;

    &.highlight {
      font-size: 24px;
      font-weight: 600;
      color: #05a584;
    }
  }
`;

export const PlaceBetButton = styled.button`
  padding: 11px 24px;
  background: #05a584;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #038a6a;
  }
`;

export const BettingDisclaimer = styled.p`
  font-size: 14px;
  color: #94a3b8;
  text-align: left;
  line-height: 1.2;
  margin: 0;

  .link {
    color: #728094;
    cursor: pointer;
    font-weight: 500;
  }
`;

export const AISentiment = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5fbfd;
  border-radius: 20px;
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  border: none;
  width: fit-content;

  &:hover {
    background: #eff6ff;
  }
`;

export const AiSentimentIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SentimentSection = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  padding: 10px;
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
  color: #0f172a;
`;

export const SentimentMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: #f5fbfd;
  border-radius: 8px;
`;

export const SentimentMetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

export const SentimentFullDescription = styled.p`
  font-size: 14px;
  line-height: 1.3;
  margin: 0;
  text-align: justify;
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
    line-height: 1.5;

    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
`;

// Chart Styled Components (Matching EngagementTimeline)
export const PredictionChartWrapper = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 16px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

export const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const ChartTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #070b35;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  .percentage {
    font-size: 14px;
    color: #05a584;
    margin-left: 8px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    flex-direction: row;
  }
`;

export const ChartSubtitle = styled.div`
  font-size: 14px;
  color: #728094;
`;

export const ChartControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const ChartPeriodButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const ChartPeriodButton = styled.button<{ active: boolean }>`
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ active }) => (active ? "#E9F7F7" : "transparent")};
  color: ${({ active }) => (active ? "#05A584" : "#728094")};

  &:hover {
    opacity: 0.8;
  }
`;

export const ChartCameraButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

export const ChartLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #e9f7f7;
  border-radius: 20px;

  span {
    font-size: 12px;
  }
`;

export const LegendDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

export const ChartContainer = styled.div`
  height: fit-content;
  width: 100%;
  max-width: 100%;
`;

export const ChartTooltip = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e9f2;
`;

export const TooltipDate = styled.div`
  font-size: 12px;
  color: #728094;
  margin-bottom: 8px;
  font-weight: 500;
`;

export const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const TooltipDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

export const ChartTooltipLabel = styled.span`
  font-size: 12px;
  color: #728094;
  min-width: 70px;
`;

export const TooltipValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #070b35;
`;
