import React from 'react';

interface SwordsIconProps {
  size?: number;
  color?: string;
}

const SwordsIcon: React.FC<SwordsIconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L7 7M15 1L9 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 7L5 9L3 11L1 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 7L11 9L13 11L15 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M1 15L3 13M15 15L13 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default SwordsIcon;
