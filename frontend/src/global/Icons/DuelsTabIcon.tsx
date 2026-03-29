import React from 'react';

const DuelsTabIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3L6 7M14 3L10 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 7L8 9L10 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 9V14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 14H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default DuelsTabIcon;
