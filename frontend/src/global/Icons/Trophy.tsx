import React from 'react';

const Trophy: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#FFB800' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2H12V6C12 8.21 10.21 10 8 10C5.79 10 4 8.21 4 6V2Z" fill={color}/>
    <rect x="6" y="10" width="4" height="2" fill={color}/>
    <rect x="4" y="12" width="8" height="2" rx="1" fill={color}/>
    <path d="M2 2H4V4C4 5 3 5.5 2 5V2Z" fill={color}/>
    <path d="M12 2H14V5C13 5.5 12 5 12 4V2Z" fill={color}/>
  </svg>
);

export default Trophy;
