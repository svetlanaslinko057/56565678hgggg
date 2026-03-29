import React from 'react';

const MarketplaceIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1H15M1 1V15H15V1M1 1L4 8H12L15 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="4" y="10" width="3" height="3" rx="0.5" fill={color}/>
    <rect x="9" y="10" width="3" height="3" rx="0.5" fill={color}/>
  </svg>
);

export default MarketplaceIcon;
