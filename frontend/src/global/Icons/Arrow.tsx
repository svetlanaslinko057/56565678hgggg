import React from 'react';

const Arrow: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#05A584' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14V2M8 2L4 6M8 2L12 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default Arrow;
