import React from 'react';

const BullIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#05A584' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3L13 11H3L8 3Z" fill={color}/>
  </svg>
);

export default BullIcon;
