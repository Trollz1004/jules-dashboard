'use client';

import { X, Heart, Star, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeActionsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SwipeActions({
  onPass,
  onLike,
  onSuperLike,
  onUndo,
  canUndo = false,
  disabled = false,
  className,
}: SwipeActionsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Undo Button */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={disabled || !canUndo}
          className={cn(
            'action-btn action-btn-sm bg-white border-2',
            canUndo
              ? 'border-amber-400 text-amber-500 hover:bg-amber-50'
              : 'border-dark-200 text-dark-300 cursor-not-allowed'
          )}
          aria-label="Undo"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      )}

      {/* Nope Button */}
      <button
        onClick={onPass}
        disabled={disabled}
        className={cn(
          'action-btn action-btn-lg bg-white border-2 border-red-400 text-red-500',
          'hover:bg-red-50 hover:border-red-500 hover:text-red-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Pass"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Super Like Button */}
      <button
        onClick={onSuperLike}
        disabled={disabled}
        className={cn(
          'action-btn action-btn-md bg-white border-2 border-blue-400 text-blue-500',
          'hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Super Like"
      >
        <Star className="w-6 h-6 fill-current" />
      </button>

      {/* Like Button */}
      <button
        onClick={onLike}
        disabled={disabled}
        className={cn(
          'action-btn action-btn-lg bg-love-gradient text-white shadow-glow',
          'hover:shadow-glow-lg hover:scale-110',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
        )}
        aria-label="Like"
      >
        <Heart className="w-8 h-8 fill-current" />
      </button>
    </div>
  );
}
