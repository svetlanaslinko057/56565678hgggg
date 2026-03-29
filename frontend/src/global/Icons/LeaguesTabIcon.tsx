import React from 'react';

interface LeaguesTabIconProps {
  size?: number;
  color?: string;
}

const LeaguesTabIcon: React.FC<LeaguesTabIconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2H12V5C12 7.76 10.21 10 8 10C5.79 10 4 7.76 4 5V2Z" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M6 10V12H10V10" stroke={color} strokeWidth="1.5"/>
    <path d="M4 12H12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 2H4M12 2H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 2V5C2 6 2.5 6.5 4 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 2V5C14 6 13.5 6.5 12 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default LeaguesTabIcon;
