'use client';

import React, { useRef, useState } from 'react';
import styled from 'styled-components';

interface WinCardData {
  positionId: string;
  title: string;
  market: string;
  side: string;
  entry: number;
  payout: number;
  profit: number;
  roi: string;
  rival?: string;
  rivalDefeated?: boolean;
  streak?: number;
  isTopTen?: boolean;
  badge?: string;
  refLink: string;
  telegramShareUrl: string;
  shareText: string;
}

interface WinCardProps {
  data: WinCardData;
  onShare?: () => void;
}

const CardContainer = styled.div`
  width: 320px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(145deg, #0B0F1A 0%, #151B2B 100%);
  color: #fff;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(82, 196, 26, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  h2 {
    color: #52c41a;
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }
`;

const Amount = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: #52c41a;
  text-align: center;
  margin: 16px 0;
`;

const MarketInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
`;

const MarketTitle = styled.div`
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 8px;
  line-height: 1.4;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Stat = styled.div`
  text-align: center;
  .label { font-size: 10px; color: #718096; text-transform: uppercase; }
  .value { font-size: 16px; font-weight: 600; color: #fff; margin-top: 4px; }
  .positive { color: #52c41a; }
`;

const Badge = styled.div<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
  margin-bottom: 8px;
  background: ${({ $type }) => $type === 'streak' ? 'rgba(255, 165, 0, 0.2)' : $type === 'rival' ? 'rgba(255, 77, 79, 0.2)' : 'rgba(255, 215, 0, 0.2)'};
  color: ${({ $type }) => $type === 'streak' ? '#ffa500' : $type === 'rival' ? '#ff4d4f' : '#ffd700'};
`;

const RivalSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 8px;
  margin: 12px 0;
  .text { font-size: 14px; color: #ff4d4f; font-weight: 500; }
  .wallet { font-family: monospace; font-size: 12px; color: #a0aec0; }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: #718096;
`;

const ShareButton = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 16px;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(82, 196, 26, 0.4); }
`;

export function WinCard({ data, onShare }: WinCardProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    if (onShare) onShare();
    window.open(data.telegramShareUrl, '_blank');
    setIsSharing(false);
  };

  return (
    <div>
      <CardContainer data-testid="win-card">
        <Header>
          <span style={{fontSize: 28}}>&#127881;</span>
          <h2>WIN</h2>
        </Header>

        <Amount data-testid="win-amount">+${data.payout.toFixed(2)}</Amount>

        <MarketInfo>
          <MarketTitle data-testid="win-market">{data.market}</MarketTitle>
          <StatsRow>
            <Stat><div className="label">Side</div><div className="value">{data.side}</div></Stat>
            <Stat><div className="label">Entry</div><div className="value">${data.entry.toFixed(2)}</div></Stat>
            <Stat><div className="label">ROI</div><div className="value positive">+{data.roi}%</div></Stat>
          </StatsRow>
        </MarketInfo>

        <div>
          {data.streak && data.streak >= 3 && (
            <Badge $type="streak" data-testid="streak-badge">&#128293; {data.streak}-Win Streak</Badge>
          )}
          {data.isTopTen && (
            <Badge $type="top" data-testid="top-badge">&#127942; Top 10</Badge>
          )}
        </div>

        {data.rivalDefeated && data.rival && (
          <RivalSection data-testid="rival-section">
            <span style={{fontSize: 20}}>&#9876;</span>
            <div><div className="text">Rival Defeated</div><div className="wallet">{data.rival}</div></div>
          </RivalSection>
        )}

        <Footer>
          <span>FOMO ARENA</span>
          <span style={{color: '#52c41a'}}>Join the Arena</span>
        </Footer>
      </CardContainer>

      <ShareButton onClick={handleShare} disabled={isSharing} data-testid="share-win-button">
        &#128640; Share Win
      </ShareButton>
    </div>
  );
}

export default WinCard;
