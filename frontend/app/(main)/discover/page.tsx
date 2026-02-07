'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Loader2, RefreshCw, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { SwipeCard, SwipeActions, MatchModal, ProfileDetails } from '@/components/features';
import { SkeletonSwipeCard } from '@/components/ui';
import { useDiscoverStore } from '@/stores/discoverStore';
import { useAuthStore } from '@/stores/authStore';
import { Match } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const {
    profiles,
    currentIndex,
    isLoading,
    error,
    lastSwipe,
    loadProfiles,
    likeProfile,
    passProfile,
    superLikeProfile,
    undoSwipe,
  } = useDiscoverStore();

  const [matchModal, setMatchModal] = useState<{ isOpen: boolean; match: Match | null }>({
    isOpen: false,
    match: null,
  });
  const [profileDetails, setProfileDetails] = useState({ isOpen: false });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const handleLike = useCallback(async () => {
    if (isAnimating || !currentProfile) return;
    setIsAnimating(true);
    setSwipeDirection('right');

    setTimeout(async () => {
      const result = await likeProfile();
      if (result?.matched && result.match) {
        setMatchModal({ isOpen: true, match: result.match });
      }
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentProfile, likeProfile]);

  const handlePass = useCallback(async () => {
    if (isAnimating || !currentProfile) return;
    setIsAnimating(true);
    setSwipeDirection('left');

    setTimeout(async () => {
      await passProfile();
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentProfile, passProfile]);

  const handleSuperLike = useCallback(async () => {
    if (isAnimating || !currentProfile) return;
    setIsAnimating(true);
    setSwipeDirection('up');

    setTimeout(async () => {
      const result = await superLikeProfile();
      if (result?.matched && result.match) {
        setMatchModal({ isOpen: true, match: result.match });
      } else {
        toast.success('Super Like sent!');
      }
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentProfile, superLikeProfile]);

  const handleUndo = useCallback(async () => {
    if (!lastSwipe) return;
    await undoSwipe();
    toast.success('Undo successful!');
  }, [lastSwipe, undoSwipe]);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 150;
      const { offset, velocity } = info;

      if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500) {
        if (offset.x > 0) {
          handleLike();
        } else {
          handlePass();
        }
      } else if (offset.y < -threshold || velocity.y < -500) {
        handleSuperLike();
      }
    },
    [handleLike, handlePass, handleSuperLike]
  );

  if (isLoading && profiles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <SkeletonSwipeCard />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-dark-500 mb-4">{error}</p>
            <button
              onClick={() => loadProfiles()}
              className="btn-secondary btn-md inline-flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">
              No more profiles
            </h2>
            <p className="text-dark-500 mb-6">
              You've seen everyone nearby. Check back later or expand your preferences.
            </p>
            <button
              onClick={() => loadProfiles()}
              className="btn-primary btn-md inline-flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Card stack */}
        <div className="relative w-full max-w-md mx-auto" style={{ aspectRatio: '3/4' }}>
          {/* Background card */}
          {nextProfile && (
            <div className="absolute inset-0 scale-[0.95] opacity-50">
              <SwipeCard profile={nextProfile} />
            </div>
          )}

          {/* Current card */}
          <AnimatePresence>
            {currentProfile && (
              <motion.div
                key={currentProfile.id}
                className="absolute inset-0"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: swipeDirection === 'left' ? -500 : swipeDirection === 'right' ? 500 : 0,
                  y: swipeDirection === 'up' ? -500 : 0,
                  rotate: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0,
                }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                drag={!isAnimating}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ touchAction: 'none' }}
              >
                <SwipeCard
                  profile={currentProfile}
                  onInfoClick={() => setProfileDetails({ isOpen: true })}
                />

                {/* Like/Nope stamps */}
                <motion.div
                  className="absolute top-8 right-8 px-4 py-2 text-4xl font-bold uppercase border-4 rounded-lg text-green-500 border-green-500"
                  style={{
                    rotate: -20,
                    opacity: swipeDirection === 'right' ? 1 : 0,
                  }}
                >
                  LIKE
                </motion.div>
                <motion.div
                  className="absolute top-8 left-8 px-4 py-2 text-4xl font-bold uppercase border-4 rounded-lg text-red-500 border-red-500"
                  style={{
                    rotate: 20,
                    opacity: swipeDirection === 'left' ? 1 : 0,
                  }}
                >
                  NOPE
                </motion.div>
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 text-4xl font-bold uppercase border-4 rounded-lg text-blue-500 border-blue-500"
                  style={{
                    opacity: swipeDirection === 'up' ? 1 : 0,
                  }}
                >
                  SUPER LIKE
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <SwipeActions
          onPass={handlePass}
          onLike={handleLike}
          onSuperLike={handleSuperLike}
          onUndo={handleUndo}
          canUndo={!!lastSwipe}
          disabled={isAnimating || !currentProfile}
          className="mt-6"
        />
      </main>

      {/* Profile details modal */}
      {currentProfile && (
        <ProfileDetails
          profile={currentProfile}
          isOpen={profileDetails.isOpen}
          onClose={() => setProfileDetails({ isOpen: false })}
          onLike={() => {
            setProfileDetails({ isOpen: false });
            handleLike();
          }}
          onPass={() => {
            setProfileDetails({ isOpen: false });
            handlePass();
          }}
        />
      )}

      {/* Match modal */}
      <MatchModal
        isOpen={matchModal.isOpen}
        onClose={() => setMatchModal({ isOpen: false, match: null })}
        match={matchModal.match}
        currentUserPhoto={user?.photos[0]?.url}
      />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-dark-100 safe-top">
      <div className="flex items-center justify-center h-14 px-4">
        <div className="flex items-center gap-2">
          <Heart className="w-7 h-7 text-primary-500 fill-current" />
          <span className="text-xl font-bold gradient-text">Spark</span>
        </div>
      </div>
    </header>
  );
}
