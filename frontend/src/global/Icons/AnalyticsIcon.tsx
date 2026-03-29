import React from 'react';

const AnalyticsIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14V8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 14V4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 14V6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 14V2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default AnalyticsIcon;
