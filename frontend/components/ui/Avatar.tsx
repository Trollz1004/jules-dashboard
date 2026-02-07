'use client';

import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  isOnline,
  className,
}: AvatarProps) {
  const sizes = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-32 h-32 text-3xl',
    '2xl': 'w-40 h-40 text-4xl',
  };

  const onlineSizes = {
    xs: 'w-2.5 h-2.5 border',
    sm: 'w-3 h-3 border-2',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-2',
    xl: 'w-6 h-6 border-[3px]',
    '2xl': 'w-8 h-8 border-4',
  };

  const initials = name ? getInitials(name) : '?';

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-secondary-500',
          sizes[size]
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes={`(max-width: 768px) ${sizes[size].split(' ')[0]}, ${sizes[size].split(' ')[0]}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            isOnline ? 'bg-green-500' : 'bg-dark-400',
            onlineSizes[size]
          )}
        />
      )}
    </div>
  );
}
