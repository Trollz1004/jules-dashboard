import { create } from 'zustand';
import api, { Match } from '@/lib/api';
import socketClient from '@/lib/socket';

interface MatchesState {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  onlineUsers: Set<string>;

  // Actions
  loadMatches: () => Promise<void>;
  addMatch: (match: Match) => void;
  removeMatch: (matchId: string) => void;
  updateLastMessage: (matchId: string, content: string, senderId: string) => void;
  updateUnreadCount: (matchId: string, count: number) => void;
  markAsRead: (matchId: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  unmatch: (matchId: string) => Promise<void>;
  clearError: () => void;
  initializeSocketListeners: () => void;
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  matches: [],
  isLoading: false,
  error: null,
  onlineUsers: new Set(),

  loadMatches: async () => {
    try {
      set({ isLoading: true, error: null });
      const matches = await api.getMatches();
      set({ matches, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({
        error: err.message || 'Failed to load matches',
        isLoading: false
      });
    }
  },

  addMatch: (match: Match) => {
    set((state) => ({
      matches: [match, ...state.matches]
    }));
  },

  removeMatch: (matchId: string) => {
    set((state) => ({
      matches: state.matches.filter((m) => m.id !== matchId)
    }));
  },

  updateLastMessage: (matchId: string, content: string, senderId: string) => {
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              lastMessage: {
                content,
                createdAt: new Date().toISOString(),
                senderId
              }
            }
          : match
      )
    }));
  },

  updateUnreadCount: (matchId: string, count: number) => {
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? { ...match, unreadCount: count }
          : match
      )
    }));
  },

  markAsRead: (matchId: string) => {
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? { ...match, unreadCount: 0 }
          : match
      )
    }));
    socketClient.markAsRead(matchId);
  },

  setUserOnline: (userId: string) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.add(userId);
      return { onlineUsers: newOnlineUsers };
    });
  },

  setUserOffline: (userId: string) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    });
  },

  unmatch: async (matchId: string) => {
    try {
      await api.unmatch(matchId);
      get().removeMatch(matchId);
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || 'Failed to unmatch' });
    }
  },

  clearError: () => set({ error: null }),

  initializeSocketListeners: () => {
    socketClient.on('new_match', (match) => {
      get().addMatch(match);
    });

    socketClient.on('new_message', (message) => {
      get().updateLastMessage(message.matchId, message.content, message.senderId);

      // Increment unread count if the message is from the other user
      const match = get().matches.find((m) => m.id === message.matchId);
      if (match && message.senderId !== match.user.id) {
        get().updateUnreadCount(message.matchId, match.unreadCount + 1);
      }
    });

    socketClient.on('user_online', ({ userId }) => {
      get().setUserOnline(userId);
    });

    socketClient.on('user_offline', ({ userId }) => {
      get().setUserOffline(userId);
    });
  },
}));
