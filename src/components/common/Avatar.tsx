'use client';

import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
  showBorder?: boolean;
  rounded?: 'full' | 'xl' | 'lg' | 'md';
  style?: React.CSSProperties;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const roundedClasses = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  lg: 'rounded-lg',
  md: 'rounded-md',
};

export default function Avatar({
  src,
  name = '',
  size = 'md',
  className = '',
  onClick,
  showBorder = false,
  rounded = 'full',
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const borderClass = showBorder ? 'ring-2 ring-white shadow-sm' : '';
  const cursorClass = onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : '';

  const handleClick = () => {
    if (onClick) onClick();
  };

  // Generate a consistent color based on the name
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-[#D2691E]',
      'bg-violet-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onClick={handleClick}
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} ${roundedClasses[rounded]} ${borderClass} ${cursorClass} object-cover ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`${sizeClasses[size]} ${roundedClasses[rounded]} ${borderClass} ${cursorClass} ${getColorFromName(name)} flex items-center justify-center text-white font-medium ${className}`}
      style={style}
    >
      {initials}
    </div>
  );
}
