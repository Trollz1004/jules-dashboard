'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  min: number;
  max: number;
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export function Slider({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => v.toString(),
  className,
}: SliderProps) {
  const isRange = Array.isArray(value);
  const [isDragging, setIsDragging] = useState(false);

  const getPercent = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  );

  const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const handleRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isMin: boolean
  ) => {
    const newValue = Number(e.target.value);
    const [minVal, maxVal] = value as [number, number];

    if (isMin) {
      onChange([Math.min(newValue, maxVal - step), maxVal]);
    } else {
      onChange([minVal, Math.max(newValue, minVal + step)]);
    }
  };

  const displayValue = isRange
    ? `${formatValue(value[0])} - ${formatValue(value[1])}`
    : formatValue(value);

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-dark-700">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-primary-600">
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-2 bg-dark-200 rounded-full" />

        {/* Active track */}
        <div
          className="absolute h-2 bg-love-gradient rounded-full"
          style={
            isRange
              ? {
                  left: `${getPercent(value[0])}%`,
                  width: `${getPercent(value[1]) - getPercent(value[0])}%`,
                }
              : {
                  left: 0,
                  width: `${getPercent(value)}%`,
                }
          }
        />

        {isRange ? (
          <>
            {/* Min thumb */}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[0]}
              onChange={(e) => handleRangeChange(e, true)}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className={cn(
                'absolute w-full h-6 bg-transparent appearance-none cursor-pointer pointer-events-none',
                '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full',
                '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2',
                '[&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-grab',
                isDragging && '[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:scale-110',
                '[&::-webkit-slider-thumb]:transition-transform'
              )}
            />
            {/* Max thumb */}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[1]}
              onChange={(e) => handleRangeChange(e, false)}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className={cn(
                'absolute w-full h-6 bg-transparent appearance-none cursor-pointer pointer-events-none',
                '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full',
                '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2',
                '[&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-grab',
                isDragging && '[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:scale-110',
                '[&::-webkit-slider-thumb]:transition-transform'
              )}
            />
          </>
        ) : (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSingleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className={cn(
              'absolute w-full h-6 bg-transparent appearance-none cursor-pointer',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg',
              '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-grab',
              isDragging && '[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:scale-110',
              '[&::-webkit-slider-thumb]:transition-transform'
            )}
          />
        )}
      </div>
    </div>
  );
}
