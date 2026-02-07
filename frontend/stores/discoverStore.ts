import { create } from 'zustand';
import api, { DiscoverProfile, Match } from '@/lib/api';

interface DiscoverState {
  profiles: DiscoverProfile[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  lastSwipe: { profile: DiscoverProfile; action: 'like' | 'pass' | 'super-like' } | null;

  // Actions
  loadProfiles: () => Promise<void>;
  likeProfile: () => Promise<{ matched: boolean; match?: Match } | null>;
  passProfile: () => Promise<void>;
  superLikeProfile: () => Promise<{ matched: boolean; match?: Match } | null>;
  undoSwipe: () => Promise<void>;
  nextProfile: () => void;
  clearError: () => void;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  profiles: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  lastSwipe: null,

  loadProfiles: async () => {
    try {
      set({ isLoading: true, error: null });
      const profiles = await api.getProfiles({ limit: 20 });
      set({ profiles, currentIndex: 0, isLoading: false });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({
        error: err.message || 'Failed to load profiles',
        isLoading: false
      });
    }
  },

  likeProfile: async () => {
    const { profiles, currentIndex } = get();
    const currentProfile = profiles[currentIndex];

    if (!currentProfile) return null;

    try {
      set({
        lastSwipe: { profile: currentProfile, action: 'like' }
      });

      const result = await api.likeProfile(currentProfile.id);
      get().nextProfile();
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || 'Failed to like profile' });
      return null;
    }
  },

  passProfile: async () => {
    const { profiles, currentIndex } = get();
    const currentProfile = profiles[currentIndex];

    if (!currentProfile) return;

    try {
      set({
        lastSwipe: { profile: currentProfile, action: 'pass' }
      });

      await api.passProfile(currentProfile.id);
      get().nextProfile();
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || 'Failed to pass profile' });
    }
  },

  superLikeProfile: async () => {
    const { profiles, currentIndex } = get();
    const currentProfile = profiles[currentIndex];

    if (!currentProfile) return null;

    try {
      set({
        lastSwipe: { profile: currentProfile, action: 'super-like' }
      });

      const result = await api.superLikeProfile(currentProfile.id);
      get().nextProfile();
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || 'Failed to super like profile' });
      return null;
    }
  },

  undoSwipe: async () => {
    const { lastSwipe, profiles, currentIndex } = get();

    if (!lastSwipe) return;

    try {
      await api.undoSwipe();

      // Add the profile back to the beginning of the remaining profiles
      const newProfiles = [...profiles];
      newProfiles.splice(currentIndex, 0, lastSwipe.profile);

      set({
        profiles: newProfiles,
        lastSwipe: null
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      set({ error: err.message || 'Failed to undo swipe' });
    }
  },

  nextProfile: () => {
    const { currentIndex, profiles } = get();
    const newIndex = currentIndex + 1;

    // Load more profiles when running low
    if (newIndex >= profiles.length - 3) {
      get().loadProfiles();
    }

    set({ currentIndex: newIndex });
  },

  clearError: () => set({ error: null }),
}));
