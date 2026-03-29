import React from 'react';

interface ArenaTabIconProps {
  className?: string;
  color?: string;
  size?: number;
}

const ArenaTabIcon: React.FC<ArenaTabIconProps> = ({ className, color = '#738094', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="8" r="3" fill={color}/>
  </svg>
);

export default ArenaTabIcon;
