import React from 'react';

const Accuracy: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#05A584' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="8" r="3.5" stroke={color} strokeWidth="1" fill="none"/>
    <circle cx="8" cy="8" r="1.5" fill={color}/>
  </svg>
);

export default Accuracy;
