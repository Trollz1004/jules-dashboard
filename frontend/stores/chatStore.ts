import { create } from 'zustand';
import api, { Message, Match } from '@/lib/api';
import socketClient from '@/lib/socket';

interface ChatState {
  messages: Message[];
  currentMatch: Match | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  hasMore: boolean;
  typingUsers: Map<string, boolean>;

  // Actions
  loadMessages: (matchId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, type?: 'text' | 'image' | 'gif') => Promise<void>;
  addMessage: (message: Message) => void;
  setCurrentMatch: (match: Match | null) => void;
  startTyping: () => void;
  stopTyping: () => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  markAsRead: () => void;
  clearChat: () => void;
  clearError: () => void;
  initializeSocketListeners: () => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentMatch: null,
  isLoading: false,
  isSending: false,
  error: null,
  hasMore: true,
  typingUsers: new Map(),

  loadMessages: async (matchId: string) => {
    try {
      set({ isLoading: true, error: null, messages: [], hasMore: true });
      const messages = await api.getMessages(matchId, { limit: 50 });
      set({ messages: messages.reverse(), isLoading: false });

      // Join the match room for real-time updates
      socketClient.joinMatch(matchId);
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({
        error: err.message || 'Failed to load messages',
        isLoading: false
      });
    }
  },

  loadMoreMessages: async () => {
    const { currentMatch, messages, hasMore, isLoading } = get();

    if (!currentMatch || !hasMore || isLoading) return;

    try {
      set({ isLoading: true });
      const oldestMessage = messages[0];
      const olderMessages = await api.getMessages(currentMatch.id, {
        before: oldestMessage?.id,
        limit: 50
      });

      if (olderMessages.length < 50) {
        set({ hasMore: false });
      }

      set((state) => ({
        messages: [...olderMessages.reverse(), ...state.messages],
        isLoading: false
      }));
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({
        error: err.message || 'Failed to load more messages',
        isLoading: false
      });
    }
  },

  sendMessage: async (content: string, type: 'text' | 'image' | 'gif' = 'text') => {
    const { currentMatch } = get();

    if (!currentMatch || !content.trim()) return;

    try {
      set({ isSending: true, error: null });

      // Optimistically add the message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        matchId: currentMatch.id,
        senderId: 'current-user', // Will be replaced by actual user ID
        content,
        type,
        createdAt: new Date().toISOString()
      };

      set((state) => ({
        messages: [...state.messages, tempMessage]
      }));

      // Send via socket for real-time delivery
      socketClient.sendMessage(currentMatch.id, content, type);

      // Also send via API for persistence
      const message = await api.sendMessage(currentMatch.id, content, type);

      // Replace temp message with real message
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempMessage.id ? message : m
        ),
        isSending: false
      }));
    } catch (error: unknown) {
      const err = error as { message?: string };
      // Remove the temp message on error
      set((state) => ({
        messages: state.messages.filter((m) => !m.id.startsWith('temp-')),
        error: err.message || 'Failed to send message',
        isSending: false
      }));
    }
  },

  addMessage: (message: Message) => {
    set((state) => {
      // Avoid duplicates
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    });
  },

  setCurrentMatch: (match: Match | null) => {
    const { currentMatch } = get();

    // Leave the previous match room
    if (currentMatch && currentMatch.id !== match?.id) {
      socketClient.leaveMatch(currentMatch.id);
    }

    set({ currentMatch: match, messages: [], typingUsers: new Map() });
  },

  startTyping: () => {
    const { currentMatch } = get();
    if (currentMatch) {
      socketClient.startTyping(currentMatch.id);
    }
  },

  stopTyping: () => {
    const { currentMatch } = get();
    if (currentMatch) {
      socketClient.stopTyping(currentMatch.id);
    }
  },

  setUserTyping: (userId: string, isTyping: boolean) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      if (isTyping) {
        newTypingUsers.set(userId, true);
      } else {
        newTypingUsers.delete(userId);
      }
      return { typingUsers: newTypingUsers };
    });
  },

  markAsRead: () => {
    const { currentMatch } = get();
    if (currentMatch) {
      api.markMessagesRead(currentMatch.id);
      socketClient.markAsRead(currentMatch.id);
    }
  },

  clearChat: () => {
    const { currentMatch } = get();
    if (currentMatch) {
      socketClient.leaveMatch(currentMatch.id);
    }
    set({
      messages: [],
      currentMatch: null,
      typingUsers: new Map(),
      hasMore: true
    });
  },

  clearError: () => set({ error: null }),

  initializeSocketListeners: () => {
    const unsubscribeMessage = socketClient.on('new_message', (message) => {
      const { currentMatch } = get();
      if (currentMatch && message.matchId === currentMatch.id) {
        get().addMessage(message);
      }
    });

    const unsubscribeTyping = socketClient.on('user_typing', ({ matchId, userId, isTyping }) => {
      const { currentMatch } = get();
      if (currentMatch && matchId === currentMatch.id) {
        get().setUserTyping(userId, isTyping);
      }
    });

    const unsubscribeRead = socketClient.on('message_read', ({ matchId }) => {
      const { currentMatch } = get();
      if (currentMatch && matchId === currentMatch.id) {
        // Update read status of messages
        set((state) => ({
          messages: state.messages.map((m) => ({
            ...m,
            readAt: m.readAt || new Date().toISOString()
          }))
        }));
      }
    });

    // Return cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeRead();
    };
  },
}));
