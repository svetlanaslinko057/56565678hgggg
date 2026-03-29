'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Zap, TrendingUp, Users, Clock, Brain, X } from 'lucide-react';

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
  50% { box-shadow: 0 0 20px 10px rgba(0, 255, 136, 0.2); }
`;

const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Container = styled.div<{ $priority: 'HIGH' | 'MEDIUM' | 'LOW' }>`
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 1000;
  background: ${({ $priority }) => 
    $priority === 'HIGH' 
      ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 204, 106, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.1) 100%)'
  };
  border: 1px solid ${({ $priority }) => 
    $priority === 'HIGH' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 193, 7, 0.4)'
  };
  border-radius: 16px;
  padding: 16px;
  animation: ${slideIn} 0.3s ease, ${pulse} 2s infinite;
  backdrop-filter: blur(12px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Badge = styled.div<{ $priority: 'HIGH' | 'MEDIUM' | 'LOW' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $priority }) => 
    $priority === 'HIGH' ? '#00FF88' : '#FFC107'
  };
  color: #000;
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
`;

const Message = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Stats = styled.div`
  display: flex;
  gap: 16px;
`;

const Stat = styled.div`
  .value {
    font-size: 20px;
    font-weight: 800;
    color: #00FF88;
  }
  
  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%);
  color: #000;
  margin-top: 12px;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
  }
`;

interface FomoEvent {
  type: string;
  marketId: string;
  marketTitle: string;
  data: {
    edge?: number;
    edgeDelta?: number;
    whaleAmount?: number;
    aiSide?: 'YES' | 'NO';
    aiConfidence?: number;
    closingIn?: number;
    betsLastMinutes?: number;
  };
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

interface FomoBannerProps {
  onBetNow?: (marketId: string) => void;
  apiUrl?: string;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'EDGE_JUMP':
      return <TrendingUp size={18} />;
    case 'WHALE_AGREEMENT':
      return <Zap size={18} />;
    case 'CLOSING_SOON':
      return <Clock size={18} />;
    case 'SOCIAL_SPIKE':
      return <Users size={18} />;
    case 'AI_CONFIDENCE':
      return <Brain size={18} />;
    default:
      return <Zap size={18} />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'EDGE_JUMP':
      return 'Edge Jump';
    case 'WHALE_AGREEMENT':
      return 'Strong Signal';
    case 'CLOSING_SOON':
      return 'Closing Soon';
    case 'SOCIAL_SPIKE':
      return 'Hot Market';
    case 'AI_CONFIDENCE':
      return 'AI Signal';
    default:
      return 'FOMO Alert';
  }
};

export function FomoBanner({ onBetNow, apiUrl }: FomoBannerProps) {
  const [event, setEvent] = useState<FomoEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBestSignal = async () => {
      try {
        const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${baseUrl}/api/fomo/best-signal`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setEvent(data.data);
          setDismissed(false);
        }
      } catch (e) {
        console.error('Failed to fetch FOMO signal:', e);
      }
    };

    fetchBestSignal();
    const interval = setInterval(fetchBestSignal, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, [apiUrl]);

  if (!event || dismissed) return null;

  const handleBetNow = () => {
    if (onBetNow) {
      onBetNow(event.marketId);
    }
  };

  return (
    <Container $priority={event.priority} data-testid="fomo-banner">
      <Header>
        <Badge $priority={event.priority}>
          {getIcon(event.type)}
          {getTypeLabel(event.type)}
        </Badge>
        <CloseButton onClick={() => setDismissed(true)} data-testid="fomo-close">
          <X size={16} />
        </CloseButton>
      </Header>

      <Title>{event.marketTitle || 'Market Opportunity'}</Title>
      <Message>
        {getIcon(event.type)}
        {event.message}
      </Message>

      <Stats>
        {event.data.edge !== undefined && (
          <Stat>
            <div className="value">+{event.data.edge.toFixed(1)}%</div>
            <div className="label">Edge</div>
          </Stat>
        )}
        {event.data.aiConfidence !== undefined && (
          <Stat>
            <div className="value">{Math.round(event.data.aiConfidence * 100)}%</div>
            <div className="label">AI Confidence</div>
          </Stat>
        )}
        {event.data.whaleAmount !== undefined && (
          <Stat>
            <div className="value">${event.data.whaleAmount}</div>
            <div className="label">Whale Bet</div>
          </Stat>
        )}
        {event.data.closingIn !== undefined && (
          <Stat>
            <div className="value">{event.data.closingIn}m</div>
            <div className="label">Closing</div>
          </Stat>
        )}
      </Stats>

      <ActionButton onClick={handleBetNow} data-testid="fomo-bet-now">
        <Zap size={18} />
        Bet Now
      </ActionButton>
    </Container>
  );
}

export default FomoBanner;
