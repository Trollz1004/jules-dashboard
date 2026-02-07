'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, GraduationCap, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDistance } from '@/lib/utils';
import { DiscoverProfile } from '@/lib/api';
import { Badge } from '@/components/ui';

interface SwipeCardProps {
  profile: DiscoverProfile;
  onInfoClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SwipeCard({ profile, onInfoClick, className, style }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const photos = profile.photos || [];
  const currentPhoto = photos[currentPhotoIndex];

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-4xl bg-dark-900 shadow-2xl select-none',
        className
      )}
      style={{ aspectRatio: '3/4', ...style }}
    >
      {/* Photo */}
      <div className="absolute inset-0">
        {currentPhoto && !imageError ? (
          <Image
            src={currentPhoto.url}
            alt={profile.name}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
            <Heart className="w-24 h-24 text-white/50" />
          </div>
        )}
      </div>

      {/* Photo navigation overlay */}
      {photos.length > 1 && (
        <>
          {/* Left tap area */}
          <button
            onClick={prevPhoto}
            className="absolute left-0 top-0 w-1/3 h-full z-10"
            aria-label="Previous photo"
          />
          {/* Right tap area */}
          <button
            onClick={nextPhoto}
            className="absolute right-0 top-0 w-1/3 h-full z-10"
            aria-label="Next photo"
          />

          {/* Navigation arrows */}
          {currentPhotoIndex > 0 && (
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentPhotoIndex < photos.length - 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* Photo indicators */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
          {photos.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 h-1 rounded-full transition-all duration-200',
                index === currentPhotoIndex
                  ? 'bg-white'
                  : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            {/* Name and Age */}
            <h2 className="text-3xl font-bold">
              {profile.name}
              {profile.age && <span className="font-normal">, {profile.age}</span>}
            </h2>

            {/* Location/Distance */}
            {profile.distance !== undefined && (
              <div className="flex items-center gap-1 mt-1 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{formatDistance(profile.distance)}</span>
              </div>
            )}

            {/* Job and School */}
            <div className="mt-2 space-y-1">
              {profile.jobTitle && (
                <div className="flex items-center gap-2 text-white/80">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">
                    {profile.jobTitle}
                    {profile.company && ` at ${profile.company}`}
                  </span>
                </div>
              )}
              {profile.school && (
                <div className="flex items-center gap-2 text-white/80">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm">{profile.school}</span>
                </div>
              )}
            </div>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.interests.slice(0, 4).map((interest, index) => (
                  <Badge
                    key={index}
                    variant="primary"
                    size="sm"
                    className="bg-white/20 text-white border-none"
                  >
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 4 && (
                  <Badge
                    variant="primary"
                    size="sm"
                    className="bg-white/20 text-white border-none"
                  >
                    +{profile.interests.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Info button */}
          {onInfoClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors ml-4"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Like/Nope stamps (shown when swiping) */}
      <AnimatePresence>
        <motion.div
          className="stamp stamp-like"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
        >
          LIKE
        </motion.div>
        <motion.div
          className="stamp stamp-nope"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
        >
          NOPE
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
