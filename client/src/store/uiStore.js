import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'en',
      dir: 'ltr',

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document if needed (for future dark mode)
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setLocale: (locale) => {
        const dir = locale === 'ar' ? 'rtl' : 'ltr';
        set({ locale, dir });

        // Update HTML dir attribute
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('dir', dir);
          document.documentElement.setAttribute('lang', locale);
        }
      },
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        // Apply persisted locale/theme on rehydration
        if (state) {
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('dir', state.dir);
            document.documentElement.setAttribute('lang', state.locale);
            if (state.theme === 'dark') {
              document.documentElement.classList.add('dark');
            }
          }
        }
      },
    }
  )
);

export default useUIStore;
