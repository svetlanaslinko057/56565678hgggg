'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { MarketAI, MarketRisk } from './types';

// === EDGE BAR ===
const EdgeBarContainer = styled.div`
  margin-top: 12px;
`;

const BarWrapper = styled.div<{ $bgColor: string }>`
  position: relative;
  height: 8px;
  background: ${props => props.$bgColor};
  border-radius: 4px;
  overflow: visible;
`;

const MarketBar = styled.div<{ $width: number }>`
  position: absolute;
  height: 100%;
  width: ${props => props.$width}%;
  background: rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const AIBar = styled.div<{ $width: number; $color: string }>`
  position: absolute;
  height: 100%;
  width: ${props => props.$width}%;
  background: ${props => props.$color};
  border-radius: 4px;
  opacity: 0.8;
  transition: width 0.5s ease;
`;

const BarLabels = styled.div<{ $mutedColor: string }>`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  color: ${props => props.$mutedColor};
`;

interface EdgeBarProps {
  marketPercent: number;
  aiPercent: number;
}

export function EdgeBar({ marketPercent, aiPercent }: EdgeBarProps) {
  const { theme } = useTheme();
  const isPositiveEdge = aiPercent > marketPercent;
  const barColor = isPositiveEdge ? theme.success : theme.danger;

  return (
    <EdgeBarContainer>
      <BarWrapper $bgColor={theme.bgSecondary}>
        <MarketBar $width={marketPercent} />
        <AIBar $width={aiPercent} $color={barColor} />
      </BarWrapper>
      <BarLabels $mutedColor={theme.textMuted}>
        <span>Market {marketPercent}%</span>
        <span>AI {Math.round(aiPercent)}%</span>
      </BarLabels>
    </EdgeBarContainer>
  );
}

// === EDGE BADGE ===
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
`;

const EdgeBadgeWrapper = styled.div<{ $color: string; $isPulsing: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}40;
  animation: ${props => props.$isPulsing ? pulse : 'none'} 2s ease-in-out infinite;
`;

interface EdgeBadgeProps {
  edge: number;
}

export function EdgeBadge({ edge }: EdgeBadgeProps) {
  const { theme } = useTheme();
  const edgePercent = Math.round(edge * 100);
  const isPositive = edge > 0;
  const isHighEdge = Math.abs(edge) > 0.1;
  
  let color: string;
  if (Math.abs(edge) < 0.05) {
    color = theme.textMuted;
  } else if (isPositive) {
    color = isHighEdge ? theme.success : theme.warning;
  } else {
    color = theme.danger;
  }

  return (
    <EdgeBadgeWrapper $color={color} $isPulsing={isHighEdge}>
      {isPositive ? '+' : ''}{edgePercent}% Edge
    </EdgeBadgeWrapper>
  );
}

// === AI SIGNAL ===
const SignalWrapper = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$color};
`;

interface AISignalProps {
  signal: 'buy' | 'sell' | 'wait';
  confidence?: number;
}

export function AISignal({ signal, confidence }: AISignalProps) {
  const { theme } = useTheme();
  
  if (signal === 'buy') {
    return (
      <SignalWrapper $color={theme.success}>
        <TrendingUp size={14} /> AI BULLISH
        {confidence && confidence > 0.7 && ' ⚡'}
      </SignalWrapper>
    );
  }

  if (signal === 'sell') {
    return (
      <SignalWrapper $color={theme.danger}>
        <TrendingDown size={14} /> AI BEARISH
      </SignalWrapper>
    );
  }

  return (
    <SignalWrapper $color={theme.textMuted}>
      <Minus size={14} /> WAIT
    </SignalWrapper>
  );
}

// === RISK BADGE ===
const RiskWrapper = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$color};
`;

interface RiskBadgeProps {
  risk: MarketRisk;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const { theme } = useTheme();
  
  let color: string;
  let Icon: any;
  
  switch (risk.level) {
    case 'LOW':
      color = theme.success;
      Icon = ShieldCheck;
      break;
    case 'MEDIUM':
      color = theme.warning;
      Icon = Shield;
      break;
    case 'HIGH':
      color = theme.danger;
      Icon = ShieldAlert;
      break;
  }

  return (
    <RiskWrapper $color={color}>
      <Icon size={12} /> {risk.level}
    </RiskWrapper>
  );
}

// === FOR YOU BADGE ===
const ForYouWrapper = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export function ForYouBadge() {
  return (
    <ForYouWrapper $color="#00c8ff">
      ✨ For you
    </ForYouWrapper>
  );
}

// === AI REASONING ===
const ReasoningWrapper = styled.div<{ $bgColor: string; $textColor: string; $borderColor: string }>`
  margin-top: 12px;
  padding: 10px 12px;
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 10px;
`;

const ReasoningLabel = styled.div<{ $mutedColor: string }>`
  font-size: 10px;
  font-weight: 600;
  color: ${props => props.$mutedColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const ReasoningText = styled.div<{ $textColor: string }>`
  font-size: 12px;
  color: ${props => props.$textColor};
  line-height: 1.4;
`;

interface AIReasoningProps {
  ai: MarketAI;
}

export function AIReasoning({ ai }: AIReasoningProps) {
  const { theme } = useTheme();

  if (!ai.reasoning) return null;

  return (
    <ReasoningWrapper $bgColor={theme.bgCard} $textColor={theme.textPrimary} $borderColor={theme.border}>
      <ReasoningLabel $mutedColor={theme.textMuted}>AI Analysis</ReasoningLabel>
      <ReasoningText $textColor={theme.textSecondary}>
        {ai.reasoning}
      </ReasoningText>
    </ReasoningWrapper>
  );
}
