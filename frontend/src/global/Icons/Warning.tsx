import React from 'react';

const WarningIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#FFB800' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L15 14H1L8 1Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M8 6V9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="11.5" r="0.75" fill={color}/>
  </svg>
);

export default WarningIcon;
