import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { User } from '@/lib/api';
import socketClient from '@/lib/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; birthday: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { user, accessToken, refreshToken } = await api.login(email, password);

          api.setAccessToken(accessToken);
          api.setRefreshToken(refreshToken);

          socketClient.connect(accessToken);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const err = error as { message?: string };
          set({
            error: err.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      register: async (data: { email: string; password: string; name: string; birthday: string }) => {
        try {
          set({ isLoading: true, error: null });
          const { user, accessToken, refreshToken } = await api.register(data);

          api.setAccessToken(accessToken);
          api.setRefreshToken(refreshToken);

          socketClient.connect(accessToken);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const err = error as { message?: string };
          set({
            error: err.message || 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // Ignore logout errors
        } finally {
          socketClient.disconnect();
          api.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      loadUser: async () => {
        try {
          set({ isLoading: true });
          api.loadTokenFromStorage();

          const user = await api.getCurrentUser();

          const accessToken = localStorage.getItem('accessToken');
          if (accessToken) {
            socketClient.connect(accessToken);
          }

          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
