'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Ruler,
  Target,
} from 'lucide-react';
import { cn, formatDistance } from '@/lib/utils';
import { DiscoverProfile } from '@/lib/api';
import { Badge, Button } from '@/components/ui';

interface ProfileDetailsProps {
  profile: DiscoverProfile;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
}

export function ProfileDetails({
  profile,
  isOpen,
  onClose,
  onLike,
  onPass,
}: ProfileDetailsProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = profile.photos || [];

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 backdrop-blur-lg">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-dark-100 transition-colors"
            >
              <X className="w-6 h-6 text-dark-700" />
            </button>
            <h1 className="font-semibold text-dark-900">Profile</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Photo gallery */}
          <div className="relative aspect-square">
            {photos.length > 0 ? (
              <>
                <Image
                  src={photos[currentPhotoIndex].url}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />

                {/* Navigation */}
                {photos.length > 1 && (
                  <>
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 text-dark-700" />
                      </button>
                    )}
                    {currentPhotoIndex < photos.length - 1 && (
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 text-dark-700" />
                      </button>
                    )}

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {photos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            index === currentPhotoIndex
                              ? 'bg-white w-6'
                              : 'bg-white/50'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                <Heart className="w-24 h-24 text-white/50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Name and basics */}
            <div>
              <h2 className="text-3xl font-bold text-dark-900">
                {profile.name}
                {profile.age && <span className="font-normal">, {profile.age}</span>}
              </h2>

              <div className="flex flex-wrap gap-4 mt-3 text-dark-600">
                {profile.distance !== undefined && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{formatDistance(profile.distance)}</span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-lg font-semibold text-dark-900 mb-2">About</h3>
                <p className="text-dark-600 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              {profile.jobTitle && (
                <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                  <Briefcase className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-dark-500">Work</p>
                    <p className="font-medium text-dark-900">
                      {profile.jobTitle}
                      {profile.company && ` at ${profile.company}`}
                    </p>
                  </div>
                </div>
              )}

              {profile.school && (
                <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-dark-500">Education</p>
                    <p className="font-medium text-dark-900">{profile.school}</p>
                  </div>
                </div>
              )}

              {profile.relationshipGoal && (
                <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                  <Target className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-dark-500">Looking for</p>
                    <p className="font-medium text-dark-900">{profile.relationshipGoal}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-dark-900 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="primary" size="md">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {(onLike || onPass) && (
            <div className="sticky bottom-0 p-4 bg-white border-t border-dark-100 flex gap-4">
              {onPass && (
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={onPass}
                >
                  Pass
                </Button>
              )}
              {onLike && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={<Heart className="w-5 h-5" />}
                  onClick={onLike}
                >
                  Like
                </Button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
