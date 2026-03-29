import React from 'react';

const BearIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#FF5858' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 13L13 5H3L8 13Z" fill={color}/>
  </svg>
);

export default BearIcon;
