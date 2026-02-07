'use client';

import { Switch } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: ToggleProps) {
  const sizes = {
    sm: {
      switch: 'h-5 w-9',
      dot: 'h-3.5 w-3.5',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'h-6 w-11',
      dot: 'h-4 w-4',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'h-7 w-14',
      dot: 'h-5 w-5',
      translate: 'translate-x-7',
    },
  };

  const currentSize = sizes[size];

  return (
    <Switch.Group>
      <div className={cn('flex items-center justify-between', className)}>
        {(label || description) && (
          <div className="flex flex-col mr-4">
            {label && (
              <Switch.Label
                className="text-sm font-medium text-dark-900 cursor-pointer"
                passive
              >
                {label}
              </Switch.Label>
            )}
            {description && (
              <Switch.Description className="text-sm text-dark-500">
                {description}
              </Switch.Description>
            )}
          </div>
        )}
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            checked ? 'bg-primary-500' : 'bg-dark-300',
            disabled && 'opacity-50 cursor-not-allowed',
            currentSize.switch
          )}
        >
          <span className="sr-only">{label || 'Toggle'}</span>
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
              checked ? currentSize.translate : 'translate-x-0.5',
              currentSize.dot
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
}
