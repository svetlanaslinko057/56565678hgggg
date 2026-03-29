'use client';

import React from 'react';
import styled from 'styled-components';

const AvatarWrapper = styled.div<{ $size?: string; $variant?: string }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    border-radius: 50%;
    object-fit: cover;
    ${({ $size }) => {
      switch ($size) {
        case 'xxSmall':
          return 'width: 20px; height: 20px;';
        case 'small':
          return 'width: 32px; height: 32px;';
        case 'medium':
          return 'width: 40px; height: 40px;';
        case 'otc':
          return 'width: 36px; height: 36px;';
        case 'large':
          return 'width: 56px; height: 56px;';
        default:
          return 'width: 40px; height: 40px;';
      }
    }}
  }

  .rating {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #05A584;
    color: white;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 600;
    line-height: 1;
  }
  
  ${({ $variant }) => $variant === 'spotlight' && `
    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid #05A584;
    }
  `}
  
  ${({ $variant }) => $variant === 'success' && `
    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      border: 2px solid #05A584;
    }
  `}
`;

interface UserAvatarProps {
  avatar: string;
  size?: 'xxSmall' | 'small' | 'medium' | 'large' | 'otc';
  variant?: 'default' | 'success' | 'spotlight';
  rating?: number;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  size = 'medium',
  variant = 'default',
  rating,
  className,
}) => {
  return (
    <AvatarWrapper $size={size} $variant={variant} className={className}>
      <img src={avatar} alt="User avatar" />
      {rating && <span className="rating">{rating}</span>}
    </AvatarWrapper>
  );
};

export default UserAvatar;
