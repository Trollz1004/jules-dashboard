'use client';

import { useState, useCallback } from 'react';
import { Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERESTS } from '@/lib/utils';
import { Input } from '@/components/ui';

interface InterestPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
  maxInterests?: number;
  minInterests?: number;
  className?: string;
}

export function InterestPicker({
  selected,
  onChange,
  maxInterests = 10,
  minInterests = 3,
  className,
}: InterestPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInterests = searchQuery
    ? INTERESTS.filter((interest) =>
        interest.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : INTERESTS;

  const toggleInterest = useCallback(
    (interest: string) => {
      if (selected.includes(interest)) {
        onChange(selected.filter((i) => i !== interest));
      } else if (selected.length < maxInterests) {
        onChange([...selected, interest]);
      }
    },
    [selected, onChange, maxInterests]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <Input
        placeholder="Search interests..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-dark-500">
          Select {minInterests}-{maxInterests} interests
        </span>
        <span
          className={cn(
            'font-medium',
            selected.length >= minInterests
              ? 'text-green-500'
              : 'text-dark-500'
          )}
        >
          {selected.length}/{maxInterests} selected
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.min((selected.length / maxInterests) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Interests grid */}
      <div className="flex flex-wrap gap-2">
        {filteredInterests.map((interest) => {
          const isSelected = selected.includes(interest);
          const isDisabled = !isSelected && selected.length >= maxInterests;

          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              disabled={isDisabled}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-100 text-dark-700 hover:bg-dark-200',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSelected && <Check className="w-4 h-4" />}
              {interest}
            </button>
          );
        })}
      </div>

      {/* Selected interests preview */}
      {selected.length > 0 && (
        <div className="pt-4 border-t border-dark-100">
          <h4 className="text-sm font-medium text-dark-700 mb-2">
            Your interests:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selected.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700"
              >
                {interest}
                <button
                  onClick={() => toggleInterest(interest)}
                  className="hover:text-primary-900"
                >
                  <span className="sr-only">Remove {interest}</span>
                  x
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
