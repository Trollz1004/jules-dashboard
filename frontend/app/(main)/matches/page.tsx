'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, Heart } from 'lucide-react';
import { MatchCard, NewMatchCard } from '@/components/features';
import { Input, SkeletonMatchCard } from '@/components/ui';
import { useMatchesStore } from '@/stores/matchesStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export default function MatchesPage() {
  const { user } = useAuthStore();
  const { matches, isLoading, loadMatches, onlineUsers } = useMatchesStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Separate new matches (no messages) from conversations
  const newMatches = matches.filter((m) => !m.lastMessage);
  const conversations = matches
    .filter((m) => m.lastMessage)
    .sort((a, b) => {
      const aTime = new Date(a.lastMessage?.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || 0).getTime();
      return bTime - aTime;
    });

  // Filter by search query
  const filteredConversations = searchQuery
    ? conversations.filter((m) =>
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-dark-100 safe-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-dark-900">Messages</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <Input
            placeholder="Search matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
      </header>

      <main>
        {/* New matches section */}
        {newMatches.length > 0 && (
          <section className="border-b border-dark-100">
            <div className="px-4 py-3">
              <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider">
                New Matches
              </h2>
            </div>
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
              {newMatches.map((match) => (
                <Link key={match.id} href={`/chat/${match.id}`}>
                  <NewMatchCard match={match} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Conversations section */}
        <section>
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider">
              Messages
            </h2>
          </div>

          {isLoading && matches.length === 0 ? (
            <div className="space-y-2 px-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonMatchCard key={i} />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              {searchQuery ? (
                <>
                  <p className="text-dark-500">No matches found for "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-dark-900 mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-dark-500 mb-4">
                    Start swiping to find your first match!
                  </p>
                  <Link
                    href="/discover"
                    className="btn-primary btn-md inline-flex items-center gap-2"
                  >
                    <Heart className="w-5 h-5" />
                    Start Swiping
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-dark-100">
              {filteredConversations.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isOnline={onlineUsers.has(match.user.id)}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
