import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      authError: false,

      setToken: (token) => {
        set({
          token,
          isAuthenticated: !!token,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      setAuthError: () => {
        set({ authError: true });
      },

      clearAuthError: () => {
        set({ authError: false });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          authError: false,
        });

        if (typeof window !== 'undefined' && window.__queryClient) {
          window.__queryClient.clear();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        state.hasHydrated = true;
        state.isAuthenticated = !!state.token;

        if (state?.token) {
          console.log('[AuthStore] Rehydrated with token');
        }
      },
    }
  )
);

export default useAuthStore;
