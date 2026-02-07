'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Lock, Star, Sparkles } from 'lucide-react';
import { Button, Badge, SkeletonCard } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import api, { LikeReceived } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function LikesPage() {
  const { user } = useAuthStore();
  const [likes, setLikes] = useState<LikeReceived[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLikes = async () => {
      try {
        const data = await api.getLikesReceived();
        setLikes(data);
      } catch {
        // Premium feature - might fail for free users
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.isPremium) {
      loadLikes();
    } else {
      setIsLoading(false);
    }
  }, [user?.isPremium]);

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-dark-100 safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-dark-900">Likes</h1>
            {!user?.isPremium && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                Premium
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="p-4">
        {/* Premium Upgrade Banner (for free users) */}
        {!user?.isPremium && (
          <div className="bg-love-gradient rounded-2xl p-6 text-white mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Heart className="w-7 h-7 fill-current" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">See Who Likes You</h2>
                <p className="text-white/80 mt-1">
                  Upgrade to Premium to see everyone who has liked you and match with them instantly!
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    className="bg-white text-primary-600 hover:bg-white/90"
                  >
                    Upgrade Now
                  </Button>
                  <span className="text-white/60 text-sm">
                    From $9.99/month
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Likes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-dark-200 animate-pulse" />
            ))}
          </div>
        ) : user?.isPremium ? (
          likes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {likes.map((like) => (
                <LikeCard key={like.id} like={like} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-900 mb-2">
                No likes yet
              </h3>
              <p className="text-dark-500 mb-4">
                Keep swiping! Your likes will appear here.
              </p>
              <Link href="/discover">
                <Button>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Swiping
                </Button>
              </Link>
            </div>
          )
        ) : (
          // Blurred preview for free users
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-400 to-secondary-500"
              >
                {/* Blurred overlay */}
                <div className="absolute inset-0 backdrop-blur-xl bg-white/20" />

                {/* Lock icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Fake content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="w-24 h-4 bg-white/30 rounded mb-2" />
                  <div className="w-16 h-3 bg-white/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LikeCard({ like }: { like: LikeReceived }) {
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-dark-200 shadow-card">
      <Image
        src={like.user.photos[0]?.url || ''}
        alt={like.user.name}
        fill
        className="object-cover"
      />

      {/* Super like badge */}
      {like.isSuperLike && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Super Like
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-semibold">
          {like.user.name}, {like.user.age}
        </h3>
      </div>
    </div>
  );
}
