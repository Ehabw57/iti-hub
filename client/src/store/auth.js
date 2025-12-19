import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => {
        set({
          token,
          isAuthenticated: !!token,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        // Clear store state
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });

        // Clear React Query cache if available
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
        if (state?.token) {
          console.log('[AuthStore] Rehydrated with token');
        }
      },
    }
  )
);

export default useAuthStore;

