import React from 'react';

const League: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#05A584' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M5 8L7 10L11 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default League;
