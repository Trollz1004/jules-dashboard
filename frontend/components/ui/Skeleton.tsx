'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variants = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(
        'bg-dark-200',
        variants[variant],
        animations[animation],
        className
      )}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" className="w-14 h-14" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <Skeleton className="h-3 w-4/6 rounded" />
      </div>
    </div>
  );
}

export function SkeletonSwipeCard() {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-dark-200 animate-pulse" style={{ aspectRatio: '3/4' }}>
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMatchCard() {
  return (
    <div className="flex items-center space-x-4 p-4 rounded-2xl">
      <Skeleton variant="circular" className="w-16 h-16" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>
    </div>
  );
}

export function SkeletonMessage({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <Skeleton
        className={cn(
          'h-12 rounded-2xl',
          isOwn ? 'w-48 rounded-br-md' : 'w-56 rounded-bl-md'
        )}
      />
    </div>
  );
}
