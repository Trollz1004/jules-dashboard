'use client';

import { useState, useCallback, useRef } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  threshold?: number;
  rotationFactor?: number;
}

interface SwipeState {
  direction: 'left' | 'right' | 'up' | null;
  progress: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  threshold = 150,
  rotationFactor = 0.15,
}: UseSwipeOptions = {}) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    direction: null,
    progress: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 30 },
  }));

  const triggerSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    setIsAnimating(true);

    const targetX = direction === 'left' ? -500 : direction === 'right' ? 500 : 0;
    const targetY = direction === 'up' ? -500 : 0;
    const targetRotate = direction === 'left' ? -30 : direction === 'right' ? 30 : 0;

    api.start({
      x: targetX,
      y: targetY,
      rotate: targetRotate,
      scale: 0.8,
      config: { tension: 200, friction: 25 },
      onRest: () => {
        if (direction === 'left') onSwipeLeft?.();
        else if (direction === 'right') onSwipeRight?.();
        else if (direction === 'up') onSwipeUp?.();

        // Reset after callback
        api.start({
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          immediate: true,
        });
        setIsAnimating(false);
        setSwipeState({ direction: null, progress: 0 });
      },
    });
  }, [api, onSwipeLeft, onSwipeRight, onSwipeUp]);

  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy] }) => {
      if (isAnimating) return;

      const absX = Math.abs(mx);
      const absY = Math.abs(my);

      // Determine swipe direction based on movement
      let direction: 'left' | 'right' | 'up' | null = null;
      let progress = 0;

      if (absX > absY) {
        direction = mx > 0 ? 'right' : 'left';
        progress = Math.min(absX / threshold, 1);
      } else if (my < 0 && absY > 50) {
        direction = 'up';
        progress = Math.min(absY / threshold, 1);
      }

      setSwipeState({ direction, progress });

      if (active) {
        // Update spring while dragging
        api.start({
          x: mx,
          y: my,
          rotate: mx * rotationFactor,
          scale: 1 - Math.min(Math.abs(mx) / 1000, 0.05),
          immediate: true,
        });
      } else {
        // Check if swipe threshold is met
        const swipeThresholdMet = absX > threshold || (my < -threshold);
        const highVelocity = vx > 0.5 || vy > 0.5;

        if (swipeThresholdMet || highVelocity) {
          if (direction) {
            triggerSwipe(direction);
          }
        } else {
          // Spring back to center
          api.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
          });
          setSwipeState({ direction: null, progress: 0 });
        }
      }
    },
    {
      from: () => [x.get(), y.get()],
      bounds: containerRef,
      rubberband: true,
    }
  );

  return {
    bind,
    containerRef,
    swipeState,
    isAnimating,
    triggerSwipe,
    style: {
      x,
      y,
      rotate,
      scale,
    },
    AnimatedDiv: animated.div,
  };
}
