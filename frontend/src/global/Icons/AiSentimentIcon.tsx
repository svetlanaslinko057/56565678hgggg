import React from 'react';

const AiSentimentIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#738094' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="5" cy="7" r="1" fill={color}/>
    <circle cx="11" cy="7" r="1" fill={color}/>
    <path d="M5 10C5.5 11 6.5 11.5 8 11.5C9.5 11.5 10.5 11 11 10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export default AiSentimentIcon;
