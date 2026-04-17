import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      user: null,
      theme: 'light',
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setTheme: (theme) => {
        set({ theme })
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
      toggleTheme: () => {
        const state = useStore.getState()
        const next = state.theme === 'dark' ? 'light' : 'dark'
        state.setTheme(next)
      },
    }),
    {
      name: 'aishow-storage',
      partialize: (state) => ({ user: state.user, theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)

export default useStore
