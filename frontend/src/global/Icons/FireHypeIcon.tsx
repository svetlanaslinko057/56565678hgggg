import React from 'react';

const FireHypeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#FF9500' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1C8 1 4.5 5 4.5 9.5C4.5 12 6.07 14 8 14C9.93 14 11.5 12 11.5 9.5C11.5 5 8 1 8 1Z" fill={color}/>
    <path d="M8 7C8 7 6.5 9 6.5 10.5C6.5 11.88 7.17 13 8 13C8.83 13 9.5 11.88 9.5 10.5C9.5 9 8 7 8 7Z" fill="#FFD700"/>
  </svg>
);

export default FireHypeIcon;
