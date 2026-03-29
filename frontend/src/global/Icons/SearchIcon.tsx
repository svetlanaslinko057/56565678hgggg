import React from 'react';

interface SearchIconProps {
  className?: string;
  fill?: string;
  size?: number;
}

export const SearchIcon: React.FC<SearchIconProps> = ({ className, fill = '#738094', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke={fill} strokeWidth="1.5"/>
    <path d="M11 11L14 14" stroke={fill} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default SearchIcon;
