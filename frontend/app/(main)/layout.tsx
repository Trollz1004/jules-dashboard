'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/features';
import { useAuthStore } from '@/stores/authStore';
import { useMatchesStore } from '@/stores/matchesStore';
import { useSocket } from '@/hooks/useSocket';
import { Heart } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { matches, loadMatches } = useMatchesStore();
  const { isConnected } = useSocket();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMatches();
    }
  }, [isAuthenticated, loadMatches]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-16 h-16 text-primary-500 animate-heart-beat" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const unreadMessages = matches.reduce((sum, m) => sum + m.unreadCount, 0);
  const newMatches = matches.filter(m => !m.lastMessage).length;

  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav unreadMessages={unreadMessages} newMatches={newMatches} />
    </div>
  );
}
